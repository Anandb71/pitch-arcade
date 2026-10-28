export const roles=['broadcaster','mod','vip','sub','viewer'] as const;
export type Role=typeof roles[number];
export interface ChatMessage {id:string;userId:string;login:string;displayName:string;text:string;role:Role}
export type ChatHandler=(message:ChatMessage)=>Promise<void>;
export interface ChatSource {subscribe:(handler:ChatHandler)=>()=>void}
export class FakeChatSource implements ChatSource {
 private handlers=new Set<ChatHandler>();
 subscribe(handler:ChatHandler):()=>void {this.handlers.add(handler);return ()=>{this.handlers.delete(handler);};}
 async publish(message:ChatMessage):Promise<void>{for(const handler of this.handlers)await handler(message);}
}

import WebSocket from 'ws';
const obj=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'?value as Record<string,unknown>:{};
export function mapChatEvent(raw:unknown):ChatMessage|null{
 const envelope=obj(raw),meta=obj(envelope.metadata),payload=obj(envelope.payload),event=obj(payload.event),message=obj(event.message);
 if(meta.message_type!=='notification'||meta.subscription_type!=='channel.chat.message')return null;
 const keys=['message_id','chatter_user_id','chatter_user_login','chatter_user_name','broadcaster_user_id'];
 if(keys.some(key=>typeof event[key]!=='string')||typeof message.text!=='string'||message.text.length>2048)return null;
 const badges=Array.isArray(event.badges)?event.badges.map(b=>obj(b).set_id):[];
 const role:Role=event.chatter_user_id===event.broadcaster_user_id||badges.includes('broadcaster')?'broadcaster':badges.includes('moderator')?'mod':badges.includes('vip')?'vip':badges.includes('subscriber')?'sub':'viewer';
 return {id:event.message_id as string,userId:event.chatter_user_id as string,login:event.chatter_user_login as string,displayName:event.chatter_user_name as string,text:message.text,role};
}
export interface EventSubOptions {url?:string;onError?:()=>void;retryMs?:number;welcomeMs?:number;graceMs?:number}
export class EventSubChatSource extends FakeChatSource {
 onWelcome:(sessionId:string)=>Promise<void>=async()=>{};
 private active:WebSocket|undefined;private candidate:WebSocket|undefined;
 private sockets=new Set<WebSocket>();private timers=new Map<WebSocket,ReturnType<typeof setTimeout>>();
 private retry:ReturnType<typeof setTimeout>|undefined;private stopped=true;private seen=new Set<string>();
 constructor(private options:EventSubOptions={}){super();}
 start():void{if(!this.stopped)return;this.stopped=false;this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false);}
 stop():void{this.stopped=true;clearTimeout(this.retry);for(const timer of this.timers.values())clearTimeout(timer);this.timers.clear();for(const socket of this.sockets)socket.terminate();this.sockets.clear();this.active=undefined;this.candidate=undefined;}
 private open(url:string,migration:boolean):void{
  if(this.stopped||this.candidate)return;
  let parsed:URL;try{parsed=new URL(url);}catch{this.options.onError?.();return;}
  const local=parsed.protocol==='ws:'&&['127.0.0.1','localhost'].includes(parsed.hostname)&&!!this.options.url;
  if(parsed.username||parsed.password||(!local&&!(parsed.protocol==='wss:'&&parsed.hostname==='eventsub.wss.twitch.tv'))){this.options.onError?.();return;}
  const socket=new WebSocket(url,{maxPayload:1048576});this.candidate=socket;this.sockets.add(socket);let welcomed=false,keepaliveMs=10000;
  const arm=(ms:number)=>{clearTimeout(this.timers.get(socket));this.timers.set(socket,setTimeout(()=>{this.options.onError?.();socket.terminate();},ms));};
  arm(migration?Math.min(this.options.welcomeMs??10000,30000):this.options.welcomeMs??10000);
  socket.on('message',raw=>{
   if(this.stopped)return;
   let envelope:unknown;try{envelope=JSON.parse(raw.toString());}catch{return;}
   const e=obj(envelope),meta=obj(e.metadata),payload=obj(e.payload),session=obj(payload.session);
   if(meta.message_type==='session_welcome'&&typeof session.id==='string'){
    if(welcomed)return;welcomed=true;
    if(typeof session.keepalive_timeout_seconds==='number'&&session.keepalive_timeout_seconds>0)keepaliveMs=session.keepalive_timeout_seconds*1000;
    const previous=this.active;this.active=socket;this.candidate=undefined;previous?.close();arm(keepaliveMs+(this.options.graceMs??1000));
    if(!migration){const deadline=setTimeout(()=>socket.terminate(),9000);void this.onWelcome(session.id).catch(()=>{this.options.onError?.();socket.terminate();}).finally(()=>clearTimeout(deadline));}
    return;
   }
   if(!welcomed)return;arm(keepaliveMs+(this.options.graceMs??1000));
   if(meta.message_type==='session_reconnect'&&typeof session.reconnect_url==='string'){this.open(session.reconnect_url,true);return;}
   if(meta.message_type==='revocation'){this.options.onError?.();this.stop();return;}
   const message=mapChatEvent(envelope);
   if(message&&!this.seen.has(message.id)){this.seen.add(message.id);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value!);void this.publish(message).catch(()=>this.options.onError?.());}
  });
  socket.on('error',()=>{this.options.onError?.();socket.terminate();});
  socket.on('close',()=>{
   clearTimeout(this.timers.get(socket));this.timers.delete(socket);this.sockets.delete(socket);
   if(this.candidate===socket)this.candidate=undefined;if(this.active===socket)this.active=undefined;
   if(this.stopped||this.active||this.candidate)return;
   clearTimeout(this.retry);this.retry=setTimeout(()=>this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false),this.options.retryMs??1000);
  });
 }
}
