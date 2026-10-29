import {VideoDemo,VideoRunner} from './video-demo.js';
import {prepareAutoDemo,addDemoReviewPitches} from './auto-demo.js';
import {startClock} from './clock.js';
import {createArcade} from './app.js';
import {EventSubChatSource} from './chat.js';
import {liveTwitch} from './twitch-runtime.js';
import {simulatedTwitch} from './twitch-sim.js';
import {RealResultsSink} from './results.js';
const env=process.env,mockTwitch=env.MOCK_TWITCH==='1',mockCodex=env.MOCK_CODEX==='1';
const number=(key:string,fallback:number,min:number,max:number)=>{
 const value=env[key]===undefined||env[key]===''?fallback:Number(env[key]);
 if(!Number.isFinite(value)||value<min||value>max)throw Error('Invalid setting: '+key);
 return value;
};
let source:EventSubChatSource|undefined;
let live:Awaited<ReturnType<typeof liveTwitch>>|undefined,sim:Awaited<ReturnType<typeof simulatedTwitch>>|undefined;
try{
 if(env.TWITCH_SIM==='1'){sim=await simulatedTwitch();source=sim.source;}
 else if(mockTwitch){if(env.MOCK_EVENTSUB_URL)source=new EventSubChatSource({url:env.MOCK_EVENTSUB_URL});}
 else{live=await liveTwitch();source=live.source;}
}catch(error){console.error(error instanceof Error?error.message:'Twitch could not connect.');process.exit(1);}
const helix=sim?.helix??live?.helix;
const stopTwitch=async()=>{source?.stop();live?.stop();await sim?.stop();};
const videoRunner=env.DEMO_VIDEO==='1'?new VideoRunner():undefined;
const arcade=await createArcade({
 ...(videoRunner?{runner:videoRunner}:{}),
 dbPath:env.ARCADE_DB_PATH||'data/arcade.sqlite',mockTwitch,mockCodex,allowDemoControl:env.DEMO_AUTO==='1',
 stepMs:number('MOCK_FACTORY_STEP_MS',350,0,5000),
 cooldownMs:number('PITCH_COOLDOWN_MS',120000,0,86400000),
 queueCap:number('PITCH_QUEUE_CAP',20,1,20),maxJobsPerHour:number('FACTORY_MAX_JOBS_PER_HOUR',20,1,100),
 ...(source?{chatSource:source}:{}),...(helix?{sendChat:(text:string)=>helix.sendChat(text),resultsSink:new RealResultsSink(helix,!!sim)}:{})
});
const stopClock=startClock(()=>arcade.gauntlet.tick());
const pump=setInterval(()=>arcade.factory.kick(),1000);
try{
 const url=await arcade.app.listen({host:'127.0.0.1',port:number('PORT',3000,1,65535)});
 source?.start();console.log('Pitch Arcade is ready.');
 console.log('Play: '+url+'/play/');console.log('Overlay: '+url+'/overlay/');console.log('Dashboard: '+url+'/dashboard/');console.log('Mock chat: '+url+'/chat/');
 console.log('OBS: add a browser source with the overlay URL, width 1920 and height 1080. Capture the play window separately.');
 console.log(mockTwitch?'Mock chat is enabled.':'Live EventSub chat is enabled.');
 console.log(mockCodex?'Factory steps are simulated.':'Factory uses the installed Codex CLI with a verified sandbox.');
}catch{clearInterval(pump);stopClock();await stopTwitch();await arcade.close();throw Error('Could not start the local arcade server.');}
let stopVideo=()=>{};
let closing=false;
const close=async()=>{if(closing)return;closing=true;stopVideo();clearInterval(pump);stopClock();await stopTwitch();await arcade.close();};
process.once('SIGINT',close);process.once('SIGTERM',close);

if(env.DEMO_AUTO==='1'&&mockTwitch&&mockCodex&&!sim){
 void prepareAutoDemo(arcade).then(()=>addDemoReviewPitches(arcade)).catch(()=>{console.error('The scripted demo could not finish preparing.');});
}

if(sim){
 await sim.ready;console.log('Simulated Twitch uses real EventSub and Helix client code. Clip URLs are fixtures.');
 void (async()=>{
  for(const [login,text,role] of [['priya','!pitch dodge tacos','viewer'],['lee','!pitch pop bubbles','vip'],['mira','!pitch catch berries','mod']]){sim!.mock.chat(login!,text!,role!);await new Promise(r=>setTimeout(r,250));}
  await new Promise(r=>setTimeout(r,500));await arcade.factory.idle();for(const game of arcade.library.all().filter(g=>g.status==='built'))arcade.library.approve(game.id,'simulated host');arcade.gauntlet.start({seed:1,autoplay:true});
 })().catch(()=>console.error('The simulated scenario could not prepare.'));
}

if(videoRunner){
 const video=new VideoDemo(arcade,videoRunner,number('DEMO_VIDEO_SEED',8,0,4294967295),env.DEMO_VIDEO_HOLD==='1');
 console.log('VIDEO: 110 second repeatable cycle. Seed '+video.seed+'. All builds and chat are simulated.');
 console.log('Record play: http://127.0.0.1:'+(env.PORT||3000)+'/play/?sound=1');
 console.log('Record overlay: http://127.0.0.1:'+(env.PORT||3000)+'/overlay/?backdrop=1&sound=0');
 console.log('Checklist: open both pages, click play once for audio, capture at 1920 by 1080, wait for the next loop. Use --hold to keep final credits.');
 let timer:ReturnType<typeof setTimeout>|undefined,stopped=false,started=performance.now();
 stopVideo=()=>{stopped=true;if(timer)clearTimeout(timer);};
 await video.begin();started=performance.now();
 const advance=async()=>{
  if(stopped)return;
  try{const status=await video.tick(performance.now()-started);
   if(status==='hold'){console.log('VIDEO: final leaderboard is held.');return;}
   if(status==='loop'){console.log('VIDEO: cycle complete.');video.next();await video.begin();started=performance.now();}
  }catch{console.error('VIDEO: safely restarting the simulated cycle.');try{await video.begin();started=performance.now();}catch{stopVideo();return;}}
  if(!stopped)timer=setTimeout(()=>void advance(),100);
 };void advance();
}
