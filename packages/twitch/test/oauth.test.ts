import {it,expect} from 'vitest';
import {createServer} from 'node:http';
import {TokenManager,authorizationUrl,scopes} from '../src/oauth.js';
it('uses state and role scopes in authorization URLs',()=>{const u=new URL(authorizationUrl('client','http://localhost:8787/callback','nonce','bot'));expect(u.searchParams.get('state')).toBe('nonce');expect(u.searchParams.get('scope')).toContain('user:read:chat');expect(scopes.broadcaster).toEqual(['channel:bot','clips:edit','user:read:chat']);});
it('validates identity, refreshes expired tokens and coalesces refresh against a fake id server',async()=>{
 let refreshed=0;const server=createServer((req,res)=>{res.setHeader('Content-Type','application/json');if(req.url==='/token'){refreshed++;res.end(JSON.stringify({access_token:'new',refresh_token:'rotated',scope:scopes.bot}));}else if(req.headers.authorization==='OAuth old'){res.writeHead(401);res.end('{}');}else res.end(JSON.stringify({client_id:'client',user_id:'bot-id',login:'bot',scopes:scopes.bot,expires_in:3600}));});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error();
 let saved=0;const manager=new TokenManager({clientId:'client',clientSecret:'secret',idBase:'http://127.0.0.1:'+address.port,tokens:{bot:{accessToken:'old',refreshToken:'refresh',login:'bot',userId:'bot-id',scopes:scopes.bot}},save:()=>{saved++;}});
 try{await Promise.all([manager.validate('bot'),manager.validate('bot')]);expect(refreshed).toBe(1);expect(saved).toBe(1);expect(await manager.access('bot')).toBe('new');await expect(manager.exchange('bot','authorization-code','http://localhost/callback','someone-else')).rejects.toThrow('do not match');}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
it('ends token monitoring when hourly validation fails',async()=>{
 const {vi}=await import('vitest');vi.useFakeTimers();const manager=new TokenManager({clientId:'c',clientSecret:'s',tokens:{},save:()=>{}});let failures=0;const stop=manager.monitor(()=>{failures++;});await vi.advanceTimersByTimeAsync(3600000);expect(failures).toBe(1);stop();vi.useRealTimers();
});
it('refuses token storage anywhere inside the repository',async()=>{const {saveTokens}=await import('../src/oauth.js');expect(()=>saveTokens(process.cwd()+'/..pretend-outside/tokens.json',{})).toThrow('outside');});
