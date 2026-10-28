import {expect,test} from 'vitest';
import {mapChatEvent,EventSubChatSource} from './chat.js';
import {startEventSubMock} from './mock.js';
test('maps only verified notification shapes and derives role from Twitch badges',()=>{
 const event={broadcaster_user_id:'b',chatter_user_id:'u',chatter_user_login:'priya',chatter_user_name:'Priya',message_id:'m',message:{text:'!pitch tacos'},badges:[{set_id:'moderator'}]};
 expect(mapChatEvent({metadata:{message_type:'notification',subscription_type:'channel.chat.message'},payload:{event}})).toMatchObject({login:'priya',role:'mod',text:'!pitch tacos'});
 expect(mapChatEvent({event})).toBeNull();
 expect(mapChatEvent({metadata:{message_type:'notification',subscription_type:'channel.chat.message'},payload:{event:{...event,message:{text:12}}}})).toBeNull();
});
test('wire source handles the repo EventSub mock through the common ChatSource interface',async()=>{
 const mock=await startEventSubMock();
 const source=new EventSubChatSource({url:mock.url});
 try{
  const ready=new Promise<void>(resolve=>{source.onWelcome=async()=>{resolve();};});
  const result=new Promise<unknown>(resolve=>source.subscribe(async message=>{resolve(message);}));
  source.start();await ready;
  mock.chat('priya','!pitch dodge tacos','mod');
  expect(await result).toMatchObject({login:'priya',role:'mod',text:'!pitch dodge tacos'});
 }finally{source.stop();await mock.close();}
});
