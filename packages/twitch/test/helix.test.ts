import {it,expect} from 'vitest';
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
 await expect(client.subscribe('s')).rejects.toMatchObject({code:'RATE_LIMIT',status:429});await expect(client.subscribe('s')).rejects.toBeInstanceOf(TwitchError);expect(now).toBe(102000);client.stop();
});
