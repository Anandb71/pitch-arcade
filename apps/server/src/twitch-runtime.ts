import {EventSubChatSource,eventSubDiagnosticLabel} from '../../../packages/twitch/src/chat.js';
import {HelixClient} from '../../../packages/twitch/src/helix.js';
import {TokenManager,loadTokens,saveTokens,tokenPath} from '../../../packages/twitch/src/oauth.js';
export function missingTwitch(env:NodeJS.ProcessEnv):string[]{return ['TWITCH_CLIENT_ID','TWITCH_CLIENT_SECRET','TWITCH_BROADCASTER_LOGIN','TWITCH_BOT_LOGIN'].filter(key=>!env[key]);}
export async function liveTwitch(env:NodeJS.ProcessEnv=process.env){
 const missing=missingTwitch(env);if(missing.length)throw Error('Let us connect Twitch first. Set '+missing.join(', ')+' in .env, then run npm run auth. For a credential free session use npm run demo.');
 const path=tokenPath();let tokens;try{tokens=loadTokens(path);}catch{throw Error('Run npm run auth to connect Twitch and save a private token file outside the project.');}
 for(const role of ['bot','broadcaster'] as const)if(tokens[role]?.login.toLowerCase()!==env[role==='bot'?'TWITCH_BOT_LOGIN':'TWITCH_BROADCASTER_LOGIN']!.toLowerCase())throw Error('Saved Twitch logins do not match .env. Run npm run auth.');
 const manager=new TokenManager({clientId:env.TWITCH_CLIENT_ID!,clientSecret:env.TWITCH_CLIENT_SECRET!,tokens,save:t=>saveTokens(path,t)});
 await Promise.all((['bot','broadcaster'] as const).map(role=>manager.validate(role)));
 const helix=new HelixClient({clientId:env.TWITCH_CLIENT_ID!,broadcasterId:manager.account('broadcaster').userId,botId:manager.account('bot').userId,token:role=>manager.access(role),refresh:role=>manager.validate(role),pin:env.TWITCH_PIN==='1',marker:env.TWITCH_MARKERS==='1'});
 const source=new EventSubChatSource({...(env.TWITCH_EVENTSUB_URL?{url:env.TWITCH_EVENTSUB_URL}:{}),onError:cause=>console.error('Twitch chat is reconnecting. Events during a drop cannot be replayed. Cause: '+eventSubDiagnosticLabel(cause))});source.onWelcome=(id,options)=>helix.subscribe(id,options);
 const stopMonitor=manager.monitor(()=>{source.stop();helix.stop();console.error('Twitch authorization ended. Run npm run auth to reconnect.');});
 return {source,helix,stop:()=>{stopMonitor();source.stop();helix.stop();}};
}
