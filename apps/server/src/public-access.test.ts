import {afterEach,expect,it,vi} from 'vitest';
import WebSocket from 'ws';
import {createArcade} from './app.js';
import {PublicAccess} from './public-access.js';
import {post} from '../../shared/dom.js';
// Synthetic fixture credentials only. Never load a real access token in these tests.
const key='fixture_public_access_key_1234567890',host='studio.trycloudflare.com';
const opened:Awaited<ReturnType<typeof createArcade>>[]=[];
afterEach(async()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();for(const arcade of opened.splice(0))await arcade.close();});
async function setup(config={hosts:'*.trycloudflare.com',token:key}){const arcade=await createArcade({dbPath:':memory:',seedLibrary:false,mockTwitch:true,mockCodex:true,publicAccess:config});opened.push(arcade);return arcade;}
it('preserves loopback behavior and rejects public requests without credentials',async()=>{
 const {app}=await setup();expect((await app.inject({url:'/api/state'})).statusCode).toBe(200);expect((await app.inject({method:'POST',url:'/api/arcade',headers:{'x-arcade-control':'local'},payload:{enabled:true}})).statusCode).toBe(200);
 for(const value of [undefined,'wrong']){const response=await app.inject({url:'/api/state'+(value?'?key='+value:''),headers:{host}});expect(response.statusCode).toBe(401);expect(response.body).toBe('Unauthorized.');expect(response.headers['access-control-allow-origin']).toBeUndefined();expect(response.body).not.toContain('pitches');}
});
it('exchanges the key for a private secure cookie and strips the key from redirects',async()=>{
 const {app}=await setup();const response=await app.inject({url:'/overlay/?sound=0&key='+key+'&backdrop=1',headers:{host}});
 expect(response.statusCode).toBe(303);expect(response.headers.location).toBe('/overlay/?sound=0&backdrop=1');
 const cookie=response.headers['set-cookie'] as string;expect(cookie).toContain('HttpOnly');expect(cookie).toContain('Secure');expect(cookie).toContain('SameSite=Lax');expect(cookie).toContain('Path=/');expect(cookie).not.toContain(key);
 const state=await app.inject({url:'/api/state',headers:{host,cookie:cookie.split(';')[0]!}});expect(state.statusCode).toBe(200);expect(state.body).not.toContain(key);expect(response.body).not.toContain(key);expect(response.headers['referrer-policy']).toBe('no-referrer');expect(response.headers['cache-control']).toBe('no-store');
});
it('requires both authentication and the mutation control header',async()=>{
 const {app}=await setup();const payload={enabled:false};
 expect((await app.inject({method:'POST',url:'/api/arcade',headers:{host,'x-arcade-key':key},payload})).statusCode).toBe(403);
 expect((await app.inject({method:'POST',url:'/api/arcade',headers:{host,'x-arcade-control':'local'},payload})).statusCode).toBe(401);
 expect((await app.inject({method:'POST',url:'/api/arcade',headers:{host,'x-arcade-key':key,'x-arcade-control':'local',origin:'https://'+host},payload})).statusCode).toBe(200);
 expect((await app.inject({method:'POST',url:'/api/arcade',headers:{host,'x-arcade-key':key,'x-arcade-control':'local',origin:'https://attacker.invalid'},payload})).statusCode).toBe(403);
});
it('matches only exact public hosts or real wildcard subdomains',()=>{
 const access=new PublicAccess({hosts:'exact.example.com, *.trycloudflare.com',token:key});
 for(const name of [host,'EXACT.EXAMPLE.COM','nested.studio.trycloudflare.com'])expect(access.kind(name)).toBe('public');
 for(const name of ['trycloudflare.com','evil-trycloudflare.com','trycloudflare.com.evil.com','exact.example.com.evil.com','studio.trycloudflare.com:443','studio.trycloudflare.com.','studio.trycloudflare.com@evil.com','stud\u212Ao.trycloudflare.com'])expect(access.kind(name)).toBe('unknown');
});
it.each([undefined,'short'])('fails closed with a safe warning when public token is invalid',async token=>{
 const warn=vi.fn(),access=new PublicAccess({hosts:'*.trycloudflare.com',token,warn});expect(access.kind(host)).toBe('unknown');expect(access.kind('localhost:3000')).toBe('local');expect(warn).toHaveBeenCalledOnce();expect(warn.mock.calls[0]![0]).toContain('ARCADE_ACCESS_TOKEN');expect(warn.mock.calls[0]![0]).not.toContain(String(token));
});
it('refuses invalid host configuration without reflecting configuration values',()=>{
 const warn=vi.fn(),access=new PublicAccess({hosts:'https://'+host,token:key,warn});expect(access.kind(host)).toBe('unknown');expect(JSON.stringify(warn.mock.calls)).not.toContain(key);expect(JSON.stringify(warn.mock.calls)).not.toContain(host);
});
it('does not echo keys on errors or permit redirect confusion',async()=>{
 const {app}=await setup();
 for(const url of ['/api/state?key=wrong&key='+key,'//attacker.invalid/?key='+key,'/missing?key='+key+'&copy='+key]){const response=await app.inject({url,headers:{host}});expect(response.statusCode).not.toBe(200);expect(response.body).not.toContain(key);expect(String(response.headers.location)).not.toContain(key);}
 const missing=await app.inject({url:'/missing?secret=not-public',headers:{host,'x-arcade-key':key}});expect(missing.statusCode).toBe(404);expect(missing.body).not.toContain('not-public');
});
async function upgrade(url:string,headers:Record<string,string>){return new Promise<{status:number;body:string}>((resolve,reject)=>{
 const socket=new WebSocket(url,{headers,handshakeTimeout:1000});const timer=setTimeout(()=>{socket.terminate();reject(Error('Fixture upgrade timed out.'));},1500);
 socket.on('error',()=>{});socket.on('unexpected-response',(_request,response)=>{let body='';response.on('data',chunk=>{body+=chunk;});response.on('end',()=>{clearTimeout(timer);resolve({status:response.statusCode!,body});socket.terminate();});});
 socket.on('message',data=>{clearTimeout(timer);resolve({status:101,body:data.toString()});socket.close();});
 });}
