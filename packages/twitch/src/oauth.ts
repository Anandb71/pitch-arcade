import {mkdirSync,writeFileSync,renameSync,readFileSync,lstatSync,chmodSync,realpathSync,existsSync} from 'node:fs';
import {dirname,resolve,relative,isAbsolute} from 'node:path';
import {homedir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
export const scopes={bot:['user:read:chat','user:write:chat','user:bot'],broadcaster:['channel:bot','clips:edit','user:read:chat']};
export type Account=keyof typeof scopes;
export function requestedScopes(role:Account,stretch=false):string[]{return [...scopes[role],...(stretch?[role==='bot'?'moderator:manage:chat_messages':'channel:manage:broadcast']:[])];}
export interface Token {accessToken:string;refreshToken:string;login:string;userId:string;scopes:string[];expiresAt?:number}
export type Tokens=Partial<Record<Account,Token>>;
export interface DeviceFlowOptions {stretch?:boolean;progress?:(message:string)=>void;now?:()=>number;sleep?:(ms:number)=>Promise<void>}
export function tokenPath():string{return resolve(process.env.TWITCH_TOKEN_PATH||homedir()+'/.config/pitch-arcade/tokens.json');}
function outside(path:string):void{const absolute=resolve(path);const canonical=existsSync(dirname(absolute))?resolve(realpathSync(dirname(absolute)),absolute.split('/').at(-1)!):absolute;for(const candidate of [absolute,canonical]){const rel=relative(process.cwd(),candidate);if(!(rel==='..'||rel.startsWith('../')||isAbsolute(rel)))throw Error('Store Twitch tokens outside the project.');}}
export function saveTokens(path:string,tokens:Tokens):void{outside(path);mkdirSync(dirname(path),{recursive:true,mode:0o700});outside(path);const temp=path+'.'+process.pid+'.tmp';writeFileSync(temp,JSON.stringify(tokens),{mode:0o600,flag:'wx'});renameSync(temp,path);chmodSync(path,0o600);}
export function loadTokens(path:string):Tokens{outside(path);const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)!==0)throw Error('Token file must be a regular private file with mode 0600.');const value=JSON.parse(readFileSync(path,'utf8')) as Tokens;for(const role of ['bot','broadcaster'] as const){const t=value[role];if(t&&(!t.accessToken||!t.refreshToken||!t.login||!t.userId||!Array.isArray(t.scopes)))throw Error('Invalid Twitch token file.');}return value;}
export function authorizationUrl(client:string,redirect:string,state:string,role:Account,stretch=false):string{const u=new URL('https://id.twitch.tv/oauth2/authorize');u.search=new URLSearchParams({client_id:client,redirect_uri:redirect,response_type:'code',scope:requestedScopes(role,stretch).join(' '),state,force_verify:'true'}).toString();return u.href;}
interface Options {clientId:string;clientSecret:string;tokens:Tokens;save:(tokens:Tokens)=>void;idBase?:string;fetch?:typeof fetch}
class IdentityUnavailable extends Error {constructor(){super('Twitch identity service is unavailable. Try authorization again.');}}
async function body(response:Response):Promise<Record<string,unknown>>{try{const value:unknown=await response.json();if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value as Record<string,unknown>;}catch{throw Error('Twitch returned an invalid authorization response.');}}
const positive=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>0;
export class TokenManager {
 private pending=new Map<Account,Promise<void>>();
 constructor(private options:Options){}
 private async request(path:string,init:RequestInit,timeoutMs=5000):Promise<Response>{try{return await (this.options.fetch??fetch)((this.options.idBase??'https://id.twitch.tv/oauth2')+path,{...init,signal:AbortSignal.timeout(Math.max(1,Math.ceil(timeoutMs)))});}catch{throw new IdentityUnavailable();}}
 private candidate(data:Record<string,unknown>,login:string,now:number):Token{
  if(typeof data.access_token!=='string'||!data.access_token||typeof data.refresh_token!=='string'||!data.refresh_token)throw Error('Twitch did not return refreshable authorization.');
  return {accessToken:data.access_token,refreshToken:data.refresh_token,login,userId:'',scopes:[],...(positive(data.expires_in)?{expiresAt:now+data.expires_in*1000}:{})};
 }
 private async inspect(role:Account,token:Token,now=Date.now(),required:readonly string[]=scopes[role]):Promise<Token>{
  const response=await this.request('/validate',{headers:{Authorization:'OAuth '+token.accessToken}});
  if(!response.ok)throw Error('Twitch token validation failed.');
  return this.identity(await body(response),token,now,required);
 }
 private identity(data:Record<string,unknown>,token:Token,now:number,required:readonly string[]):Token{
  if(data.client_id!==this.options.clientId||typeof data.login!=='string'||data.login.toLowerCase()!==token.login.toLowerCase()||typeof data.user_id!=='string'||!data.user_id||(token.userId&&data.user_id!==token.userId)||!Array.isArray(data.scopes)||!data.scopes.every(s=>typeof s==='string')||!required.every(s=>(data.scopes as string[]).includes(s)))throw Error('Twitch account or scopes do not match. Run npm run auth.');
  return {...token,userId:data.user_id,scopes:data.scopes as string[],...(positive(data.expires_in)?{expiresAt:now+data.expires_in*1000}:{})};
 }
 private store(role:Account,token:Token):void{
  const next={...this.options.tokens,[role]:token};this.options.save(next);Object.assign(this.options.tokens,next);
 }
 async exchange(role:Account,code:string,redirect:string,expectedLogin:string):Promise<void>{
  const response=await this.request('/token',{method:'POST',body:new URLSearchParams({client_id:this.options.clientId,client_secret:this.options.clientSecret,code,grant_type:'authorization_code',redirect_uri:redirect})});
  if(!response.ok)throw Error('Twitch authorization failed.');const candidate=this.candidate(await body(response),expectedLogin,Date.now());this.store(role,await this.inspect(role,candidate));
 }
 async authorizeDevice(role:Account,expectedLogin:string,options:DeviceFlowOptions={}):Promise<void>{
  if(!/^[a-z0-9_]{1,25}$/i.test(expectedLogin))throw Error('Set the expected Twitch login for this role.');
  const now=options.now??Date.now,sleep=options.sleep??(ms=>delay(ms)),requested=requestedScopes(role,options.stretch),sensitive=[this.options.clientId,this.options.clientSecret];
  const say=(message:string)=>{if(sensitive.some(value=>value&&message.includes(value)))throw Error('Authorization guidance could not be displayed safely.');options.progress?.(message);};
  let issued:Response|undefined;
  for(let attempt=0;!issued;attempt++){try{issued=await this.request('/device',{method:'POST',body:new URLSearchParams({client_id:this.options.clientId,scopes:requested.join(' ')})});}catch(error){if(!(error instanceof IdentityUnavailable)||attempt>=3)throw error;await sleep(1000);}}
  if(!issued.ok)throw Error('Twitch device authorization could not start. Check your app settings.');
  const data=await body(issued);
  if(typeof data.device_code!=='string'||!data.device_code||typeof data.user_code!=='string'||!/[A-Z0-9]/.test(data.user_code)||!/^[-A-Z0-9]{4,24}$/.test(data.user_code)||typeof data.verification_uri!=='string'||!/^https:\/\/(?:www\.)?twitch\.tv\/activate\/?$/.test(data.verification_uri)||!positive(data.expires_in)||data.expires_in>86400||(data.interval!==undefined&&!positive(data.interval)))throw Error('Twitch returned invalid device authorization details.');
  sensitive.push(data.device_code);const deadline=now()+data.expires_in*1000;let interval=(data.interval===undefined?5:data.interval as number)*1000,failures=0;
  say('Sign in as '+expectedLogin+' for the '+role+' account.');say('Open: '+data.verification_uri);say('User code: '+data.user_code);say('Expires in '+Math.ceil(data.expires_in)+' seconds.');
  while(now()<deadline){
   await sleep(Math.min(interval,Math.max(0,deadline-now())));if(now()>=deadline)break;
   let response:Response;
   try{response=await this.request('/token',{method:'POST',body:new URLSearchParams({client_id:this.options.clientId,client_secret:this.options.clientSecret,device_code:data.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code',scopes:requested.join(' ')})},Math.min(5000,deadline-now()));}
   catch(error){if(!(error instanceof IdentityUnavailable)||++failures>3)throw error;say('Connection interrupted. Retrying authorization.');continue;}
   if(now()>=deadline)break;if(response.status<500)failures=0;const result=await body(response);
   if(response.ok){const token=await this.inspect(role,this.candidate(result,expectedLogin,now()),now(),requested);if(!positive(token.expiresAt))throw Error('Twitch did not return token expiry information.');this.store(role,token);say('Authorization confirmed. Tokens were saved privately.');return;}
   const code=[result.error,result.message].find(value=>['authorization_pending','slow_down','expired_token','access_denied'].includes(String(value)));
   if(code==='authorization_pending'){say('Waiting for approval in your browser.');continue;}
   if(code==='slow_down'){interval+=5000;say('Twitch requested slower polling. Still waiting for approval.');continue;}
   if(code==='access_denied')throw Error('Twitch authorization was declined. Run the device command again when ready.');
   if(code==='expired_token')break;
   if(response.status>=500&&++failures<=3){say('Twitch is temporarily unavailable. Retrying authorization.');continue;}
   throw Error('Twitch device authorization failed. Run the device command again.');
  }
  throw Error('Twitch device authorization expired. Run the device command again.');
 }
 validate(role:Account):Promise<void>{const pending=this.pending.get(role);if(pending)return pending;const task=this.check(role).finally(()=>this.pending.delete(role));this.pending.set(role,task);return task;}
 private async check(role:Account):Promise<void>{
  let token=this.options.tokens[role];if(!token)throw Error('Run npm run auth to connect both Twitch accounts.');let response=await this.request('/validate',{headers:{Authorization:'OAuth '+token.accessToken}});
  if(response.status===401){const refreshed=await this.request('/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refreshToken,client_id:this.options.clientId,client_secret:this.options.clientSecret})});if(!refreshed.ok)throw Error('Twitch authorization expired. Run npm run auth.');const value=await body(refreshed);token={...this.candidate(value,token.login,Date.now()),userId:token.userId,scopes:token.scopes};response=await this.request('/validate',{headers:{Authorization:'OAuth '+token.accessToken}});}
  if(!response.ok)throw Error('Twitch token validation failed.');this.store(role,this.identity(await body(response),token,Date.now(),scopes[role]));
 }
 monitor(onFailure:()=>void,intervalMs=3600000):()=>void{let stopped=false;const timer=setInterval(()=>{void Promise.all((['bot','broadcaster'] as const).map(role=>this.validate(role))).catch(()=>{if(!stopped){onFailure();clearInterval(timer);}});},intervalMs);return ()=>{stopped=true;clearInterval(timer);};}
 async access(role:Account):Promise<string>{const token=this.options.tokens[role];if(!token)throw Error('Twitch account is not connected.');return token.accessToken;}
 account(role:Account):Token{const token=this.options.tokens[role];if(!token)throw Error('Twitch account is not connected.');return token;}
}
