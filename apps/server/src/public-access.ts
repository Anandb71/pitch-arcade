import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
export interface PublicAccessOptions {hosts?:string|undefined;token?:string|undefined;warn?:(message:string)=>void}
type Headers=Record<string,string|string[]|undefined>;
type Kind='local'|'public'|'unknown';
const cookieName='__Host-arcade';
const loopback=(host:string|undefined):boolean=>!!host&&/^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host);
const hostname=/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const digest=(value:string)=>createHash('sha256').update(value).digest();
export class PublicAccess {
 #hosts:string[]=[];#token='';#hash:Buffer|undefined;
 constructor(options:PublicAccessOptions={}){
  const rawHosts=(options.hosts??'').split(',').map(host=>host.trim()).filter(Boolean),hosts=rawHosts.map(host=>host.toLowerCase());if(!hosts.length)return;
  const warn=options.warn??console.warn;
  if(!options.token||[...options.token].length<24){warn('Public access is disabled. Set ARCADE_ACCESS_TOKEN to at least 24 characters. Loopback access remains available.');return;}
  if(rawHosts.some(host=>/[^\x00-\x7F]/.test(host))||hosts.some(host=>!hostname.test(host.startsWith('*.')?host.slice(2):host))){warn('Public access is disabled. ARCADE_PUBLIC_HOSTS must contain exact hostnames or a leading wildcard. Loopback access remains available.');return;}
  this.#hosts=hosts;this.#token=options.token;this.#hash=digest(options.token);
 }
 kind(host:string|undefined):Kind{
  if(loopback(host))return 'local';const name=host?.toLowerCase();if(!name||/[^\x00-\x7F]/.test(host!)||!hostname.test(name))return 'unknown';
  return this.#hosts.some(allowed=>allowed.startsWith('*.')?name.endsWith(allowed.slice(1))&&name!==allowed.slice(2):name===allowed)?'public':'unknown';
 }
 originAllowed(origin:string|undefined,host:string|undefined,required=false):boolean{
  const kind=this.kind(host);if(kind==='unknown')return false;if(!origin)return !required;
  try{const url=new URL(origin);if(kind==='local')return url.host===host&&(url.protocol==='http:'||url.protocol==='https:');return url.protocol==='https:'&&url.host===host!.toLowerCase()&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash;}catch{return false;}
 }
 #equal(value:string,expected:Buffer):boolean{return timingSafeEqual(digest(value),expected);}
 #cookie(host:string):string{return createHmac('sha256',this.#token).update('pitch-arcade public cookie\0'+host.toLowerCase()).digest('base64url');}
 authorize(host:string,headers:Headers,rawUrl:string,websocket=false):{authorized:boolean;path?:string;location?:string;cookie?:string}{
  if(this.kind(host)!=='public'||!this.#hash)return {authorized:false};
  let url:URL;try{if(/[\s\\]/.test(rawUrl)||!rawUrl.startsWith('/')||rawUrl.startsWith('//'))return {authorized:false};url=new URL(rawUrl,'http://arcade.invalid');if(url.origin!=='http://arcade.invalid'||url.pathname.startsWith('//'))return {authorized:false};}catch{return {authorized:false};}
  const keys=url.searchParams.getAll('key');if(keys.length>1)return {authorized:false};
  if(keys.length){
   if(!this.#equal(keys[0]!,this.#hash))return {authorized:false};
   url.searchParams.delete('key');const location=url.pathname+url.search;
   try{if(location.includes(this.#token)||decodeURIComponent(location).includes(this.#token))return {authorized:false};}catch{return {authorized:false};}
   return websocket?{authorized:true,path:url.pathname}:{authorized:true,path:url.pathname,location,cookie:cookieName+'='+this.#cookie(host)+'; Path=/; HttpOnly; Secure; SameSite=Lax'};
  }
  const header=headers['x-arcade-key'];if(header!==undefined)return {authorized:typeof header==='string'&&this.#equal(header,this.#hash),path:url.pathname};
  const rawCookie=headers.cookie;if(typeof rawCookie!=='string')return {authorized:false};
  const values=rawCookie.split(';').map(part=>part.trim()).filter(part=>part.startsWith(cookieName+'='));if(values.length!==1)return {authorized:false};
  const value=values[0]!.slice(cookieName.length+1);
  return {authorized:this.#equal(value,digest(this.#cookie(host))),path:url.pathname};
 }
}
