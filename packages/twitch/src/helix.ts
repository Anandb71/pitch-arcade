import {setTimeout as delay} from 'node:timers/promises';
import type {Account} from './oauth.js';
export class TwitchError extends Error{constructor(readonly code:string,readonly status=0){super('Twitch request failed: '+code);}}
export interface HelixOptions {clientId:string;broadcasterId:string;botId:string;token:(role:Account)=>Promise<string>;refresh?:(role:Account)=>Promise<void>;baseUrl?:string;request?:typeof fetch;now?:()=>number;sleep?:(ms:number)=>Promise<void>;pollMs?:number;clipTimeoutMs?:number;pin?:boolean;marker?:boolean}
export class HelixClient {
 private tail:Promise<unknown>=Promise.resolve();private sends:number[]=[];private resetAt=0;private controller=new AbortController();
 constructor(private options:HelixOptions){}
 private now():number{return (this.options.now??Date.now)();}
 private async sleep(ms:number):Promise<void>{if(ms>0){this.controller.signal.throwIfAborted();await (this.options.sleep??(n=>delay(n,undefined,{signal:this.controller.signal})))(ms);}}
 stop():void{this.controller.abort();}
 private async call(path:string,role:Account,body?:unknown,retry=true):Promise<Record<string,unknown>>{
  this.controller.signal.throwIfAborted();await this.sleep(this.resetAt-this.now());
  const response=await (this.options.request??fetch)((this.options.baseUrl??'https://api.twitch.tv/helix')+path,{method:body===undefined?'GET':'POST',headers:{'Client-Id':this.options.clientId,Authorization:'Bearer '+await this.options.token(role),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.any([this.controller.signal,AbortSignal.timeout(5000)])});
  if(response.headers.get('Ratelimit-Remaining')==='0'||response.status===429){const reset=Number(response.headers.get('Ratelimit-Reset'));this.resetAt=Number.isFinite(reset)&&reset>0?Math.max(this.now()+1000,reset*1000):this.now()+30000;}
  if(response.status===401&&retry&&this.options.refresh){await this.options.refresh(role);return this.call(path,role,body,false);}
  if(!response.ok)throw new TwitchError(response.status===401?'UNAUTHORIZED':response.status===403?'FORBIDDEN':response.status===429?'RATE_LIMIT':'HTTP_ERROR',response.status);
  try{return await response.json() as Record<string,unknown>;}catch{throw new TwitchError('INVALID_RESPONSE');}
 }
 async subscribe(session:string):Promise<void>{await this.call('/eventsub/subscriptions','bot',{type:'channel.chat.message',version:'1',condition:{broadcaster_user_id:this.options.broadcasterId,user_id:this.options.botId},transport:{method:'websocket',session_id:session}});}
 sendChat(text:string):Promise<void>{const task=this.tail.then(async()=>{
  if(!text||[...text].length>500)throw new TwitchError('MESSAGE_LENGTH');
  const now=this.now();this.sends=this.sends.filter(t=>now-t<30000);const wait=Math.max(0,(this.sends.at(-1)??-Infinity)+1000-now,this.sends.length>=20?this.sends[this.sends.length-20]!+30000-now:0);await this.sleep(wait);this.sends.push(this.now());
  const value=await this.call('/chat/messages','bot',{broadcaster_id:this.options.broadcasterId,sender_id:this.options.botId,message:text,...(this.options.pin?{pin:true}:{})});const data=value.data as {is_sent?:boolean}[]|undefined;if(data?.[0]?.is_sent!==true)throw new TwitchError('MESSAGE_DROPPED');
 });this.tail=task.catch(()=>{});return task;}
 async createClip(title:string):Promise<string>{
  const value=await this.call('/clips?'+new URLSearchParams({broadcaster_id:this.options.broadcasterId,title:[...title].slice(0,140).join(''),duration:'20'}),'broadcaster',{});const id=(value.data as {id?:string}[]|undefined)?.[0]?.id;if(!id||!/^[-a-zA-Z0-9_]+$/.test(id))throw new TwitchError('INVALID_CLIP');
  const deadline=this.now()+(this.options.clipTimeoutMs??60000);
  while(this.now()<deadline){const clip=await this.call('/clips?'+new URLSearchParams({id}),'broadcaster');const url=(clip.data as {url?:string}[]|undefined)?.[0]?.url;if(url){let parsed:URL;try{parsed=new URL(url);}catch{throw new TwitchError('INVALID_CLIP_URL');}if(parsed.protocol!=='https:'||!['clips.twitch.tv','www.twitch.tv'].includes(parsed.hostname)||parsed.username||parsed.password)throw new TwitchError('INVALID_CLIP_URL');return url;}await this.sleep(Math.min(this.options.pollMs??1000,deadline-this.now()));}
  throw new TwitchError('CLIP_TIMEOUT');
 }
 async marker(description:string):Promise<void>{if(this.options.marker)await this.call('/streams/markers','broadcaster',{user_id:this.options.broadcasterId,description:[...description].slice(0,140).join('')});}
}
