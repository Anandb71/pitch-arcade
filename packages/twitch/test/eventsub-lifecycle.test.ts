import {it,expect} from 'vitest';
import {EventSubChatSource} from '../src/chat.js';
import {startEventSubMock} from '../src/mock.js';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
it('subscribes once on welcome, migrates without resubscribe and resubscribes after drop',async()=>{
 const a=await startEventSubMock(),b=await startEventSubMock();const client=new EventSubChatSource({url:a.url,retryMs:10});const sessions:string[]=[];client.onWelcome=async id=>{sessions.push(id);};const messages:string[]=[];client.subscribe(async m=>{messages.push(m.role);});client.start();
 try{await wait(50);expect(sessions).toHaveLength(1);a.chat('priya','!pitch berries','vip');await wait(20);expect(messages).toEqual(['vip']);a.reconnect(b.url);await wait(60);expect(sessions).toHaveLength(1);b.chat('lee','hi','mod');await wait(20);expect(messages).toContain('mod');b.drop();await wait(100);expect(sessions).toHaveLength(2);}finally{client.stop();await a.close();await b.close();}
});
it('recovers from missing welcome and missing keepalive without stale callbacks',async()=>{
 const mock=await startEventSubMock(0,{welcomeDelayMs:80,keepaliveSeconds:0.02});let errors=0,welcome=0;const client=new EventSubChatSource({url:mock.url,welcomeMs:20,retryMs:5,onError:()=>{errors++;}});client.onWelcome=async()=>{welcome++;};client.start();await wait(100);client.stop();expect(welcome).toBe(0);expect(errors).toBeGreaterThan(0);await mock.close();
 const live=await startEventSubMock(0,{keepaliveSeconds:0.02});const next=new EventSubChatSource({url:live.url,retryMs:5,graceMs:0});next.onWelcome=async()=>{welcome++;};next.start();await wait(120);next.stop();expect(welcome).toBeGreaterThan(1);await live.close();
});
