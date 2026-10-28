import {mkdirSync,writeFileSync,renameSync,readFileSync,lstatSync,chmodSync} from 'node:fs';
import {dirname,resolve,relative} from 'node:path';
import {homedir} from 'node:os';
export const scopes={bot:['user:read:chat','user:write:chat','user:bot'],broadcaster:['clips:edit']};
export type Account=keyof typeof scopes;
export interface Token {accessToken:string;refreshToken:string;login:string;userId:string;scopes:string[]}
export type Tokens=Partial<Record<Account,Token>>;
export function tokenPath():string{return resolve(process.env.TWITCH_TOKEN_PATH||homedir()+'/.config/pitch-arcade/tokens.json');}
function outside(path:string):void{const rel=relative(process.cwd(),resolve(path));if(!rel.startsWith('..')&&!rel.startsWith('/'))throw Error('Store Twitch tokens outside the project.');}
export function saveTokens(path:string,tokens:Tokens):void{outside(path);mkdirSync(dirname(path),{recursive:true,mode:0o700});const temp=path+'.'+process.pid+'.tmp';writeFileSync(temp,JSON.stringify(tokens),{mode:0o600,flag:'wx'});renameSync(temp,path);chmodSync(path,0o600);}
export function loadTokens(path:string):Tokens{outside(path);const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)!==0)throw Error('Token file must be a regular private file with mode 0600.');const value=JSON.parse(readFileSync(path,'utf8')) as Tokens;for(const role of ['bot','broadcaster'] as const){const t=value[role];if(t&&(!t.accessToken||!t.refreshToken||!t.login||!t.userId||!Array.isArray(t.scopes)))throw Error('Invalid Twitch token file.');}return value;}
export function authorizationUrl(client:string,redirect:string,state:string,role:Account,stretch=false):string{const u=new URL('https://id.twitch.tv/oauth2/authorize');u.search=new URLSearchParams({client_id:client,redirect_uri:redirect,response_type:'code',scope:[...scopes[role],...(stretch?[role==='bot'?'moderator:manage:chat_messages':'channel:manage:broadcast']:[])].join(' '),state,force_verify:'true'}).toString();return u.href;}
interface Options {clientId:string;clientSecret:string;tokens:Tokens;save:(tokens:Tokens)=>void;idBase?:string}
export class TokenManager {
 private pending=new Map<Account,Promise<void>>();
 constructor(private options:Options){}
 private async request(path:string,init:RequestInit):Promise<Response>{return fetch((this.options.idBase??'https://id.twitch.tv/oauth2')+path,{...init,signal:AbortSignal.timeout(5000)});}
 async exchange(role:Account,code:string,redirect:string,expectedLogin:string):Promise<void>{const response=await this.request('/token',{method:'POST',body:new URLSearchParams({client_id:this.options.clientId,client_secret:this.options.clientSecret,code,grant_type:'authorization_code',redirect_uri:redirect})});if(!response.ok)throw Error('Twitch authorization failed.');const data=await response.json() as {access_token:string;refresh_token:string;scope:string[]};this.options.tokens[role]={accessToken:data.access_token,refreshToken:data.refresh_token,login:expectedLogin,userId:'',scopes:data.scope};await this.validate(role);}
 validate(role:Account):Promise<void>{const pending=this.pending.get(role);if(pending)return pending;const task=this.check(role).finally(()=>this.pending.delete(role));this.pending.set(role,task);return task;}
 private async check(role:Account):Promise<void>{let token=this.options.tokens[role];if(!token)throw Error('Run npm run auth to connect both Twitch accounts.');let response=await this.request('/validate',{headers:{Authorization:'OAuth '+token.accessToken}});
 if(response.status===401){const refreshed=await this.request('/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refreshToken,client_id:this.options.clientId,client_secret:this.options.clientSecret})});if(!refreshed.ok)throw Error('Twitch authorization expired. Run npm run auth.');const value=await refreshed.json() as {access_token:string;refresh_token:string};token={...token,accessToken:value.access_token,refreshToken:value.refresh_token};this.options.tokens[role]=token;response=await this.request('/validate',{headers:{Authorization:'OAuth '+token.accessToken}});}
 if(!response.ok)throw Error('Twitch token validation failed.');const data=await response.json() as {client_id:string;user_id:string;login:string;scopes:string[]};if(data.client_id!==this.options.clientId||data.login.toLowerCase()!==token.login.toLowerCase()||(token.userId&&data.user_id!==token.userId)||!scopes[role].every(s=>data.scopes.includes(s)))throw Error('Twitch account or scopes do not match. Run npm run auth.');Object.assign(token,{userId:data.user_id,scopes:data.scopes});this.options.save(this.options.tokens);
 }
 monitor(onFailure:()=>void,intervalMs=3600000):()=>void{let stopped=false;const timer=setInterval(()=>{void Promise.all((['bot','broadcaster'] as const).map(role=>this.validate(role))).catch(()=>{if(!stopped){onFailure();clearInterval(timer);}});},intervalMs);return ()=>{stopped=true;clearInterval(timer);};}
 async access(role:Account):Promise<string>{const token=this.options.tokens[role];if(!token)throw Error('Twitch account is not connected.');return token.accessToken;}
 account(role:Account):Token{const token=this.options.tokens[role];if(!token)throw Error('Twitch account is not connected.');return token;}
}
