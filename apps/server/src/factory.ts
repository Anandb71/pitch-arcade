import {resolve} from 'node:path';
import {Repository,type Pitch} from './storage.js';
import {emptyReceipt,type FactoryStep,type Receipt} from './codex-events.js';
import type {CodexRunner} from './runners.js';
import {prepareJob,removeJob} from './jobs.js';
export interface FactoryOptions {
 jobsRoot?:string;timeoutMs?:number;maxJobsPerHour?:number;
 complete:(pitch:Pitch,dir:string,receipt:Receipt)=>Promise<void>;
 emit?:(pitchId:number,step:FactoryStep)=>void;
}
export class Factory {
 private stopped=false;
 private directories=new Map<number,string>();
 private running=new Map<number,AbortController>();
 private waiters:(()=>void)[]=[];
 constructor(private store:Repository,private runner:CodexRunner,private options:FactoryOptions){
  // A stopped process cannot resume a model run. Requeue interrupted work with a new receipt.
  store.db.run("UPDATE builds SET status='failed',ended_at=? WHERE ended_at IS NULL",Date.now());
  store.db.run("UPDATE pitches SET status='queued' WHERE status='building'");
 }
 kick():void{
  while(!this.stopped&&this.store.enabled&&this.running.size<2){
   const spent=this.store.db.get<{n:number}>('SELECT count(*) AS n FROM builds WHERE started_at>?',Date.now()-3600000)?.n??0;
   if(spent>=(this.options.maxJobsPerHour??20))break;
   const pitch=this.store.queue()[0];if(!pitch)break;
   this.store.setPitch(pitch.id,'building');
   const controller=new AbortController();this.running.set(pitch.id,controller);
   void this.build(pitch,controller).finally(()=>{
    this.running.delete(pitch.id);this.kick();
    if(!this.running.size){for(const done of this.waiters.splice(0))done();}
   });
  }
 }
 stop():void{this.stopped=true;this.pause();}
 cancelPitches(ids:number[]):void{for(const id of ids){this.running.get(id)?.abort('forgotten');const dir=this.directories.get(id);if(dir)removeJob(dir);this.directories.delete(id);}}
 pause():void{for(const controller of this.running.values())controller.abort('cancelled');}
 idle():Promise<void>{return this.running.size?new Promise(resolve=>this.waiters.push(resolve)):Promise.resolve();}
 private async build(pitch:Pitch,controller:AbortController):Promise<void>{
  const started=Date.now();
  const buildId=this.store.db.run("INSERT INTO builds(pitch_id,model,started_at,status) VALUES(?,?,?,'building')",pitch.id,this.runner.model,started).lastInsertRowid;
  let dir:string|undefined;
  let receipt=emptyReceipt(this.runner.model,this.runner.model==='mock replay');
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort('timeout');},this.options.timeoutMs??150000);
  try{
   dir=prepareJob(pitch,this.options.jobsRoot??resolve('factory/jobs'));this.directories.set(pitch.id,dir);
   const abort=new Promise<never>((_,reject)=>{
    if(controller.signal.aborted)reject(Error('CANCELLED'));
    else controller.signal.addEventListener('abort',()=>reject(Error('CANCELLED')),{once:true});
   });
   receipt=await Promise.race([this.runner.run(dir,step=>{
    if(!this.store.pitch(pitch.id)){controller.abort('forgotten');return;}
    this.store.event('factory.step',{pitchId:pitch.id,kind:step.kind,label:step.label,simulated:step.simulated},Date.now(),pitch.user_id);
    this.options.emit?.(pitch.id,step);
   },controller.signal),abort]);
   if(controller.signal.aborted||!this.store.pitch(pitch.id))throw Error('CANCELLED');
   if(receipt.status!=='completed')throw Error('RUN_FAILED');
   await this.options.complete(pitch,dir,receipt);
   if(this.store.pitch(pitch.id)?.status==='building')this.store.setPitch(pitch.id,'built');
  }catch{
   receipt.status=timedOut?'timeout':controller.signal.aborted?'cancelled':'failed';
   this.store.setPitch(pitch.id,receipt.status==='cancelled'?'queued':'failed',receipt.status.toUpperCase());
   if(this.store.pitch(pitch.id))this.store.event('factory.failed',{pitchId:pitch.id,code:receipt.status.toUpperCase()},Date.now(),pitch.user_id);
  }finally{
   clearTimeout(timer);receipt.durationMs=Date.now()-started;
   this.store.db.run('UPDATE builds SET ended_at=?,status=?,codex_thread_id=?,playtests=?,tokens_in=?,tokens_out=?,receipt_json=? WHERE id=?',Date.now(),receipt.status,receipt.threadId,receipt.playtests,receipt.tokensIn,receipt.tokensOut,JSON.stringify(receipt),buildId);
   this.store.db.run('UPDATE games SET receipt_json=? WHERE pitch_id=?',JSON.stringify(receipt),pitch.id);
   if(dir)removeJob(dir);this.directories.delete(pitch.id);
  }
 }
}
