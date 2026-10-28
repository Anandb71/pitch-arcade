import {spawn as nodeSpawn} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
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
  this.binary=installation.binary;this.roots=installation.runtimeRoots;this.model=options.model??'gpt-6-luna';
 }
 async run(dir:string,emit:(step:FactoryStep)=>void,signal:AbortSignal):Promise<Receipt>{
  const started=Date.now(),settings=sandboxSettings(this.roots);
  await (this.options.preflight??verifySandbox)(this.binary,dir,settings,signal);
  signal.throwIfAborted();
  const parser=new CodexEventParser(this.model,emit);
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
export interface MockOptions {stepMs?:number;examplesDir?:string}
export class MockCodexRunner implements CodexRunner {
 readonly model='mock replay';
 constructor(private options:MockOptions={}){}
 async run(dir:string,emit:(step:FactoryStep)=>void,signal:AbortSignal):Promise<Receipt>{
  const started=Date.now(),receipt=emptyReceipt(this.model,true);
  const inbox=JSON.parse(readFileSync(join(dir,'inbox/pitch.json'),'utf8')) as {untrusted_text:string};
  const idea=inbox.untrusted_text.toLowerCase();
  const name=/mash|pump|charge|rocket/.test(idea)?'05-rocket-charge.json':/pop|click|bubble/.test(idea)?'02-bubble-pop.json':/catch|collect|berry/.test(idea)?'03-berry-basket.json':/escape|reach|moon/.test(idea)?'04-moon-escape.json':'01-taco-rain.json';
  const spec=JSON.parse(readFileSync(join(this.options.examplesDir??'factory/template/examples',name),'utf8'));
  const step=async(kind:FactoryStep['kind'],label:string)=>{
   signal.throwIfAborted();emit({kind,label,simulated:true});
   if(this.options.stepMs!==0)await delay(this.options.stepMs??350,undefined,{signal});
  };
  await step('writing','writing game.json');
  writeFileSync(join(dir,'out/game.json'),JSON.stringify(spec,null,2));
  await step('tuning','preparing game parameters');
  await step('playtest','playtest 1: PASS');
  writeFileSync(join(dir,'out/notes.md'),'A simulated factory replay uses a curated game.');
  await step('done','done');
  receipt.playtests=1;receipt.status='completed';receipt.durationMs=Date.now()-started;
  return receipt;
 }
}
