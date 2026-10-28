import {unsafeInstructions} from './moderation.js';
function entropy(value:string):number{
 const counts=new Map<string,number>();for(const c of value)counts.set(c,(counts.get(c)??0)+1);
 return [...counts.values()].reduce((sum,n)=>sum-n/value.length*Math.log2(n/value.length),0);
}
/** Values and keys are checked before schema errors can expose untrusted content. */
export function scanStrings(value:unknown):string[]{
 const found=new Set<string>();let visited=0;
 const walk=(v:unknown,depth:number):void=>{
  if(depth>20||++visited>2000){found.add('OUTPUT_LIMIT');return;}
  if(typeof v==='string'){
   if(v.length>1000)found.add('OUTPUT_LIMIT');
   if(/\b(?:sk-(?:proj-|svcacct-)?[a-z0-9_-]{8,}|gh[pousr]_[a-z0-9]{12,}|oauth:[a-z0-9]{10,}|Bearer\s+\S+)|(?:api[_ ]?key|access[_ ]?token)\s*[:=]/i.test(v))found.add('SECRET_PATTERN');
   if(unsafeInstructions.test(v)||/https?:\/\/|file:\/\/|(?:^|\s)\.\.\/|^\/|^[a-z]:\\|<[^>]+>|\bonerror\s*=/i.test(v))found.add('UNSAFE_STRING');
   for(const token of v.match(/[A-Za-z0-9_+=-]{16,}/g)??[]){
    if(((/[a-z]/i.test(token)&&/\d/.test(token)&&entropy(token)>=3.7)||(token.length>=20&&entropy(token)>=3.8)))found.add('SECRET_ENTROPY');
   }
  }else if(Array.isArray(v))for(const child of v)walk(child,depth+1);
  else if(v&&typeof v==='object')for(const [key,child] of Object.entries(v)){walk(key,depth+1);walk(child,depth+1);}
 };
 walk(value,0);return [...found];
}
