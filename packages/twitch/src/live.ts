import {setTimeout as delay} from 'node:timers/promises';
export interface TwitchAuth {clientId:string;token:string;broadcasterId:string;botId:string}
function headers(auth:TwitchAuth):Record<string,string>{return {'Client-Id':auth.clientId,Authorization:'Bearer '+auth.token,'Content-Type':'application/json'};}
export async function subscribeChat(sessionId:string,auth:TwitchAuth,request:typeof fetch=fetch):Promise<void>{
 const result=await request('https://api.twitch.tv/helix/eventsub/subscriptions',{
  method:'POST',headers:headers(auth),body:JSON.stringify({type:'channel.chat.message',version:'1',condition:{broadcaster_user_id:auth.broadcasterId,user_id:auth.botId},transport:{method:'websocket',session_id:sessionId}}),signal:AbortSignal.timeout(5000)
 });
 if(!result.ok)throw Error('CHAT_SUBSCRIPTION_FAILED');
}
export function createChatSender(auth:TwitchAuth,request:typeof fetch=fetch):{send:(text:string)=>Promise<void>;stop:()=>void}{
 let tail:Promise<unknown>=Promise.resolve(),lastSent=-Infinity;
 const controller=new AbortController();
 return {
  send:text=>{
   const next=tail.then(async()=>{
    controller.signal.throwIfAborted();
    if([...text].length>500)throw Error('CHAT_MESSAGE_TOO_LONG');
    const wait=1000-(Date.now()-lastSent);
    if(wait>0)await delay(wait,undefined,{signal:controller.signal});
    lastSent=Date.now();
    const response=await request('https://api.twitch.tv/helix/chat/messages',{
     method:'POST',headers:headers(auth),body:JSON.stringify({broadcaster_id:auth.broadcasterId,sender_id:auth.botId,message:text}),
     signal:AbortSignal.any([controller.signal,AbortSignal.timeout(5000)])
    });
    if(!response.ok)throw Error('CHAT_SEND_FAILED');
    const body=await response.json() as {data?:{is_sent?:unknown}[]};
    if(body.data?.[0]?.is_sent!==true)throw Error('CHAT_SEND_FAILED');
   });
   tail=next.catch(()=>{});return next;
  },
  stop:()=>controller.abort()
 };
}
