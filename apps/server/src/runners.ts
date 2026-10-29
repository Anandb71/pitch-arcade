import poolData from './mock-pool.json';
import {mechanicsKey} from './quality.js';
import type {GameSpec} from '../../../packages/engine/src/index.js';
import {spawn as nodeSpawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {StringDecoder} from 'node:string_decoder';
import {CodexEventParser,emptyReceipt,type FactoryStep,type Receipt} from './codex-events.js';
import {codexArgs,resolveCodex,sandboxSettings,scrubEnvironment,verifySandbox} from './sandbox.js';
export interface CodexRunner {model:string;run:(dir:string,emit:(step:FactoryStep)=>void,signal:AbortSignal)=>Promise<Receipt>}
interface CliOptions {binary?:string;runtimeRoots?:string[];model?:string;spawn?:typeof nodeSpawn;preflight?:typeof verifySandbox}
export class CodexCliRunner implements CodexRunner {
 readonly model:string;private binary:string;private roots:string[];
 constructor(private options:CliOptions={}){
  const installation=options.binary?{binary:options.binary,runtimeRoots:options.runtimeRoots??[]}:resolveCodex();
  this.binary=installation.binary;this.roots=installation.runtimeRoots;this.model=options.model??'gpt-6.1-sol';
 }
 async run(dir:string,emit:(step:FactoryStep)=>void,signal:AbortSignal):Promise<Receipt>{
  const started=Date.now(),settings=sandboxSettings(this.roots);
  await (this.options.preflight??verifySandbox)(this.binary,dir,settings,signal);
  signal.throwIfAborted();
  const feedbackPath=join(dir,'inbox/feedback.json');
  const remaining=existsSync(feedbackPath)?(JSON.parse(readFileSync(feedbackPath,'utf8')) as {remainingPlaytests:number}).remainingPlaytests:4;
  if(!Number.isInteger(remaining)||remaining<1||remaining>4)throw Error('INVALID_PLAYTEST_BUDGET');
  const parser=new CodexEventParser(this.model,emit,remaining);
  const child=(this.options.spawn??nodeSpawn)(this.binary,codexArgs(dir,this.model,settings),{
   cwd:dir,env:scrubEnvironment(),detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']
  });
  return new Promise<Receipt>(resolve=>{
   let settled=false,aborted=false,invalid=false;const decoder=new StringDecoder('utf8');
   const kill=()=>{
    try{if(child.pid&&process.platform!=='win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{child.kill('SIGKILL');}
   };
   const finish=(code:number|null)=>{
    if(settled)return;settled=true;signal.removeEventListener('abort',abort);
    try{parser.push(decoder.end());parser.finish();}catch{invalid=true;}
    const receipt={...parser.receipt,durationMs:Date.now()-started};
    if(aborted)receipt.status='cancelled';
    else if(code!==0||invalid||!receipt.threadId)receipt.status='failed';
    resolve(receipt);
   };
   const abort=()=>{aborted=true;kill();finish(null);};
   signal.addEventListener('abort',abort,{once:true});
   child.stdout?.on('data',(chunk:Buffer)=>{try{parser.push(decoder.write(chunk));}catch{invalid=true;kill();finish(null);}});
   // Drain stderr without storing or forwarding potentially sensitive content.
   child.stderr?.on('data',()=>{});
   child.once('error',()=>finish(null));child.once('close',finish);
   if(signal.aborted)abort();
  });
 }
}
export interface MockOptions {stepMs?:number}
export class MockCodexRunner implements CodexRunner {
 readonly model='mock replay';private used=new Set<string>();private families=new Map<string,number>();
 constructor(private options:MockOptions={}){}
 async run(dir:string,emit:(step:FactoryStep)=>void,signal:AbortSignal):Promise<Receipt>{
  const started=Date.now(),receipt=emptyReceipt(this.model,true);
  const inbox=JSON.parse(readFileSync(join(dir,'inbox/pitch.json'),'utf8')) as {untrusted_text:string};
  const idea=inbox.untrusted_text.toLowerCase();
  const contextPath=join(dir,'inbox/context.json'),context=existsSync(contextPath)?JSON.parse(readFileSync(contextPath,'utf8')) as {knownFingerprints?:string[]}:{};
  const known=new Set(context.knownFingerprints??[]),pool=poolData.games as unknown as {family:string;spec:GameSpec}[];
  const preferred=/mash|pump|charge|rocket|rhythm|robot|dance/.test(idea)?'mash':/pop|click|bubble|aim|shoot|timing|reflex|tap/.test(idea)?'hit':/catch|collect|berry|stack|pancake|harvest|scoop/.test(idea)?'collect':/escape|reach|moon|memory|find|chase|ghost|deliver/.test(idea)?'reach':/dodge|avoid|survive/.test(idea)?'survive':null;
  const score=(entry:{spec:GameSpec})=>(entry.spec.win.type===preferred?4:0)+entry.spec.title.toLowerCase().split(' ').filter(word=>word.length>3&&idea.includes(word)).length;
  const selected=pool.filter(entry=>!known.has(mechanicsKey(entry.spec))&&!this.used.has(mechanicsKey(entry.spec))).sort((a,b)=>score(b)-score(a)||(this.families.get(a.family)??0)-(this.families.get(b.family)??0))[0];
  if(!selected){writeFileSync(join(dir,'out/reject.json'),JSON.stringify({reason:'The mock replay pool has no unused mechanic. Start a fresh demo or use live generation.'}));receipt.status='completed';receipt.durationMs=Date.now()-started;return receipt;}
  const spec=structuredClone(selected.spec);this.used.add(mechanicsKey(spec));this.families.set(selected.family,(this.families.get(selected.family)??0)+1);
  const step=async(kind:FactoryStep['kind'],label:string)=>{
   signal.throwIfAborted();emit({kind,label,simulated:true});
   if(this.options.stepMs!==0)await delay(this.options.stepMs??350,undefined,{signal});
  };
  await step('writing','writing game.json');
  writeFileSync(join(dir,'out/game.json'),JSON.stringify(spec,null,2));
  await step('tuning','preparing game parameters');
  await step('playtest','playtest 1: PASS');
  writeFileSync(join(dir,'out/notes.md'),'A simulated replay uses a measured mechanical variant from the expanded seed library.');
  await step('done','done');
  receipt.playtests=1;receipt.status='completed';receipt.durationMs=Date.now()-started;
  return receipt;
 }
}
