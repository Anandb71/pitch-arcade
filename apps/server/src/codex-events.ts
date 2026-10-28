export type StepKind='writing'|'playtest'|'tuning'|'done'|'failed';
export interface FactoryStep {kind:StepKind;label:string;simulated:boolean}
export interface Receipt {
 source:'codex-cli'|'mock-codex';simulated:boolean;threadId:string|null;model:string;
 durationMs:number;playtests:number;tokensIn:number|null;tokensOut:number|null;
 usageLimitReset?:string;
 status:'completed'|'failed'|'timeout'|'cancelled';
}
export function emptyReceipt(model:string,simulated=false):Receipt {
 return {source:simulated?'mock-codex':'codex-cli',simulated,threadId:null,model,durationMs:0,playtests:0,tokensIn:null,tokensOut:null,status:'failed'};
}
const codes=['SCHEMA_ERROR','TOO_EASY','TOO_HARD','IDLE_WINS','NEVER_ENDS','SPAWN_KILL','OVERCROWDED','VERB_MISMATCH'];
const record=(x:unknown):Record<string,unknown>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
export class CodexEventParser {
 readonly receipt:Receipt;
 readonly steps:FactoryStep[]=[];
 private buffer='';private bytes=0;private counted=new Set<string>();private completed=new Set<string>();
 constructor(model:string,private emit:(step:FactoryStep)=>void=()=>{}){this.receipt=emptyReceipt(model);}
 private step(kind:StepKind,label:string):void {
  const step={kind,label,simulated:false};
  if(this.steps.length>=200)throw Error('EVENT_LIMIT');
  this.steps.push(step);
  this.emit(step);
 }
 push(chunk:string):void {
  this.bytes+=Buffer.byteLength(chunk);this.buffer+=chunk;
  if(this.bytes>4194304||this.buffer.length>1048576)throw Error('EVENT_LIMIT');
  let end;
  while((end=this.buffer.indexOf('\n'))>=0){
   const line=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+1);
   if(line.trim())this.line(line);
  }
 }
 finish():void{if(this.buffer.trim())this.line(this.buffer);this.buffer='';}
 private line(line:string):void{
  let parsed:unknown;try{parsed=JSON.parse(line);}catch{throw Error('INVALID_EVENT');}
  const e=record(parsed),item=record(e.item);
  if(e.type==='error'||e.type==='turn.failed'){
   const message=typeof e.message==='string'?e.message:typeof record(e.error).message==='string'?record(e.error).message as string:'';
   if(/usage.limit|limit.reached|out of.*(?:credits|usage)|hit your.*limit/i.test(message)){
    this.receipt.usageLimitReset=message.match(/(?:try again|reset[ s:]*)[^\n]{0,100}/i)?.[0]?.replace(/[^a-zA-Z0-9 :.,()+/-]/g,'')??'Reset time was not supplied.';
   }
  }
  if(e.type==='thread.started'&&typeof e.thread_id==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(e.thread_id))this.receipt.threadId=e.thread_id;
  if(e.type==='item.started'||e.type==='item.completed'){
   const id=typeof item.id==='string'?item.id:'';
   const command=typeof item.command==='string'?item.command:'';
   if(item.type==='command_execution'&&/\bnode\s+tools\/playtest\.mjs\s+out\/game\.json\b/.test(command)){
    if(!this.counted.has(id)){this.counted.add(id);this.receipt.playtests++;if(this.receipt.playtests>4)throw Error('PLAYTEST_LIMIT');}
    if(e.type==='item.completed'&&!this.completed.has(id)){
     this.completed.add(id);
     const output=typeof item.aggregated_output==='string'?item.aggregated_output:'';
     const result=item.exit_code===0&&/^PASS\b/m.test(output)?'PASS':codes.find(code=>new RegExp('\\b'+code+'\\b').test(output))??'FAIL';
     this.step('playtest','playtest '+this.receipt.playtests+': '+result);
    }
   }
   if(e.type==='item.completed'&&item.type==='file_change'&&Array.isArray(item.changes)&&item.changes.some(c=>{const path=record(c).path;return typeof path==='string'&&/(^|\/)out\/game\.json$/.test(path);})){
    this.step(this.receipt.playtests?'tuning':'writing',this.receipt.playtests?'tuning game.json':'writing game.json');
   }
   if(e.type==='item.completed'&&item.type==='command_execution'&&!this.receipt.playtests&&/out\/game\.json/.test(command)&&!/playtest\.mjs/.test(command))this.step('writing','writing game.json');
  }
  if(e.type==='turn.completed'){
   const usage=record(e.usage);
   const count=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0?n:null;
   this.receipt.tokensIn=count(usage.input_tokens);this.receipt.tokensOut=count(usage.output_tokens);
   this.receipt.status='completed';this.step('done','done');
  }
  if(e.type==='turn.failed'||e.type==='error'){this.receipt.status='failed';this.step('failed','Factory run failed.');}
 }
}
