import {it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {HelixClient,TwitchError} from '../src/helix.js';
it('uses real HTTP fixtures for subscriptions, clips, polling and chat',async()=>{
 const calls:{url:string;body:unknown;auth:string|undefined}[]=[];let polls=0;const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;calls.push({url:req.url!,body:body?JSON.parse(body):null,auth:req.headers.authorization});res.setHeader('Content-Type','application/json');if(req.url?.startsWith('/clips?')&&req.method==='POST')res.end(JSON.stringify({data:[{id:'fixture'}]}));else if(req.url?.startsWith('/clips?'))res.end(JSON.stringify({data:++polls===1?[]:[{id:'fixture',url:'https://clips.twitch.tv/Fixture'}]}));else res.end(JSON.stringify({data:[{is_sent:true}]}));});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const a=server.address();if(!a||typeof a==='string')throw Error();
 const client=new HelixClient({clientId:'client',broadcasterId:'broadcaster',botId:'bot',token:async role=>role+'-fixture',baseUrl:'http://127.0.0.1:'+a.port,pollMs:1});
 try{await client.subscribe('session');await client.sendChat('hello');expect(await client.createClip('Berries by @priya')).toBe('https://clips.twitch.tv/Fixture');expect(calls[0]!.body).toMatchObject({condition:{broadcaster_user_id:'broadcaster',user_id:'bot'}});expect(calls.find(c=>c.url.includes('duration=20'))).toBeTruthy();expect(calls.find(c=>c.url.includes('duration=20'))!.auth).toBe('Bearer broadcaster-fixture');}finally{client.stop();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
it('enforces one second and twenty messages per rolling thirty seconds',async()=>{
 let now=0;const sent:number[]=[];const client=new HelixClient({clientId:'c',broadcasterId:'b',botId:'u',token:async()=>'',now:()=>now,sleep:async ms=>{now+=ms;},request:async()=>{sent.push(now);return new Response(JSON.stringify({data:[{is_sent:true}]}));}});
 await Promise.all(Array.from({length:21},()=>client.sendChat('hello')));expect(sent[1]!-sent[0]!).toBe(1000);expect(sent[20]!-sent[0]!).toBe(30000);client.stop();
});
it('honors reset headers and exposes safe typed errors',async()=>{
 let now=100000,calls=0;const client=new HelixClient({clientId:'c',broadcasterId:'b',botId:'u',token:async()=>'',now:()=>now,sleep:async ms=>{now+=ms;},request:async()=>++calls===1?new Response('{}',{status:429,headers:{'Ratelimit-Remaining':'0','Ratelimit-Reset':'102'}}):new Response('{}',{status:403})});
 await expect(client.subscribe('s')).rejects.toMatchObject({status:403});expect(now).toBeGreaterThanOrEqual(102000);await expect(client.subscribe('s')).rejects.toBeInstanceOf(TwitchError);client.stop();
});
it('bounds unavailable clip polling and masks network errors',async()=>{
 let now=0;const client=new HelixClient({clientId:'c',broadcasterId:'b',botId:'u',token:async()=>'',now:()=>now,sleep:async ms=>{now+=ms;},clipTimeoutMs:100,pollMs:20,request:async(_url,init)=>new Response(JSON.stringify({data:init?.method==='POST'?[{id:'fixture'}]:[]}))});
 await expect(client.createClip('Safe game by @viewer')).rejects.toMatchObject({code:'CLIP_TIMEOUT'});expect(now).toBe(100);client.stop();
 const failed=new HelixClient({clientId:'c',broadcasterId:'b',botId:'u',token:async()=>'',request:async()=>{throw Error('private headers');}});await expect(failed.subscribe('session')).rejects.toMatchObject({code:'NETWORK_ERROR'});failed.stop();
});
it('coalesces session subscriptions, accepts 409 and refreshes a 401 once',async()=>{
 let calls=0,refreshes=0;const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',refresh:async()=>{refreshes++;},request:async()=>++calls===1?new Response('{}',{status:401}):new Response('{}',{status:409})});
 try{await Promise.all([client.subscribe('same'),client.subscribe('same')]);await client.subscribe('same');expect(calls).toBe(2);expect(refreshes).toBe(1);}finally{client.stop();}
});
it('subscriptions bypass chat pacing and unrelated rate reset waits',async()=>{
 let now=0;const calls:string[]=[],waits:number[]=[];const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',now:()=>now,sleep:async ms=>{waits.push(ms);now+=ms;},request:async url=>{calls.push(String(url));return Response.json({data:[{is_sent:true}]},{headers:{'Ratelimit-Remaining':'0','Ratelimit-Reset':'30'}});}});
 try{await client.sendChat('hello');await client.subscribe('fresh');expect(waits).toEqual([]);expect(calls).toHaveLength(2);}finally{client.stop();}
});
it('subscription retries honor 429 headers and fit inside the welcome budget',async()=>{
 let now=0,attempt=0;const waits:number[]=[],statuses:number[]=[];const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',now:()=>now,sleep:async ms=>{waits.push(ms);now+=ms;},request:async()=>++attempt===1?new Response('{}',{status:429,headers:{'Ratelimit-Reset':'2'}}):Response.json({data:[]})});
 try{await client.subscribe('s',{onRetry:status=>statuses.push(status)});expect(waits).toEqual([2000]);expect(statuses).toEqual([429]);expect(now).toBeLessThan(9000);}finally{client.stop();}
});
it('permanent subscribe failures are bounded and stale attempts can be aborted',async()=>{
 let calls=0;const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',sleep:async()=>{},request:async()=>{calls++;return new Response('fixture private token',{status:403});}});
 try{await expect(client.subscribe('s')).rejects.toMatchObject({status:403});expect(calls).toBe(5);const controller=new AbortController();controller.abort();await expect(client.subscribe('stale',{signal:controller.signal})).rejects.toMatchObject({code:'CANCELLED'});expect(calls).toBe(5);}finally{client.stop();}
});
it('a second 401 never refreshes twice and a distant 429 cannot exceed the welcome window',async()=>{
 let calls=0,refreshes=0;const unauthorized=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',refresh:async()=>{refreshes++;},request:async()=>{calls++;return new Response('{}',{status:401});}});
 try{await expect(unauthorized.subscribe('s')).rejects.toMatchObject({status:401});expect(calls).toBe(2);expect(refreshes).toBe(1);}finally{unauthorized.stop();}
 let waits=0;const limited=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',now:()=>0,sleep:async()=>{waits++;},request:async()=>new Response('{}',{status:429,headers:{'Ratelimit-Reset':'30'}})});
 try{await expect(limited.subscribe('s')).rejects.toMatchObject({code:'SUBSCRIPTION_TIMEOUT',status:429});expect(waits).toBe(0);}finally{limited.stop();}
});
it('cancels an in flight subscribe without retrying after source shutdown',async()=>{
 const controller=new AbortController();let calls=0,started:()=>void=()=>{};const ready=new Promise<void>(resolve=>{started=resolve;});const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',request:async(_url,init)=>{calls++;started();return new Promise<Response>((_resolve,reject)=>init?.signal?.addEventListener('abort',()=>reject(Error('fixture private token')),{once:true}));}});
 const pending=expect(client.subscribe('s',{signal:controller.signal})).rejects.toMatchObject({code:'CANCELLED'});await ready;controller.abort();await pending;expect(calls).toBe(1);client.stop();
});

it('releases subscription response bodies and never sends after its budget expires',async()=>{
 const responses=[Response.json({fixture:true},{status:503}),Response.json({fixture:true},{status:409})],cancelled=responses.map(response=>vi.spyOn(response.body!,'cancel'));let index=0;
 const client=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',token:async()=>'fixture',sleep:async()=>{},request:async()=>responses[index++]!});
 try{await client.subscribe('s');expect(cancelled.every(spy=>spy.mock.calls.length===1)).toBe(true);}finally{client.stop();}
 let now=0,sent=0;const late=new HelixClient({clientId:'fixture',broadcasterId:'b',botId:'u',now:()=>now,token:async()=>{now=9000;return 'fixture';},request:async()=>{sent++;return Response.json({});}});
 try{await expect(late.subscribe('s')).rejects.toMatchObject({code:'SUBSCRIPTION_TIMEOUT'});expect(sent).toBe(0);}finally{late.stop();}
});
