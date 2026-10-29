import {afterEach,expect,it,vi} from 'vitest';
import {mkdtempSync,readFileSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TokenManager,scopes,requestedScopes,saveTokens,loadTokens,type Tokens} from '../src/oauth.js';
import {authCli,parseAuthArgs} from '../src/auth-cli.js';
// All credential strings here are synthetic fixture values. No request leaves the fake fetch.
const clientId='fixture_client_id',clientSecret='fixture_client_secret',deviceCode='fixture_device_code';
const access='fixture_access_value',refresh='fixture_refresh_value';
const dirs:string[]=[];
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
function setup(errors:string[]=[]){
 let now=0;const waits:number[]=[],messages:string[]=[],calls:{path:string;body:URLSearchParams}[]=[];
 let login='priya',validationScopes=requestedScopes('broadcaster'),tokenExpired=false,networkFailures=0,deviceFailures=0;let deviceExtra:Record<string,unknown>={};
 const request=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const path=new URL(String(input)).pathname;const body=new URLSearchParams(init?.body as URLSearchParams);calls.push({path,body});
  if(path.endsWith('/device')){if(deviceFailures-->0)throw Error(clientSecret);return Response.json({device_code:deviceCode,user_code:'ABCD1234',verification_uri:'https://www.twitch.tv/activate',expires_in:40,interval:2,...deviceExtra});}
  if(path.endsWith('/validate'))return tokenExpired?Response.json({}, {status:401}):Response.json({client_id:clientId,user_id:'viewer-priya',login,scopes:validationScopes,expires_in:3600});
  if(body.get('grant_type')==='refresh_token'){tokenExpired=false;return Response.json({access_token:'fixture_rotated_access',refresh_token:'fixture_rotated_refresh',expires_in:7200});}
  if(networkFailures-->0)throw Error(clientSecret+' '+deviceCode);
  const error=errors.shift();if(error)return Response.json({error,message:clientSecret+' '+deviceCode},{status:error==='server_unavailable'?503:400});
  return Response.json({access_token:access,refresh_token:refresh,scope:validationScopes,expires_in:3600});
 }) as unknown as typeof fetch;
 const tokens:Tokens={};let saves=0;
 const manager=new TokenManager({clientId,clientSecret,tokens,fetch:request,save:()=>{saves++;}});
 const options={now:()=>now,sleep:async(ms:number)=>{waits.push(ms);now+=ms;},progress:(message:string)=>messages.push(message)};
 return {manager,tokens,options,waits,messages,calls,request,get saves(){return saves;},setLogin:(v:string)=>{login=v;},setScopes:(v:string[])=>{validationScopes=v;},expire:()=>{tokenExpired=true;},network:(n:number)=>{networkFailures=n;},deviceNetwork:(n:number)=>{deviceFailures=n;},deviceDetails:(v:Record<string,unknown>)=>{deviceExtra=v;}};
}
it('selects exact role scopes and keeps optional stretch scopes',()=>{
 expect(scopes.bot).toEqual(['user:read:chat','user:write:chat','user:bot']);
 expect(scopes.broadcaster).toEqual(['channel:bot','clips:edit','user:read:chat']);
 expect(requestedScopes('bot',true)).toContain('moderator:manage:chat_messages');
 expect(requestedScopes('broadcaster',true)).toContain('channel:manage:broadcast');
 expect(parseAuthArgs(['--device','--role=broadcaster'])).toEqual({device:true,role:'broadcaster',check:false});
 expect(()=>parseAuthArgs(['--device'])).toThrow('role');expect(()=>parseAuthArgs(['--device','--role=other'])).toThrow('role');
});
it('polls after pending, posts confidential form fields and logs only safe guidance',async()=>{
 const s=setup(['authorization_pending']);await s.manager.authorizeDevice('broadcaster','priya',s.options);
 expect(s.waits).toEqual([2000,2000]);expect(s.saves).toBe(1);
 const device=s.calls.find(c=>c.path.endsWith('/device'))!.body;expect([...device.keys()]).toEqual(['client_id','scopes']);expect(device.get('scopes')).toBe(scopes.broadcaster.join(' '));
 for(const c of s.calls.filter(c=>c.body.has('device_code'))){expect(c.body.get('client_secret')).toBe(clientSecret);expect(c.body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:device_code');expect(c.body.get('scopes')).toBe(scopes.broadcaster.join(' '));}
 expect(s.tokens.broadcaster).toMatchObject({login:'priya',userId:'viewer-priya',refreshToken:refresh,expiresAt:3604000});
 const output=s.messages.join('\n');for(const secret of [clientId,clientSecret,deviceCode,access,refresh])expect(output).not.toContain(secret);
 expect(output).toContain('https://www.twitch.tv/activate');expect(output).toContain('ABCD1234');expect(output).toContain('broadcaster');expect(output).toContain('priya');expect(output).toContain('40 seconds');
});
it('increases the poll interval by five seconds after slow_down',async()=>{const s=setup(['slow_down','authorization_pending']);await s.manager.authorizeDevice('broadcaster','priya',s.options);expect(s.waits).toEqual([2000,7000,7000]);});
it.each(['expired_token','access_denied'])('fails cleanly on %s without reflecting the response',async error=>{
 const s=setup([error]);await expect(s.manager.authorizeDevice('broadcaster','priya',s.options)).rejects.toThrow(error==='expired_token'?'expired':'declined');expect(s.saves).toBe(0);expect(JSON.stringify(s.tokens)).toBe('{}');expect(s.messages.join()).not.toContain(clientSecret);
});
it('stops at local expiry even when Twitch stays pending',async()=>{const s=setup(Array(50).fill('authorization_pending'));await expect(s.manager.authorizeDevice('broadcaster','priya',s.options)).rejects.toThrow('expired');expect(s.waits.reduce((a,b)=>a+b,0)).toBe(40000);expect(s.saves).toBe(0);expect(s.calls.filter(c=>c.body.has('device_code'))).toHaveLength(19);});
it('retries transient network failures with a bound and sanitized errors',async()=>{
 const s=setup();s.network(2);await s.manager.authorizeDevice('broadcaster','priya',s.options);expect(s.waits.length).toBe(3);
 const bad=setup();bad.network(10);await expect(bad.manager.authorizeDevice('broadcaster','priya',bad.options)).rejects.toThrow('unavailable');expect(bad.waits.length).toBe(4);expect(bad.saves).toBe(0);
});
it('rejects the wrong account or missing scopes without replacing saved accounts',async()=>{
 for(const wrong of ['login','scopes']){const s=setup();if(wrong==='login')s.setLogin('imposter');else s.setScopes(['clips:edit']);await expect(s.manager.authorizeDevice('broadcaster','priya',s.options)).rejects.toThrow('do not match');expect(s.tokens.broadcaster).toBeUndefined();expect(s.saves).toBe(0);}
});
it('stores device tokens privately and refreshes with the confidential secret',async()=>{
 const s=setup();await s.manager.authorizeDevice('broadcaster','priya',s.options);const dir=mkdtempSync(join(tmpdir(),'pitch-device-'));dirs.push(dir);const path=join(dir,'tokens.json');saveTokens(path,s.tokens);
 expect(statSync(path).mode&0o777).toBe(0o600);const file=readFileSync(path,'utf8');expect(file).not.toContain(clientId);expect(file).not.toContain(clientSecret);expect(file).not.toContain(deviceCode);expect(loadTokens(path).broadcaster?.refreshToken).toBe(refresh);
 s.expire();const manager=new TokenManager({clientId,clientSecret,tokens:loadTokens(path),fetch:s.request,save:t=>saveTokens(path,t)});await manager.validate('broadcaster');
 expect(loadTokens(path).broadcaster?.refreshToken).toBe('fixture_rotated_refresh');expect(loadTokens(path).broadcaster?.expiresAt).toBeGreaterThan(Date.now());
 expect(s.calls.find(c=>c.body.get('grant_type')==='refresh_token')?.body.get('client_secret')).toBe(clientSecret);
});
it('CLI authorizes only the selected role and never logs fixture credentials',async()=>{
 const s=setup();s.setLogin('arcade_bot');s.setScopes(requestedScopes('bot',true));vi.stubGlobal('fetch',s.request);
 const dir=mkdtempSync(join(tmpdir(),'pitch-device-cli-'));dirs.push(dir);
 for(const [key,value] of Object.entries({TWITCH_CLIENT_ID:clientId,TWITCH_CLIENT_SECRET:clientSecret,TWITCH_BOT_LOGIN:'arcade_bot',TWITCH_BROADCASTER_LOGIN:'priya',TWITCH_TOKEN_PATH:join(dir,'tokens.json'),TWITCH_STRETCH:'1'}))vi.stubEnv(key,value);
 const output:string[]=[];vi.spyOn(console,'log').mockImplementation((...args)=>{output.push(args.join(' '));});
 await authCli({device:true,role:'bot'},s.options);
 const saved=loadTokens(join(dir,'tokens.json'));expect(saved.bot?.login).toBe('arcade_bot');expect(saved.broadcaster).toBeUndefined();
 for(const secret of [clientId,clientSecret,deviceCode,access,refresh])expect(output.join()).not.toContain(secret);
 expect(s.calls[0]!.body.get('scopes')).toContain('moderator:manage:chat_messages');
});

it('bounds transient server and device issuance failures',async()=>{
 const transient=setup();transient.deviceNetwork(2);await transient.manager.authorizeDevice('broadcaster','priya',transient.options);expect(transient.waits).toEqual([1000,1000,2000]);
 const unavailable=setup();unavailable.deviceNetwork(5);await expect(unavailable.manager.authorizeDevice('broadcaster','priya',unavailable.options)).rejects.toThrow('unavailable');expect(unavailable.waits).toHaveLength(3);
 const server=setup(Array(6).fill('server_unavailable'));await expect(server.manager.authorizeDevice('broadcaster','priya',server.options)).rejects.toThrow('failed');expect(server.waits).toHaveLength(4);
});
it('refuses unsafe verification links and codes before emitting guidance',async()=>{
 for(const details of [{verification_uri:'https://www.twitch.tv/activate?secret='+clientSecret},{user_code:deviceCode},{verification_uri:'https://example.invalid/activate'},{interval:-1}]){const s=setup();s.deviceDetails(details);await expect(s.manager.authorizeDevice('broadcaster','priya',s.options)).rejects.toThrow();expect(s.messages).toEqual([]);expect(s.saves).toBe(0);}
});
it('preserves an existing grant when device account validation fails',async()=>{
 const s=setup();const previous={accessToken:'fixture_previous_access',refreshToken:'fixture_previous_refresh',login:'priya',userId:'viewer-priya',scopes:scopes.broadcaster};s.tokens.broadcaster={...previous};s.setLogin('imposter');await expect(s.manager.authorizeDevice('broadcaster','priya',s.options)).rejects.toThrow('do not match');expect(s.tokens.broadcaster).toEqual(previous);expect(s.saves).toBe(0);
});
it('honors the actual default timer while using only fake fetch',async()=>{
 vi.useFakeTimers();try{const s=setup(['authorization_pending']);const task=s.manager.authorizeDevice('broadcaster','priya');await vi.advanceTimersByTimeAsync(4000);await task;expect(s.saves).toBe(1);}finally{vi.useRealTimers();}
});
it('redirect CLI prints a local launch link without app credentials',async()=>{
 const realFetch=globalThis.fetch,dir=mkdtempSync(join(tmpdir(),'pitch-redirect-cli-'));dirs.push(dir);
 for(const [key,value] of Object.entries({TWITCH_CLIENT_ID:clientId,TWITCH_CLIENT_SECRET:clientSecret,TWITCH_BOT_LOGIN:'arcade_bot',TWITCH_BROADCASTER_LOGIN:'priya',TWITCH_TOKEN_PATH:join(dir,'tokens.json'),TWITCH_STRETCH:''}))vi.stubEnv(key,value);
 vi.stubGlobal('fetch',async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input));if(url.hostname==='localhost')return realFetch(input,init);
  if(url.hostname!=='id.twitch.tv')throw Error('Unexpected fixture request.');
  if(url.pathname.endsWith('/token')){const role=new URLSearchParams(init?.body as URLSearchParams).get('code')!;return Response.json({access_token:role,refresh_token:'fixture_refresh_'+role,expires_in:3600});}
  const role=new Headers(init?.headers).get('authorization')==='OAuth bot'?'bot':'broadcaster';return Response.json({client_id:clientId,user_id:'fixture-'+role,login:role==='bot'?'arcade_bot':'priya',scopes:scopes[role],expires_in:3600});
 });
 const output:string[]=[];let index=0;const callbacks:Promise<void>[]=[];
 vi.spyOn(console,'log').mockImplementation((...args)=>{
  const line=args.join(' ');output.push(line);
  if(line==='http://localhost:8787/authorize'||line.startsWith('https://id.twitch.tv/oauth2/authorize?')){
   const role=index++===0?'broadcaster':'bot';callbacks.push((async()=>{let url=new URL(line);if(url.hostname==='localhost'){const response=await realFetch(url,{redirect:'manual'});expect(response.status).toBe(302);url=new URL(response.headers.get('location')!);}const callback=new URL('http://localhost:8787/callback');callback.search=new URLSearchParams({state:url.searchParams.get('state')!,code:role}).toString();expect((await realFetch(callback)).status).toBe(200);})());
  }
 });
 await authCli();await Promise.all(callbacks);expect(index).toBe(2);expect(output).toContain('http://localhost:8787/authorize');for(const secret of [clientId,clientSecret])expect(output.join()).not.toContain(secret);
});
