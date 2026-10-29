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
 const trace=()=>({outcomes:[] as string[],scores:[] as number[],frames:[] as number[],events:[] as number[]});
 const traces={idle:trace(),random:trace(),humanish:trace()};
 for(const name of ['idle','random','humanish'] as BotName[]){
  for(let seed=1;seed<=SEED_COUNT;seed++){
   const engine=new Engine(spec,seed),bot=createBot(name,seed,spec);
   const budget=Math.ceil((spec.seconds+.25)*HZ);
   const spawned=new Set<number>();let scoreEvents=0;
   for(let f=0;f<budget&&engine.outcome==='playing';f++){const before=engine.score;engine.step(bot(engine.snapshot()));scoreEvents+=Math.max(0,engine.score-before);for(const entity of engine.entities)if(entity.role!=='decor')spawned.add(entity.id);}
   traces[name].outcomes.push(engine.outcome);traces[name].scores.push(engine.score);traces[name].frames.push(engine.frame);traces[name].events.push(spawned.size+scoreEvents);
   const m=metrics[name];m.runs++;if(engine.outcome==='win')m.wins++;
   if(engine.outcome==='playing')metrics.neverEnds++;
   metrics.peakEntities=Math.max(metrics.peakEntities,engine.metrics.peakEntities);
   metrics.maxFrames=Math.max(metrics.maxFrames,engine.frame);
   const touch=engine.metrics.firstHazardFrame;
   if(touch!==null)metrics.firstHazardFrame=Math.min(metrics.firstHazardFrame??Infinity,touch);
  }
  metrics[name].rate=metrics[name].wins/SEED_COUNT;
 }
 const mean=(values:number[])=>values.reduce((a,b)=>a+b,0)/values.length;
 const variance=(values:number[])=>{const average=mean(values);return mean(values.map(value=>(value-average)**2));};
 metrics.engagement={pairedOutcomeChanges:traces.humanish.outcomes.filter((outcome,i)=>outcome!==traces.idle.outcomes[i]).length/SEED_COUNT,meanEvents:mean(traces.humanish.events),scoreVariance:variance(traces.humanish.scores),durationVariance:variance(traces.humanish.frames)};
 const issues=assess(metrics,spec.win.type);
 return {pass:issues.length===0,issues,metrics};
}
