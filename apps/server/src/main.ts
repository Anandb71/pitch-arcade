import {prepareAutoDemo,addDemoReviewPitches} from './auto-demo.js';
import {startClock} from './clock.js';
import {createArcade} from './app.js';
import {EventSubChatSource} from './chat.js';
import {createChatSender,subscribeChat,type TwitchAuth} from '../../../packages/twitch/src/live.js';
const env=process.env,mockTwitch=env.MOCK_TWITCH==='1',mockCodex=env.MOCK_CODEX==='1';
const number=(key:string,fallback:number,min:number,max:number)=>{
 const value=env[key]===undefined||env[key]===''?fallback:Number(env[key]);
 if(!Number.isFinite(value)||value<min||value>max)throw Error('Invalid setting: '+key);
 return value;
};
let source:EventSubChatSource|undefined,sender:ReturnType<typeof createChatSender>|undefined;
if(mockTwitch){
 if(env.MOCK_EVENTSUB_URL){
  const url=new URL(env.MOCK_EVENTSUB_URL);
  if(url.protocol!=='ws:'||!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Mock EventSub must use a local WebSocket server.');
  source=new EventSubChatSource({url:env.MOCK_EVENTSUB_URL});
 }
}else{
 const required=['TWITCH_CLIENT_ID','TWITCH_BOT_ACCESS_TOKEN','TWITCH_BROADCASTER_ID','TWITCH_BOT_ID'] as const;
 if(required.some(key=>!env[key]))throw Error('Set Twitch credentials, or use npm run demo.');
 const auth:TwitchAuth={clientId:env.TWITCH_CLIENT_ID!,token:env.TWITCH_BOT_ACCESS_TOKEN!,broadcasterId:env.TWITCH_BROADCASTER_ID!,botId:env.TWITCH_BOT_ID!};
 source=new EventSubChatSource();source.onWelcome=id=>subscribeChat(id,auth);sender=createChatSender(auth);
}
const arcade=await createArcade({
 dbPath:env.ARCADE_DB_PATH||'data/arcade.sqlite',mockTwitch,mockCodex,allowDemoControl:env.DEMO_AUTO==='1',
 stepMs:number('MOCK_FACTORY_STEP_MS',350,0,5000),
 cooldownMs:number('PITCH_COOLDOWN_MS',120000,0,86400000),
 queueCap:number('PITCH_QUEUE_CAP',20,1,20),maxJobsPerHour:number('FACTORY_MAX_JOBS_PER_HOUR',20,1,100),
 ...(source?{chatSource:source}:{}),...(sender?{sendChat:sender.send}: {})
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
}catch{clearInterval(pump);stopClock();source?.stop();sender?.stop();await arcade.close();throw Error('Could not start the local arcade server.');}
let closing=false;
const close=async()=>{if(closing)return;closing=true;clearInterval(pump);stopClock();source?.stop();sender?.stop();await arcade.close();};
process.once('SIGINT',close);process.once('SIGTERM',close);

if(env.DEMO_AUTO==='1'&&mockTwitch&&mockCodex){
 void prepareAutoDemo(arcade).then(()=>addDemoReviewPitches(arcade)).catch(()=>{console.error('The scripted demo could not finish preparing.');});
}
