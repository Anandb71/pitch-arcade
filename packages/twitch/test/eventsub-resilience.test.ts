import {expect,it} from 'vitest';
import {EventSubChatSource,eventSubDiagnosticLabel,eventSubSilenceMs,type EventSubDiagnostic} from '../src/chat.js';
import {startEventSubMock} from '../src/mock.js';
import {HelixClient} from '../src/helix.js';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function until(test:()=>boolean,ms=1500){const end=Date.now()+ms;while(!test()){if(Date.now()>end)throw Error('Fixture timed out.');await wait(5);}}
it('allows keepalive jitter and re-arms on keepalives, notifications and reconnects',async()=>{
 expect(eventSubSilenceMs(10000)).toBe(18000);
 const mock=await startEventSubMock(0,{keepaliveSeconds:.02}),errors:EventSubDiagnostic[]=[],client=new EventSubChatSource({url:mock.url,onError:e=>errors.push(e)});let welcomes=0;client.onWelcome=async()=>{welcomes++;};
 try{client.start();client.start();await until(()=>welcomes===1);await wait(80);mock.keepalive();mock.chat('priya','hello');await wait(60);expect(welcomes).toBe(1);expect(errors).toEqual([]);expect(mock.connections()).toBe(1);}finally{client.stop();await mock.close();}
});
it('uses the newest reconnect URL during migration and ignores retired socket closes',async()=>{
 const a=await startEventSubMock(),b=await startEventSubMock(0,{welcomeDelayMs:180}),c=await startEventSubMock();let welcomed=0;const errors:EventSubDiagnostic[]=[],received:string[]=[];
 const client=new EventSubChatSource({url:a.url,retryMs:5,onError:e=>errors.push(e)});client.onWelcome=async()=>{welcomed++;};client.subscribe(async m=>{received.push(m.login);});
 try{client.start();await until(()=>welcomed===1);a.reconnect(b.url);await until(()=>b.connections()===1);expect(a.connections()).toBe(1);a.reconnect(c.url);await until(()=>c.connections()===1&&a.connections()===0&&b.connections()===0);await wait(200);c.chat('lee','!pitch bubbles');await until(()=>received.includes('lee'));expect(welcomed).toBe(1);expect(errors).toEqual([]);client.stop();await until(()=>c.connections()===0);expect(a.connections()+b.connections()+c.connections()).toBe(0);}finally{client.stop();await a.close();await b.close();await c.close();}
});
it('logs a sanitized 4003 cause and resubscribes once after the drop',async()=>{
 const mock=await startEventSubMock(),errors:EventSubDiagnostic[]=[];let welcomes=0;const client=new EventSubChatSource({url:mock.url,retryMs:5,onError:e=>errors.push(e)});client.onWelcome=async()=>{welcomes++;};
 try{client.start();await until(()=>welcomes===1);mock.drop(4003,'fixture private reason');await until(()=>welcomes===2);expect(errors.map(eventSubDiagnosticLabel)).toContain('socket_close code=4003 connection_unused');expect(JSON.stringify(errors)).not.toContain('fixture private reason');}finally{client.stop();await mock.close();}
});
it('migration deadline drops both sockets and starts one fresh session',async()=>{
 const a=await startEventSubMock(),b=await startEventSubMock(0,{welcomeDelayMs:200});const errors:EventSubDiagnostic[]=[];let welcomed=0;const client=new EventSubChatSource({url:a.url,retryMs:5,migrationMs:50,onError:e=>errors.push(e)});client.onWelcome=async()=>{welcomed++;};
 try{client.start();await until(()=>welcomed===1);a.reconnect(b.url);await until(()=>welcomed===2);expect(errors.map(eventSubDiagnosticLabel)).toContain('migration_timeout');expect(b.connections()).toBe(0);expect(a.connections()).toBe(1);}finally{client.stop();await a.close();await b.close();}
});
it('revocation stops all sockets and emits only known type and status labels',async()=>{
 const a=await startEventSubMock(),b=await startEventSubMock(0,{welcomeDelayMs:200}),errors:EventSubDiagnostic[]=[];const client=new EventSubChatSource({url:a.url,retryMs:5,onError:e=>errors.push(e)});let welcomed=0;client.onWelcome=async()=>{welcomed++;};
 try{client.start();await until(()=>welcomed===1);a.reconnect(b.url);await until(()=>b.connections()===1);a.revoke('fixture private type','fixture private status');await until(()=>a.connections()+b.connections()===0);await wait(30);expect(welcomed).toBe(1);expect(errors.map(eventSubDiagnosticLabel)).toContain('revocation type=unknown status=unknown');expect(JSON.stringify(errors)).not.toContain('fixture private');}finally{client.stop();await a.close();await b.close();}
});
it('does not send EventSub application frames and relies on automatic pongs',async()=>{
 const mock=await startEventSubMock(),client=new EventSubChatSource({url:mock.url});try{client.start();await until(()=>mock.connections()===1);mock.ping();await until(()=>mock.pongs()>0);expect(mock.inbound()).toBe(0);}finally{client.stop();await mock.close();}
});
it('reports welcome, keepalive and subscribe failures without private exception text',async()=>{
 const mock=await startEventSubMock(),errors:EventSubDiagnostic[]=[];const client=new EventSubChatSource({url:mock.url,retryMs:100,onError:e=>errors.push(e)});client.onWelcome=async()=>{throw Object.assign(Error('fixture private token'),{status:403});};
 try{client.start();await until(()=>errors.length>0);expect(errors.map(eventSubDiagnosticLabel)).toContain('subscribe_failure http_status=403');expect(JSON.stringify(errors)).not.toContain('fixture private token');}finally{client.stop();await mock.close();}
 expect(eventSubDiagnosticLabel({cause:'fixture private' as EventSubDiagnostic['cause'],closeCode:4007,httpStatus:NaN,subscriptionType:'fixture private'})).not.toContain('fixture private');
});
it('retries a failed subscription while keeping the welcoming socket',async()=>{
 const mock=await startEventSubMock(),errors:EventSubDiagnostic[]=[];let attempts=0,ready=false;
 const helix=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',sleep:async()=>{},request:async()=>++attempts===1?new Response('{}',{status:503}):Response.json({data:[]})});
 const client=new EventSubChatSource({url:mock.url,onError:e=>errors.push(e)});client.onWelcome=async(id,options)=>{await helix.subscribe(id,options);ready=true;};
 try{client.start();await until(()=>ready);expect(attempts).toBe(2);expect(mock.connections()).toBe(1);expect(errors.map(eventSubDiagnosticLabel)).toContain('subscribe_failure http_status=503');}finally{client.stop();helix.stop();await mock.close();}
});
it('actually extends short watchdogs on keepalive, notification and migration traffic',async()=>{
 const a=await startEventSubMock(0,{keepaliveSeconds:.02}),b=await startEventSubMock(0,{welcomeDelayMs:160,keepaliveSeconds:1}),errors:EventSubDiagnostic[]=[];let welcomes=0;
 const client=new EventSubChatSource({url:a.url,graceMs:120,migrationMs:400,onError:e=>errors.push(e)});client.onWelcome=async()=>{welcomes++;};
 try{client.start();await until(()=>welcomes===1);await wait(80);a.keepalive();await wait(80);a.chat('priya','hi');await wait(80);expect(welcomes).toBe(1);a.reconnect(b.url);await until(()=>b.connections()===1);await wait(80);expect(a.connections()).toBe(1);await until(()=>a.connections()===0);expect(b.connections()).toBe(1);expect(welcomes).toBe(1);expect(errors).toEqual([]);}finally{client.stop();await a.close();await b.close();}
});
it('labels each watchdog and aborts subscription work when its deadline expires',async()=>{
 const delayed=await startEventSubMock(0,{welcomeDelayMs:100}),errors:EventSubDiagnostic[]=[];
 const welcome=new EventSubChatSource({url:delayed.url,welcomeMs:15,retryMs:100,onError:e=>errors.push(e)});
 try{welcome.start();await until(()=>errors.some(e=>e.cause==='welcome_timeout'));}finally{welcome.stop();await delayed.close();}
 const silent=await startEventSubMock(0,{keepaliveSeconds:.02}),keepalive=new EventSubChatSource({url:silent.url,graceMs:0,retryMs:100,onError:e=>errors.push(e)});
 try{keepalive.start();await until(()=>errors.some(e=>e.cause==='keepalive_timeout'));}finally{keepalive.stop();await silent.close();}
 const mock=await startEventSubMock(),client=new EventSubChatSource({url:mock.url,subscribeMs:30,retryMs:100,onError:e=>errors.push(e)});let signal:AbortSignal|undefined;
 client.onWelcome=async(_id,options)=>{signal=options?.signal;await new Promise<void>(resolve=>signal?.addEventListener('abort',()=>resolve(),{once:true}));};
 try{client.start();await until(()=>errors.some(e=>e.cause==='subscribe_timeout'));expect(signal?.aborted).toBe(true);}finally{client.stop();await mock.close();}
});
it('a failed migration candidate retries without killing the healthy old socket',async()=>{
 const a=await startEventSubMock(),b=await startEventSubMock(0,{welcomeDelayMs:120});let welcomes=0;const client=new EventSubChatSource({url:a.url,retryMs:5,migrationMs:800});client.onWelcome=async()=>{welcomes++;};
 try{client.start();await until(()=>welcomes===1);a.reconnect(b.url);await until(()=>b.connections()===1);b.drop(4006,'fixture private reason');expect(a.connections()).toBe(1);await until(()=>b.connections()===1&&a.connections()===0);expect(welcomes).toBe(1);}finally{client.stop();await a.close();await b.close();}
});
it.each([4000,4001,4002,4003,4004,4005,4006,4007])('close diagnostic %s has a known fixed label',code=>{const label=eventSubDiagnosticLabel({cause:'socket_close',closeCode:code});expect(label).toContain('code='+code);expect(label).not.toContain('unknown');});
it('rejects hostile reconnect URLs without emitting their contents',async()=>{
 const mock=await startEventSubMock(),errors:EventSubDiagnostic[]=[];let welcomes=0;const client=new EventSubChatSource({url:mock.url,retryMs:100,migrationMs:500,onError:e=>errors.push(e)});client.onWelcome=async()=>{welcomes++;};
 try{client.start();await until(()=>welcomes===1);mock.reconnect('wss://eventsub.wss.twitch.tv/#fixture_private_code');await until(()=>errors.length>0);expect(errors.map(eventSubDiagnosticLabel)).toContain('invalid_reconnect_url');expect(JSON.stringify(errors)).not.toContain('fixture_private_code');expect(mock.connections()).toBe(1);}finally{client.stop();await mock.close();}
});
