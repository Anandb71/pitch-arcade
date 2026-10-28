import {HelixClient} from './helix.js';
export interface TwitchAuth {clientId:string;token:string;broadcasterId:string;botId:string}
const client=(auth:TwitchAuth,request:typeof fetch)=>new HelixClient({clientId:auth.clientId,broadcasterId:auth.broadcasterId,botId:auth.botId,token:async()=>auth.token,request});
/** Compatibility helpers share the same paced client as the live server. */
export async function subscribeChat(sessionId:string,auth:TwitchAuth,request:typeof fetch=fetch):Promise<void>{const helix=client(auth,request);try{await helix.subscribe(sessionId);}finally{helix.stop();}}
export function createChatSender(auth:TwitchAuth,request:typeof fetch=fetch):{send:(text:string)=>Promise<void>;stop:()=>void}{const helix=client(auth,request);return {send:text=>helix.sendChat(text),stop:()=>helix.stop()};}
