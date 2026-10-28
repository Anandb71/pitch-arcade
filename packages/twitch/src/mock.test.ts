import {expect,test} from 'vitest';
import WebSocket from 'ws';
import {startEventSubMock} from './index.js';
async function connect(url:string){
 const socket=new WebSocket(url);
 const messages:unknown[]=[];
 const waiting:((value:unknown)=>void)[]=[];
 socket.on('message',raw=>{
  const value:unknown=JSON.parse(raw.toString());
  const waiter=waiting.shift();if(waiter)waiter(value);else messages.push(value);
 });
 await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
 return {socket,next:()=>messages.length?Promise.resolve(messages.shift()):new Promise<unknown>(resolve=>waiting.push(resolve))};
}
test('local mock emits welcome, chat, keepalive and reconnect envelopes',async()=>{
 const mock=await startEventSubMock();
 try{
  const client=await connect(mock.url);
  expect(await client.next()).toMatchObject({metadata:{message_type:'session_welcome'},payload:{session:{id:'mock-1',keepalive_timeout_seconds:10}}});
  mock.chat('priya','!pitch dodge tacos');
  expect(await client.next()).toMatchObject({metadata:{message_type:'notification',subscription_type:'channel.chat.message',subscription_version:'1'},payload:{subscription:{type:'channel.chat.message',version:'1'},event:{chatter_user_login:'priya',message:{text:'!pitch dodge tacos'}}}});
  mock.keepalive();
  expect(await client.next()).toMatchObject({metadata:{message_type:'session_keepalive'}});
  mock.reconnect(mock.url);
  expect(await client.next()).toMatchObject({metadata:{message_type:'session_reconnect'},payload:{session:{reconnect_url:mock.url}}});
  client.socket.close();
 }finally{await mock.close();}
});
test('mock can drop connections to exercise later client recovery',async()=>{
 const mock=await startEventSubMock();
 try{
  const client=await connect(mock.url);await client.next();
  const closed=new Promise<number>(resolve=>client.socket.once('close',code=>resolve(code)));
  mock.drop();expect(await closed).toBe(4000);
 }finally{await mock.close();}
});
