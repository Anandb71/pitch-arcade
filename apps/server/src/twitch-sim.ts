import {startEventSubMock} from '../../../packages/twitch/src/mock.js';
import {startFakeHelix} from '../../../packages/twitch/src/fake-helix.js';
import {EventSubChatSource} from '../../../packages/twitch/src/chat.js';
import {HelixClient} from '../../../packages/twitch/src/helix.js';
export async function simulatedTwitch(){
 const mock=await startEventSubMock(),fake=await startFakeHelix();
 const helix=new HelixClient({clientId:'simulated-client',broadcasterId:'broadcaster',botId:'bot',token:async()=>'simulated-token',baseUrl:fake.url});
 const source=new EventSubChatSource({url:mock.url});let readyResolve:()=>void=()=>{};const ready=new Promise<void>(r=>{readyResolve=r;});source.onWelcome=async(id,options)=>{await helix.subscribe(id,options);readyResolve();};const keepalive=setInterval(()=>mock.keepalive(),4000);
 return {source,helix,mock,fake,ready,stop:async()=>{clearInterval(keepalive);source.stop();helix.stop();await mock.close();await fake.close();}};
}
