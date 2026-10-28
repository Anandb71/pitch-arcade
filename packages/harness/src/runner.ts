import { Engine, HZ, validateSpec } from '../../engine/src/index.js';
import { createBot, type BotName } from './bots.js';
import { assess, type Metrics, type Report } from './report.js';
export const SEED_COUNT=40;
export function playtest(value:unknown):Report {
 const parsed=validateSpec(value);
 if(!parsed.ok)return {pass:false,issues:parsed.issues.map(i=>({code:i.code,hint:i.message+' Use the documented fields and matching verb.'}))};
 const spec=parsed.spec;
 const blank=()=>({wins:0,runs:0,rate:0});
 const metrics:Metrics={seeds:SEED_COUNT,idle:blank(),random:blank(),humanish:blank(),neverEnds:0,firstHazardFrame:null,peakEntities:1,maxFrames:0};
 for(const name of ['idle','random','humanish'] as BotName[]){
  for(let seed=1;seed<=SEED_COUNT;seed++){
   const engine=new Engine(spec,seed),bot=createBot(name,seed,spec);
   const budget=Math.ceil((spec.seconds+.25)*HZ);
   for(let f=0;f<budget&&engine.outcome==='playing';f++)engine.step(bot(engine.snapshot()));
   const m=metrics[name];m.runs++;if(engine.outcome==='win')m.wins++;
   if(engine.outcome==='playing')metrics.neverEnds++;
   metrics.peakEntities=Math.max(metrics.peakEntities,engine.metrics.peakEntities);
   metrics.maxFrames=Math.max(metrics.maxFrames,engine.frame);
   const touch=engine.metrics.firstHazardFrame;
   if(touch!==null)metrics.firstHazardFrame=Math.min(metrics.firstHazardFrame??Infinity,touch);
  }
  metrics[name].rate=metrics[name].wins/SEED_COUNT;
 }
 const issues=assess(metrics,spec.win.type);
 return {pass:issues.length===0,issues,metrics};
}
