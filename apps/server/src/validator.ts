import {constants,openSync,closeSync,fstatSync,readFileSync,readSync,lstatSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {validateSpec,type GameSpec} from '../../../packages/engine/src/index.js';
import {playtest,type Report} from '../../../packages/harness/src/index.js';
import {defaultDenylist,unsafeInstructions} from './moderation.js';
export interface OutputIssue {code:string;hint:string}
export interface Difficulty {humanishWinRate:number;idleWinRate:number;randomWinRate:number;challenge:number}
export type ValidatedGame={ok:true;spec:GameSpec;report:Report;difficulty:Difficulty};
export type ValidationResult=ValidatedGame|{ok:false;issues:OutputIssue[]};
const fail=(code:string,hint:string):ValidationResult=>({ok:false,issues:[{code,hint}]});
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
export function validateGame(value:unknown,denylist:readonly string[]=defaultDenylist):ValidationResult{
 const unsafe=scanStrings(value);
 if(unsafe.length)return {ok:false,issues:unsafe.map(code=>({code,hint:'Output contains an unsafe string. Use only game data.'}))};
 const parsed=validateSpec(value);
 if(!parsed.ok)return {ok:false,issues:parsed.issues.map(i=>({code:i.code,hint:'Game data does not match the documented format.'}))};
 if([...defaultDenylist,...denylist].some(word=>parsed.spec.title.toLowerCase().includes(word)))return fail('TITLE_FILTER','Choose a friendly game title.');
 const report=playtest(parsed.spec);
 if(!report.pass)return {ok:false,issues:report.issues};
 const metrics=report.metrics!;
 return {ok:true,spec:parsed.spec,report,difficulty:{humanishWinRate:metrics.humanish.rate,idleWinRate:metrics.idle.rate,randomWinRate:metrics.random.rate,challenge:1-metrics.humanish.rate}};
}
function readOutput(path:string):unknown{
 const descriptor=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const stat=fstatSync(descriptor);
  if(!stat.isFile()||stat.nlink!==1||stat.size>65536)throw Error('UNSAFE_OUTPUT');
  const buffer=Buffer.alloc(65537),length=readSync(descriptor,buffer,0,buffer.length,0);
  if(length>65536)throw Error('UNSAFE_OUTPUT');
  return JSON.parse(buffer.subarray(0,length).toString('utf8')) as unknown;
 }finally{closeSync(descriptor);}
}
export function validateJobOutput(dir:string,denylist:readonly string[]=defaultDenylist):ValidationResult{
 try{
  const out=join(dir,'out'),stat=lstatSync(out);
  if(!stat.isDirectory()||stat.isSymbolicLink())return fail('UNSAFE_OUTPUT','Output must be a regular local directory.');
  const rejected=join(out,'reject.json');
  if(existsSync(rejected)||safeIsLink(rejected)){
   const value=readOutput(rejected);
   if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).join(',')!=='reason'||typeof (value as {reason?:unknown}).reason!=='string'||(!(value as {reason:string}).reason.trim()||(value as {reason:string}).reason.length>200)||scanStrings(value).length)return fail('UNSAFE_OUTPUT','Designer rejection contains invalid data.');
   return fail('DESIGNER_REJECTED','The designer declined this pitch.');
  }
  return validateGame(readOutput(join(out,'game.json')),denylist);
 }catch{return fail('UNSAFE_OUTPUT','Provide a regular game.json file under 64 KiB, or a safe reject.json.');}
}
function safeIsLink(path:string):boolean{try{return lstatSync(path).isSymbolicLink();}catch{return false;}}
