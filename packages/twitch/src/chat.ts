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
export interface EventSubOptions {url?:string;onError?:()=>void}
export class EventSubChatSource extends FakeChatSource {
 onWelcome:(sessionId:string)=>Promise<void>=async()=>{};
 private socket:WebSocket|undefined;private retry:ReturnType<typeof setTimeout>|undefined;
 private watchdog:ReturnType<typeof setTimeout>|undefined;private stopped=true;private keepaliveMs=10000;
 constructor(private options:EventSubOptions={}){super();}
 start():void{if(!this.stopped)return;this.stopped=false;this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false);}
 stop():void{this.stopped=true;clearTimeout(this.retry);clearTimeout(this.watchdog);this.socket?.terminate();}
 private open(url:string,reconnecting:boolean):void{
  if(this.stopped)return;
  const parsed=new URL(url);
  const local=parsed.protocol==='ws:'&&['127.0.0.1','localhost'].includes(parsed.hostname)&&!!this.options.url;
  if(!local&&!(parsed.protocol==='wss:'&&parsed.hostname==='eventsub.wss.twitch.tv')){this.options.onError?.();return;}
  const previous=this.socket,socket=new WebSocket(url,{maxPayload:1048576});this.socket=socket;
  const arm=()=>{clearTimeout(this.watchdog);this.watchdog=setTimeout(()=>socket.terminate(),this.keepaliveMs+1000);};
  arm();
  socket.on('message',raw=>{
   if(socket!==this.socket)return;arm();
   let envelope:unknown;try{envelope=JSON.parse(raw.toString());}catch{return;}
   const e=obj(envelope),meta=obj(e.metadata),payload=obj(e.payload),session=obj(payload.session);
   if(meta.message_type==='session_welcome'&&typeof session.id==='string'){
    if(typeof session.keepalive_timeout_seconds==='number')this.keepaliveMs=session.keepalive_timeout_seconds*1000;
    previous?.close();
    if(!reconnecting)void this.onWelcome(session.id).catch(()=>{this.options.onError?.();socket.terminate();});
   }else if(meta.message_type==='session_reconnect'&&typeof session.reconnect_url==='string'){
    this.open(session.reconnect_url,true);
   }else{
    const message=mapChatEvent(envelope);
    if(message)void this.publish(message).catch(()=>this.options.onError?.());
   }
  });
  socket.on('error',()=>{this.options.onError?.();socket.terminate();});
  socket.on('close',()=>{
   if(this.stopped||socket!==this.socket)return;
   clearTimeout(this.watchdog);this.retry=setTimeout(()=>this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false),1000);
  });
 }
}
