import { WebSocketServer, WebSocket } from 'ws';
export interface EventSubMock {
 url:string;
 chat:(login:string,text:string,role?:string)=>void;
 keepalive:()=>void;
 reconnect:(url:string)=>void;
 drop:(code?:number,reason?:string)=>void;
 connections:()=>number;inbound:()=>number;pongs:()=>number;ping:()=>void;revoke:(type?:string,status?:string)=>void;
 close:()=>Promise<void>;
}
let mockInstance=0;
/** Local wire fixture. This does not impersonate Twitch auth or Helix. */
export async function startEventSubMock(port=0,options:{welcomeDelayMs?:number;keepaliveSeconds?:number}={}):Promise<EventSubMock> {
 const server=new WebSocketServer({host:'127.0.0.1',port,maxPayload:4096});
 await new Promise<void>((resolve,reject)=>{
  server.once('listening',resolve);server.once('error',reject);
 });
 const instance=++mockInstance;let sequence=0,session=0,inbound=0,pongs=0;
 const envelope=(type:string,payload:unknown,chat=false)=>({
  metadata:{message_id:'mock-message-'+(++sequence),message_type:type,message_timestamp:new Date().toISOString(),...(chat?{subscription_type:'channel.chat.message',subscription_version:'1'}:{})},
  payload
 });
 const send=(socket:WebSocket,type:string,payload:unknown,chat=false)=>{
  if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(envelope(type,payload,chat)));
 };
 const broadcast=(type:string,payload:unknown,chat=false)=>{
  for(const socket of server.clients)send(socket,type,payload,chat);
 };
 const chat=(login:string,text:string,role='viewer')=>broadcast('notification',{
   subscription:{id:'mock-chat',status:'enabled',type:'channel.chat.message',version:'1',condition:{broadcaster_user_id:'broadcaster',user_id:'bot'},transport:{method:'websocket',session_id:'mock-'+session},created_at:new Date().toISOString(),cost:0},
   event:{broadcaster_user_id:'broadcaster',broadcaster_user_login:'arcade',broadcaster_user_name:'Arcade',chatter_user_id:'viewer-'+login,chatter_user_login:login,chatter_user_name:login,message_id:'chat-'+instance+'-'+sequence,message:{text,fragments:[{type:'text',text,cheermote:null,emote:null,mention:null}]},color:'#9146FF',badges:role==='viewer'?[]:[{set_id:role==='mod'?'moderator':role==='sub'?'subscriber':role,id:'1',info:''}],message_type:'text',cheer:null,reply:null,channel_points_custom_reward_id:null}
  },true);
 server.on('connection',socket=>{
  socket.on('error',()=>{});
  socket.on('pong',()=>{pongs++;});
  socket.on('message',raw=>{inbound++;
   try{const value=JSON.parse(raw.toString());if(value.mock==='chat'&&typeof value.login==='string'&&/^[a-zA-Z0-9_]{1,25}$/.test(value.login)&&typeof value.text==='string'&&value.text.length<=512&&['viewer','sub','vip','mod','broadcaster'].includes(value.role??'viewer'))chat(value.login,value.text,value.role??'viewer');}catch{}
  });
  const welcome=setTimeout(()=>send(socket,'session_welcome',{session:{id:'mock-'+(++session),status:'connected',keepalive_timeout_seconds:options.keepaliveSeconds??10,reconnect_url:null,connected_at:new Date().toISOString()}}),options.welcomeDelayMs??0);
  socket.once('close',()=>clearTimeout(welcome));
 });
 const address=server.address();
 if(!address||typeof address==='string')throw Error('Mock could not bind a TCP port.');
 const url='ws://127.0.0.1:'+address.port;
 return {
  url,
  chat,
  keepalive:()=>broadcast('session_keepalive',{}),
  reconnect:reconnectUrl=>broadcast('session_reconnect',{session:{id:'mock-'+session,status:'reconnecting',keepalive_timeout_seconds:null,reconnect_url:reconnectUrl,connected_at:new Date().toISOString()}}),
  drop:(code=4000,reason='Mock connection drop')=>{for(const socket of server.clients)socket.close(code,reason);},
  connections:()=>server.clients.size,inbound:()=>inbound,pongs:()=>pongs,ping:()=>{for(const socket of server.clients)socket.ping();},revoke:(type='channel.chat.message',status='authorization_revoked')=>broadcast('revocation',{subscription:{type,status}}),
  close:()=>new Promise<void>((resolve,reject)=>{
   for(const socket of server.clients)socket.terminate();
   server.close(error=>error?reject(error):resolve());
  })
 };
}
