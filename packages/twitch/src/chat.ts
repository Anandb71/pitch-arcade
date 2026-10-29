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
import type {SubscriptionOptions} from './helix.js';
const closeLabels:Record<number,string>={1000:'normal_close',1001:'going_away',1006:'abnormal_close',4000:'internal_error',4001:'client_inbound_traffic',4002:'ping_pong_failed',4003:'connection_unused',4004:'reconnect_grace_expired',4005:'network_timeout',4006:'network_error',4007:'invalid_reconnect'};
const causes=['welcome_timeout','keepalive_timeout','socket_error','socket_close','migration_timeout','invalid_reconnect_url','subscribe_timeout','subscribe_failure','revocation','handler_error'] as const;
export interface EventSubDiagnostic {cause:typeof causes[number];closeCode?:number;httpStatus?:number;subscriptionType?:string;revocationStatus?:string}
const revocations=['authorization_revoked','user_removed','version_removed','notification_failures_exceeded'] as const;
export function eventSubDiagnosticLabel(value:EventSubDiagnostic):string{
 const cause=causes.includes(value.cause)?value.cause:'unknown';
 if(cause==='socket_close'){const code=Number.isInteger(value.closeCode)&&value.closeCode!>=1000&&value.closeCode!<=4999?value.closeCode:0;return cause+' code='+code+' '+(closeLabels[code!]??'unknown_close');}
 if(cause==='subscribe_failure')return cause+' http_status='+(Number.isInteger(value.httpStatus)&&value.httpStatus!>=100&&value.httpStatus!<=599?value.httpStatus:0);
 if(cause==='revocation')return cause+' type='+(value.subscriptionType==='channel.chat.message'?'channel.chat.message':'unknown')+' status='+(revocations.includes(value.revocationStatus as typeof revocations[number])?value.revocationStatus:'unknown');
 return cause;
}
export function eventSubSilenceMs(keepaliveMs:number,graceMs?:number):number{return graceMs===undefined?Math.ceil(keepaliveMs*1.5)+3000:keepaliveMs+graceMs;}
export interface EventSubOptions {url?:string;onError?:(cause:EventSubDiagnostic)=>void;retryMs?:number;welcomeMs?:number;graceMs?:number;migrationMs?:number;subscribeMs?:number}
interface Connection {socket:WebSocket;url:string;migration:boolean;welcomed:boolean;retired:boolean;keepaliveMs:number;controller:AbortController;silence?:ReturnType<typeof setTimeout>;subscription?:ReturnType<typeof setTimeout>;closing?:ReturnType<typeof setTimeout>}
interface Migration {url:string;deadline:number;timer:ReturnType<typeof setTimeout>}
export class EventSubChatSource extends FakeChatSource {
 onWelcome:(sessionId:string,options?:SubscriptionOptions)=>Promise<void>=async()=>{};
 private active:Connection|undefined;private candidate:Connection|undefined;
 private sockets=new Set<Connection>();private migration:Migration|undefined;
 private retry:ReturnType<typeof setTimeout>|undefined;private stopped=true;private seen=new Set<string>();private failures=0;
 constructor(private options:EventSubOptions={}){super();}
 start():void{if(!this.stopped)return;this.stopped=false;this.failures=0;this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false);}
 stop():void{this.stopped=true;clearTimeout(this.retry);this.clearMigration();for(const connection of this.sockets)this.retire(connection);this.sockets.clear();this.active=undefined;this.candidate=undefined;}
 private report(cause:EventSubDiagnostic):void{try{this.options.onError?.(cause);}catch{/* Logging must not interrupt recovery. */}}
 private clearMigration():void{clearTimeout(this.migration?.timer);this.migration=undefined;}
 private retire(connection:Connection,graceful=false):void{
  connection.retired=true;clearTimeout(connection.silence);clearTimeout(connection.subscription);clearTimeout(connection.closing);connection.controller.abort();
  if(this.active===connection)this.active=undefined;if(this.candidate===connection)this.candidate=undefined;
  if(graceful&&connection.socket.readyState===WebSocket.OPEN){connection.socket.close(1000);connection.closing=setTimeout(()=>connection.socket.terminate(),1000);connection.closing.unref();}
  else connection.socket.terminate();
 }
 private arm(connection:Connection,ms:number,cause:EventSubDiagnostic['cause']):void{
  clearTimeout(connection.silence);connection.silence=setTimeout(()=>{if(connection.retired||this.stopped)return;this.report({cause});this.retire(connection);this.recover();},Math.max(1,ms));
 }
 private heartbeat(connection:Connection):void{
  const silence=eventSubSilenceMs(connection.keepaliveMs,this.options.graceMs);
  this.arm(connection,connection===this.active&&this.migration?Math.max(silence,this.migration.deadline-Date.now()):silence,'keepalive_timeout');
 }
 private recover():void{
  if(this.stopped||this.candidate)return;
  if(this.active&&!this.migration)return;
  clearTimeout(this.retry);
  const delay=Math.min(30000,(this.options.retryMs??1000)*2**Math.min(this.failures++,5));
  this.retry=setTimeout(()=>{
   if(this.stopped||this.candidate)return;
   if(this.migration&&this.active)this.open(this.migration.url,true);
   else{this.clearMigration();this.open(this.options.url??'wss://eventsub.wss.twitch.tv/ws',false);}
  },delay);
 }
 private migrate(url:string):void{
  if(this.migration?.url===url&&this.candidate)return;
  if(!this.migration){const deadline=Date.now()+(this.options.migrationMs??30000);const timer=setTimeout(()=>{
   if(this.stopped)return;this.report({cause:'migration_timeout'});this.clearMigration();if(this.candidate)this.retire(this.candidate);if(this.active)this.retire(this.active);this.recover();
  },Math.max(1,deadline-Date.now()));this.migration={url,deadline,timer};}
  else this.migration.url=url;
  clearTimeout(this.retry);if(this.candidate)this.retire(this.candidate);
  if(this.active)this.heartbeat(this.active);this.open(url,true);
 }
 private open(url:string,migration:boolean):void{
  if(this.stopped||this.candidate)return;
  let parsed:URL;try{parsed=new URL(url);}catch{this.report({cause:'invalid_reconnect_url'});if(migration)this.recover();return;}
  const local=parsed.protocol==='ws:'&&['127.0.0.1','localhost'].includes(parsed.hostname)&&!!this.options.url;
  if(parsed.username||parsed.password||parsed.hash||(!local&&!(parsed.protocol==='wss:'&&parsed.hostname==='eventsub.wss.twitch.tv'&&!parsed.port))){this.report({cause:'invalid_reconnect_url'});if(migration)this.recover();return;}
  let socket:WebSocket;try{socket=new WebSocket(url,{maxPayload:1048576});}catch{this.report({cause:'invalid_reconnect_url'});if(migration)this.recover();return;}
  const connection:Connection={socket,url,migration,welcomed:false,retired:false,keepaliveMs:this.active?.keepaliveMs??10000,controller:new AbortController()};
  this.candidate=connection;this.sockets.add(connection);
  this.arm(connection,migration?Math.min(this.options.welcomeMs??30000,Math.max(1,(this.migration?.deadline??Date.now()+30000)-Date.now())):this.options.welcomeMs??10000,'welcome_timeout');
  socket.on('message',raw=>{
   if(this.stopped||connection.retired)return;
   let envelope:unknown;try{envelope=JSON.parse(raw.toString());}catch{return;}
   const e=obj(envelope),meta=obj(e.metadata),payload=obj(e.payload),session=obj(payload.session);
   if(connection.welcomed)this.heartbeat(connection);
   if(meta.message_type==='session_welcome'&&typeof session.id==='string'){
    if(connection.welcomed||this.candidate!==connection)return;connection.welcomed=true;
    if(typeof session.keepalive_timeout_seconds==='number'&&Number.isFinite(session.keepalive_timeout_seconds)&&session.keepalive_timeout_seconds>0&&session.keepalive_timeout_seconds<=600)connection.keepaliveMs=session.keepalive_timeout_seconds*1000;
    const previous=this.active;this.active=connection;this.candidate=undefined;clearTimeout(this.retry);this.clearMigration();if(previous)this.retire(previous,true);this.heartbeat(connection);
    if(migration){this.failures=0;return;}
    const budget=Math.min(9000,this.options.subscribeMs??9000);
    connection.subscription=setTimeout(()=>{if(connection.retired||this.stopped)return;this.report({cause:'subscribe_timeout'});this.retire(connection);this.recover();},budget);
    void Promise.resolve().then(()=>{if(connection.retired||this.stopped)return;return this.onWelcome(session.id as string,{signal:connection.controller.signal,timeoutMs:Math.max(1,budget-500),onRetry:status=>{if(!connection.retired&&!this.stopped)this.report({cause:'subscribe_failure',httpStatus:status});}});}).then(()=>{if(!connection.retired)this.failures=0;},error=>{
     if(connection.retired||this.stopped)return;const status=obj(error).status;this.report(obj(error).code==='SUBSCRIPTION_TIMEOUT'?{cause:'subscribe_timeout'}:{cause:'subscribe_failure',httpStatus:typeof status==='number'?status:0});this.retire(connection);this.recover();
    }).finally(()=>clearTimeout(connection.subscription));return;
   }
   if(!connection.welcomed)return;
   if(meta.message_type==='session_reconnect'&&typeof session.reconnect_url==='string'){if(connection===this.active)this.migrate(session.reconnect_url);return;}
   if(meta.message_type==='revocation'){
    const subscription=obj(payload.subscription),status=subscription.status,type=subscription.type;
    this.report({cause:'revocation',subscriptionType:type==='channel.chat.message'?type:'unknown',revocationStatus:revocations.includes(status as typeof revocations[number])?status as string:'unknown'});this.stop();return;
   }
   const message=mapChatEvent(envelope);
   if(message&&!this.seen.has(message.id)){this.seen.add(message.id);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value!);void this.publish(message).catch(()=>{if(!connection.retired&&!this.stopped)this.report({cause:'handler_error'});});}
  });
  socket.on('error',()=>{if(connection.retired||this.stopped)return;this.report({cause:'socket_error'});this.retire(connection);this.recover();});
  socket.on('close',code=>{
   this.sockets.delete(connection);clearTimeout(connection.closing);if(connection.retired||this.stopped)return;
   this.report({cause:'socket_close',closeCode:code});this.retire(connection);this.recover();
  });
 }
}
