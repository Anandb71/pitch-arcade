import {recentDigest,mechanicsKey} from './quality.js';
import {scoreboard} from './scoreboard.js';
import Fastify from 'fastify';
import {WebSocketServer,WebSocket} from 'ws';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {FakeChatSource,roles,type ChatMessage,type ChatSource} from './chat.js';
import {Repository,openSqlite} from './storage.js';
import {Intake,type IntakeResult} from './intake.js';
import {moderatorFromEnv,type Moderator} from './moderation.js';
import {Factory} from './factory.js';
import {CodexCliRunner,MockCodexRunner,type CodexRunner} from './runners.js';
import {Library} from './library.js';
import {validateJobOutput} from './validator.js';
import {Gauntlet} from './gauntlet.js';
import {MockResultsSink,type ResultsSink} from './results.js';
import {SettingsStore} from './settings.js';
import type {Settings,ArcadeState} from '../../../packages/shared/src/protocol.js';
import type {FactoryStep} from './codex-events.js';
export interface ArcadeOptions {
 dbPath?:string;mockTwitch?:boolean;mockCodex?:boolean;seedLibrary?:boolean;seedDir?:string;stepMs?:number;
 cooldownMs?:number;queueCap?:number;maxJobsPerHour?:number;timeoutMs?:number;jobsRoot?:string;
 resultsSink?:ResultsSink;allowDemoControl?:boolean;chatSource?:ChatSource;runner?:CodexRunner;moderator?:Moderator;sendChat?:(text:string)=>Promise<void>;
}
const trustedHost=(host:string|undefined):boolean=>!!host&&/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host);
function trustedOrigin(origin:string|undefined,host:string|undefined):boolean {
 if(!trustedHost(host))return false;if(!origin)return true;
 try{const url=new URL(origin);return url.host===host&&(url.protocol==='http:'||url.protocol==='https:');}catch{return false;}
}
export async function createArcade(options:ArcadeOptions={}){
 const path=options.dbPath??resolve('data/arcade.sqlite');if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
 const store=new Repository(openSqlite(path)),library=new Library(store);
 try{if(options.seedLibrary!==false)library.importSeeds(options.seedDir??resolve('library'));}catch(error){store.close();throw error;}
 const settings=new SettingsStore(store);
 let closing=false;
 const app=Fastify({logger:false,bodyLimit:4096,trustProxy:false});
 const mockTwitch=options.mockTwitch??process.env.MOCK_TWITCH==='1';
 const source=new FakeChatSource(),results=new Map<string,IntakeResult>();
 const steps:(FactoryStep&{pitchId:number})[]=[];
 const acks:{userId:string;text:string}[]=[];
 const sockets=new WebSocketServer({noServer:true,maxPayload:4096});
 const broadcast=(value:unknown)=>{
  const raw=JSON.stringify(value);
  for(const client of sockets.clients)if(client.readyState===WebSocket.OPEN){
   if(client.bufferedAmount>1048576)client.terminate();else client.send(raw);
  }
 };
 const runner=options.runner??((options.mockCodex??process.env.MOCK_CODEX==='1')?new MockCodexRunner({stepMs:options.stepMs??350}):new CodexCliRunner({model:process.env.FACTORY_MODEL||'gpt-6.1-sol'}));
 const catalog=()=>library.all().map(game=>game.spec);
 const factory=new Factory(store,runner,{
  context:()=>({recent:recentDigest(catalog()),knownFingerprints:catalog().slice(-256).map(mechanicsKey)}),
  ...(options.jobsRoot?{jobsRoot:options.jobsRoot}:{}),...(options.timeoutMs!==undefined?{timeoutMs:options.timeoutMs}:{}),
  ...(options.maxJobsPerHour!==undefined?{maxJobsPerHour:options.maxJobsPerHour}:{}),
  emit:(pitchId,step)=>{steps.push({pitchId,...step});if(steps.length>100)steps.shift();broadcast({type:'factory.step',pitchId,...step});},
  complete:async(pitch,dir,receipt)=>{
   const result=validateJobOutput(dir,settings.read().denylist,catalog());
   if(result.ok){const id=library.addBuilt(pitch,result,receipt);const policy=settings.read();if((pitch.role==='mod'&&policy.autoApproveMods)||(pitch.role==='vip'&&policy.autoApproveVips))library.approve(id,'auto rule: '+pitch.role);}
   else{
    if(result.issues.every(issue=>issue.code.startsWith('FUN_')))return {retry:result.issues};
    store.setPitch(pitch.id,'rejected',result.issues.map(i=>i.code).join(','));
    store.event('game.validation_rejected',{pitchId:pitch.id,codes:result.issues.map(i=>i.code)},Date.now(),pitch.user_id);
   }
   broadcast({type:'factory.validated',pitchId:pitch.id,pass:result.ok});
  }
 });
 const resultsSink:ResultsSink=options.resultsSink??new MockResultsSink(item=>{
  if(item.kind==='chat'){acks.push({userId:item.authorId??'',text:'Mock results: '+item.text});if(acks.length>50)acks.shift();}
  broadcast({type:'result',item});
 });
 const unsubscribeResults=resultsSink.subscribe?.(item=>{if(item.kind==='chat'){acks.push({userId:item.authorId??'',text:(item.simulated?'Simulated Twitch: ':'Twitch: ')+item.text});if(acks.length>50)acks.shift();}broadcast({type:'result',item});});
 app.addHook('onClose',async()=>{unsubscribeResults?.();});
 let scoreRevision='';
 const gauntlet=new Gauntlet(store,library,resultsSink,state=>{broadcast({type:'gauntlet',state});const revision=state.id+':'+state.outcomes.length+':'+(state.phase==='finished');if(revision!==scoreRevision){scoreRevision=revision;broadcast({type:'leaderboards.changed'});}});
 const getState=():ArcadeState=>({scoreboards:scoreboard(store),enabled:store.enabled,mockTwitch,mockCodex:runner.model==='mock replay',pitches:store.pitches(),games:library.all(),steps,acks:acks.map(a=>a.text),builds:store.db.all('SELECT id,pitch_id,model,status,receipt_json FROM builds ORDER BY id DESC LIMIT 20'),gauntlet:gauntlet.state,leaderboard:store.db.all('SELECT login,beats,games_approved AS gamesApproved FROM users WHERE beats>0 ORDER BY beats DESC,login LIMIT 5'),resultTicker:resultsSink.items??[],settings:settings.read()});
 const intake=new Intake(store,{
  getDenylist:()=>settings.read().denylist,cooldownMs:options.cooldownMs??120000,queueCap:options.queueCap??20,moderator:options.moderator??moderatorFromEnv(),
  onToggle:enabled=>{if(enabled)factory.kick();else{factory.pause();gauntlet.stop();}broadcast({type:'arcade.toggle',enabled});}
 });
 const receive=async(message:ChatMessage)=>{
  const result=await intake.handle(message);results.set(message.id,result);
  if(results.size>1000)results.delete(results.keys().next().value!);
  if(result.message){
   acks.push({userId:message.userId,text:result.message});if(acks.length>50)acks.shift();
   if(options.sendChat)void options.sendChat(result.message).catch(()=>{if(!closing)store.event('chat.send_failed',{});});
  }
  factory.kick();broadcast({type:'pitch.handled',code:result.code});
 };
 const unsubscribe=[source.subscribe(receive)];
 if(options.chatSource)unsubscribe.push(options.chatSource.subscribe(receive));
 app.addHook('onRequest',async(request,reply)=>{
  if(!trustedOrigin(request.headers.origin,request.headers.host))return reply.code(403).send({error:'Local control only.'});
  if(!['GET','HEAD'].includes(request.method)&&request.headers['x-arcade-control']!=='local')return reply.code(403).send({error:'A local control header is required.'});
 });
 app.setErrorHandler((_error,_request,reply)=>reply.code(400).send({error:'That request could not be handled.'}));
 const html=(path:string,reply:import('fastify').FastifyReply)=>reply.header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'self'").type('text/html').send(readFileSync(resolve(path),'utf8'));
 app.get('/',async(_request,reply)=>html('dist/web/apps/dashboard/index.html',reply));
 app.get('/dashboard/',async(_request,reply)=>html('dist/web/apps/dashboard/index.html',reply));
 app.get('/chat/',async(_request,reply)=>html('dist/web/apps/dashboard/chat.html',reply));
 app.get('/overlay/',async(_request,reply)=>html('dist/web/apps/overlay/index.html',reply));
 app.get('/play/',async(_request,reply)=>html('dist/web/apps/play/index.html',reply));
 app.get<{Params:{file:string}}>('/assets/:file',async(request,reply)=>{
  const file=request.params.file;if(!/^[a-zA-Z0-9_.-]+\.(js|css|woff2|svg)$/.test(file))return reply.code(404).send();
  try{return reply.type(file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream').send(readFileSync(join(resolve('dist/web/assets'),file)));}catch{return reply.code(404).send();}
 });
 app.get('/api/health',async()=>({app:'pitch-arcade',mockTwitch,mockCodex:runner.model==='mock replay'}));
 app.get('/api/state',async()=>getState());
 app.get('/api/leaderboards',async()=>scoreboard(store));
 app.get('/api/library',async()=>library.approved());
 if(mockTwitch)app.post<{Body:{login:string;role:ChatMessage['role'];text:string;id?:string}}>('/api/mock/chat',{
  schema:{body:{type:'object',required:['login','role','text'],additionalProperties:false,properties:{login:{type:'string',pattern:'^[a-zA-Z0-9_]{1,25}$'},role:{type:'string',enum:roles},text:{type:'string',maxLength:512},id:{type:'string',minLength:1,maxLength:100}}}}
 },async request=>{
  const {login,role,text,id}=request.body,messageId=id??randomUUID();
  await source.publish({id:messageId,userId:'mock:'+login.toLowerCase(),login:login.toLowerCase(),displayName:login,role,text});
  const result=results.get(messageId);results.delete(messageId);return result;
 });
 const idSchema={params:{type:'object',required:['id'],properties:{id:{type:'integer',minimum:1}}}};
 app.post<{Params:{id:number}}>('/api/games/:id/approve',{schema:idSchema},async(request,reply)=>{
  if(!library.approve(request.params.id,'local streamer'))return reply.code(409).send({error:'This game cannot be approved.'});
  broadcast({type:'game.approved',gameId:request.params.id});return {ok:true};
 });
 app.post<{Params:{id:number}}>('/api/games/:id/reject',{schema:idSchema},async(request,reply)=>{
  if(!library.reject(request.params.id))return reply.code(404).send({error:'Game not found.'});
  gauntlet.rejectGame(request.params.id);
  broadcast({type:'game.rejected',gameId:request.params.id});return {ok:true};
 });
 app.post<{Body:{enabled:boolean}}>('/api/arcade',{schema:{body:{type:'object',required:['enabled'],additionalProperties:false,properties:{enabled:{type:'boolean'}}}}},async request=>{
  intake.interrupt();store.enabled=request.body.enabled;if(store.enabled)factory.kick();else{factory.pause();gauntlet.stop();}broadcast({type:'arcade.toggle',enabled:store.enabled});return {enabled:store.enabled};
 });
 app.post<{Params:{login:string}}>('/api/users/:login/forget',{schema:{params:{type:'object',required:['login'],properties:{login:{type:'string',pattern:'^[a-zA-Z0-9_]{1,25}$'}}}}},async request=>{
  intake.forget(request.params.login);
  const pitches=store.pitches().filter(p=>p.login.toLowerCase()===request.params.login.toLowerCase());
  const userIds=new Set(pitches.map(p=>p.user_id));
  gauntlet.forget(userIds);resultsSink.forget?.(userIds);
  factory.cancelPitches(pitches.map(p=>p.id));
  const deleted=store.forget(request.params.login);
  for(let i=acks.length-1;i>=0;i--)if(userIds.has(acks[i]!.userId))acks.splice(i,1);
  for(let i=steps.length-1;i>=0;i--)if(pitches.some(p=>p.id===steps[i]!.pitchId))steps.splice(i,1);
  results.clear();broadcast({type:'user.forgotten'});return {deleted};
 });
 app.post<{Body:Settings}>('/api/settings',{schema:{body:{type:'object',required:['autoApproveMods','autoApproveVips','denylist'],additionalProperties:false,properties:{autoApproveMods:{type:'boolean'},autoApproveVips:{type:'boolean'},denylist:{type:'array',maxItems:50,items:{type:'string',minLength:1,maxLength:40}}}}}},async request=>{const value=settings.save(request.body);broadcast({type:'controls.updated'});return value;});
 app.post<{Body:{seed?:number;autoplay?:boolean}}>('/api/gauntlet/start',{schema:{body:{type:'object',additionalProperties:false,properties:{seed:{type:'integer',minimum:0,maximum:4294967295},autoplay:{type:'boolean'}}}}},async(request,reply)=>{
  if(!store.enabled)return reply.code(409).send({error:'Resume the arcade first.'});
  if(request.body?.autoplay&&!mockTwitch)return reply.code(400).send({error:'Bot play is available only in mock mode.'});
  try{gauntlet.start(request.body??{});return gauntlet.state;}catch{return reply.code(409).send({error:'Finish the current gauntlet and approve at least five games.'});}
 });
 app.post('/api/gauntlet/skip',async()=>{gauntlet.skip();return gauntlet.state;});
 app.post('/api/gauntlet/stop',async()=>{gauntlet.stop();return gauntlet.state;});
 if(options.allowDemoControl&&mockTwitch)app.post<{Body:{frozen:boolean}}>('/api/demo/freeze',{schema:{body:{type:'object',required:['frozen'],properties:{frozen:{type:'boolean'}}}}},async request=>{gauntlet.frozen=request.body.frozen;return {frozen:gauntlet.frozen};});
 let playerSocket:WebSocket|undefined;
 app.server.on('upgrade',(request,socket,head)=>{
  if(request.url!=='/events'||!trustedOrigin(request.headers.origin,request.headers.host)){socket.destroy();return;}
  sockets.handleUpgrade(request,socket,head,ws=>{
   ws.on('error',()=>{});
   ws.send(JSON.stringify({type:'arcade',state:getState()}));
   ws.on('message',raw=>{
    try{
     const value=JSON.parse(raw.toString()) as {type?:string;control?:string;input?:unknown};
     if(value.control!=='local')return;
     if(value.type==='claim-player'){
      if(playerSocket&&playerSocket!==ws&&playerSocket.readyState===WebSocket.OPEN)playerSocket.send(JSON.stringify({type:'player-control',granted:false}));
      playerSocket=ws;gauntlet.setInput({});ws.send(JSON.stringify({type:'player-control',granted:true}));
     }else if(value.type==='input'&&ws===playerSocket&&value.input&&typeof value.input==='object')gauntlet.setInput(value.input);
    }catch{/* Invalid player messages are ignored. */}
   });
   ws.on('close',()=>{if(playerSocket===ws){playerSocket=undefined;gauntlet.setInput({});}});
   sockets.emit('connection',ws,request);
  });
 });
 app.addHook('onClose',async()=>{
  closing=true;intake.stop();
  for(const stop of unsubscribe)stop();
  await intake.idle();
  gauntlet.stop();factory.stop();await factory.idle();
  for(const socket of sockets.clients)socket.terminate();
  await new Promise<void>(resolve=>sockets.close(()=>resolve()));
  store.close();
 });
 await app.ready();factory.kick();
 const announce=(text:string)=>{acks.push({userId:'',text});if(acks.length>50)acks.shift();broadcast({type:'demo.notice'});void Promise.resolve(resultsSink.chat(text,null)).catch(()=>{});};
 return {app,store,library,intake,factory,source,gauntlet,resultsSink,getState,announce,close:()=>app.close()};
}