it('authenticates WebSocket cookies, query keys and same host origins before sending state',async()=>{
 const arcade=await setup();await arcade.app.listen({host:'127.0.0.1',port:0});const address=arcade.app.server.address();if(!address||typeof address==='string')throw Error();const url='ws://127.0.0.1:'+address.port+'/events';
 const login=await arcade.app.inject({url:'/?key='+key,headers:{host}}),cookie=(login.headers['set-cookie'] as string).split(';')[0]!;
 for(const headers of [{host,origin:'https://'+host},{host,origin:'https://'+host,cookie:'__Host-arcade=wrong'}])expect((await upgrade(url,headers)).status).toBe(401);
 for(const headers of [{host,cookie,origin:'https://attacker.invalid'},{host,cookie}])expect((await upgrade(url,headers)).status).toBe(403);
 for(const target of [{url,headers:{host,cookie,origin:'https://'+host}},{url:url+'?key='+key,headers:{host,origin:'https://'+host}}]){const response=await upgrade(target.url,target.headers);expect(response.status).toBe(101);expect(response.body).not.toContain(key);expect(response.body).toContain('arcade');}
});
it('dashboard posts include same origin cookies and the existing control header',async()=>{
 const fetch=vi.fn<typeof globalThis.fetch>(async()=>Response.json({ok:true}));vi.stubGlobal('fetch',fetch);await post('/api/arcade',{enabled:true});expect(fetch.mock.calls[0]?.[1]).toMatchObject({credentials:'same-origin',headers:{'X-Arcade-Control':'local'}});
});

it('binds private cookies to their host and invalidates them when the key rotates',()=>{
 const access=new PublicAccess({hosts:'*.trycloudflare.com',token:key});const issued=access.authorize(host,{},'/?key='+key);const cookie=issued.cookie!.split(';')[0]!;
 expect(access.authorize(host,{cookie},'/api/state').authorized).toBe(true);expect(access.authorize('other.trycloudflare.com',{cookie},'/api/state').authorized).toBe(false);
 const rotated=new PublicAccess({hosts:'*.trycloudflare.com',token:'fixture_rotated_access_key_1234567890'});expect(rotated.authorize(host,{cookie},'/api/state').authorized).toBe(false);expect(JSON.stringify(access)).not.toContain(key);
 expect(access.authorize(host,{cookie:cookie+'; '+cookie},'/api/state').authorized).toBe(false);
 expect(access.authorize(host,{cookie,'x-arcade-key':'wrong'},'/api/state').authorized).toBe(false);
});
it('browser cookie authentication works for dashboard mutations without exposing the key',async()=>{
 const {app}=await setup();const login=await app.inject({url:'/dashboard/?key='+key,headers:{host}}),cookie=(login.headers['set-cookie'] as string).split(';')[0]!;
 const headers={host,cookie,origin:'https://'+host,'x-arcade-control':'local'};
 const response=await app.inject({method:'POST',url:'/api/arcade',headers,payload:{enabled:false}});expect(response.statusCode).toBe(200);expect(response.body).toBe('{"enabled":false}');expect(response.body).not.toContain(key);
 expect((await app.inject({url:'/dashboard/',headers:{host,cookie}})).statusCode).toBe(200);
});
it('does not trust forwarded host or origin headers as authorization',async()=>{
 const {app}=await setup();expect((await app.inject({url:'/api/state',headers:{host:'attacker.invalid','x-forwarded-host':host,'x-arcade-key':key}})).statusCode).toBe(403);
 expect((await app.inject({url:'/api/state',headers:{host,'x-forwarded-host':'localhost','x-forwarded-proto':'https'}})).statusCode).toBe(401);
});

it('reads the opt in public access environment without exposing it in state',async()=>{
 vi.stubEnv('ARCADE_ACCESS_TOKEN',key);vi.stubEnv('ARCADE_PUBLIC_HOSTS',host);const arcade=await createArcade({dbPath:':memory:',seedLibrary:false,mockTwitch:true,mockCodex:true});opened.push(arcade);
 expect((await arcade.app.inject({url:'/api/state',headers:{host}})).statusCode).toBe(401);
 const response=await arcade.app.inject({url:'/api/state',headers:{host,'x-arcade-key':key}});expect(response.statusCode).toBe(200);expect(response.body).not.toContain(key);expect(response.body).not.toContain('ARCADE_ACCESS_TOKEN');
});
