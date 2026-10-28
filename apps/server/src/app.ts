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
import {panel} from './panel.js';
import type {FactoryStep} from './codex-events.js';
export interface ArcadeOptions {
 dbPath?:string;mockTwitch?:boolean;mockCodex?:boolean;seedLibrary?:boolean;seedDir?:string;stepMs?:number;
 cooldownMs?:number;queueCap?:number;maxJobsPerHour?:number;timeoutMs?:number;jobsRoot?:string;
 chatSource?:ChatSource;runner?:CodexRunner;moderator?:Moderator;sendChat?:(text:string)=>Promise<void>;
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
 const runner=options.runner??((options.mockCodex??process.env.MOCK_CODEX==='1')?new MockCodexRunner({stepMs:options.stepMs??350,examplesDir:options.seedDir??resolve('library')}):new CodexCliRunner({model:process.env.FACTORY_MODEL||'gpt-6-luna'}));
 const factory=new Factory(store,runner,{
  ...(options.jobsRoot?{jobsRoot:options.jobsRoot}:{}),...(options.timeoutMs!==undefined?{timeoutMs:options.timeoutMs}:{}),
  ...(options.maxJobsPerHour!==undefined?{maxJobsPerHour:options.maxJobsPerHour}:{}),
  emit:(pitchId,step)=>{steps.push({pitchId,...step});if(steps.length>100)steps.shift();broadcast({type:'factory.step',pitchId,...step});},
  complete:async(pitch,dir,receipt)=>{
   const result=validateJobOutput(dir);
   if(result.ok)library.addBuilt(pitch,result,receipt);
   else{
    store.setPitch(pitch.id,'rejected',result.issues.map(i=>i.code).join(','));
    store.event('game.validation_rejected',{pitchId:pitch.id,codes:result.issues.map(i=>i.code)},Date.now(),pitch.user_id);
   }
   broadcast({type:'factory.validated',pitchId:pitch.id,pass:result.ok});
  }
 });
 const intake=new Intake(store,{
  cooldownMs:options.cooldownMs??120000,queueCap:options.queueCap??20,moderator:options.moderator??moderatorFromEnv(),
  onToggle:enabled=>{if(enabled)factory.kick();else factory.pause();broadcast({type:'arcade.toggle',enabled});}
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
 app.get('/',async(_request,reply)=>reply.header('Content-Security-Policy',"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'").type('text/html').send(panel(mockTwitch)));
 app.get('/play/',async(_request,reply)=>reply.type('text/html').send(readFileSync(resolve('dist/web/apps/play/index.html'),'utf8')));
 app.get<{Params:{file:string}}>('/assets/:file',async(request,reply)=>{
  const file=request.params.file;if(!/^[a-zA-Z0-9_.-]+\.(js|css|woff2|svg)$/.test(file))return reply.code(404).send();
  try{return reply.type(file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream').send(readFileSync(join(resolve('dist/web/assets'),file)));}catch{return reply.code(404).send();}
 });
 app.get('/api/health',async()=>({app:'pitch-arcade',mockTwitch,mockCodex:runner.model==='mock replay'}));
 app.get('/api/state',async()=>({enabled:store.enabled,pitches:store.pitches(),games:library.all(),steps,acks:acks.map(a=>a.text),builds:store.db.all('SELECT id,pitch_id,model,status,receipt_json FROM builds ORDER BY id DESC LIMIT 20')}));
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
  broadcast({type:'game.rejected',gameId:request.params.id});return {ok:true};
 });
 app.post<{Body:{enabled:boolean}}>('/api/arcade',{schema:{body:{type:'object',required:['enabled'],additionalProperties:false,properties:{enabled:{type:'boolean'}}}}},async request=>{
  store.enabled=request.body.enabled;if(store.enabled)factory.kick();else factory.pause();return {enabled:store.enabled};
 });
 app.post<{Params:{login:string}}>('/api/users/:login/forget',{schema:{params:{type:'object',required:['login'],properties:{login:{type:'string',pattern:'^[a-zA-Z0-9_]{1,25}$'}}}}},async request=>{
  const pitches=store.pitches().filter(p=>p.login.toLowerCase()===request.params.login.toLowerCase());
  const userIds=new Set(pitches.map(p=>p.user_id));
  factory.cancelPitches(pitches.map(p=>p.id));
  const deleted=store.forget(request.params.login);
  for(let i=acks.length-1;i>=0;i--)if(userIds.has(acks[i]!.userId))acks.splice(i,1);
  for(let i=steps.length-1;i>=0;i--)if(pitches.some(p=>p.id===steps[i]!.pitchId))steps.splice(i,1);
  results.clear();broadcast({type:'user.forgotten'});return {deleted};
 });
 app.server.on('upgrade',(request,socket,head)=>{
  if(request.url!=='/events'||!trustedOrigin(request.headers.origin,request.headers.host)){socket.destroy();return;}
  sockets.handleUpgrade(request,socket,head,ws=>{ws.on('error',()=>{});sockets.emit('connection',ws,request);});
 });
 app.addHook('onClose',async()=>{
  closing=true;intake.stop();
  for(const stop of unsubscribe)stop();
  await intake.idle();
  factory.stop();await factory.idle();
  for(const socket of sockets.clients)socket.terminate();
  await new Promise<void>(resolve=>sockets.close(()=>resolve()));
  store.close();
 });
 await app.ready();factory.kick();
 return {app,store,library,intake,factory,source,close:()=>app.close()};
}
