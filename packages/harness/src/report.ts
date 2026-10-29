export type Code='SCHEMA_ERROR'|'TOO_EASY'|'TOO_HARD'|'IDLE_WINS'|'NEVER_ENDS'|'SPAWN_KILL'|'OVERCROWDED'|'VERB_MISMATCH';
export interface Finding {code:Code;hint:string}
export interface BotMetric {wins:number;runs:number;rate:number}
export interface Engagement {pairedOutcomeChanges:number;meanEvents:number;scoreVariance:number;durationVariance:number}
export interface Metrics {
 engagement?:Engagement;
 seeds:number;idle:BotMetric;random:BotMetric;humanish:BotMetric;
 neverEnds:number;firstHazardFrame:number|null;peakEntities:number;maxFrames:number;
}
export interface Report {pass:boolean;issues:Finding[];metrics?:Metrics}
export function assess(m:Metrics,winType:string):Finding[] {
 const issues:Finding[]=[];
 const add=(code:Code,hint:string)=>issues.push({code,hint});
 if(m.humanish.rate>.85)add('TOO_EASY','Humanish wins '+Math.round(m.humanish.rate*100)+'%. Increase challenge or objective count.');
 if(m.humanish.rate<.35)add('TOO_HARD','Humanish wins '+Math.round(m.humanish.rate*100)+'%. Reduce speed, spawn rate or objective count.');
 if(m.random.rate-m.humanish.rate>.0500000001)add('TOO_HARD','Random beats humanish by more than 5 points. Make the intended action more useful.');
 if(m.idle.rate>(winType==='survive'?.6:.05))add('IDLE_WINS','Idle wins '+Math.round(m.idle.rate*100)+'%. Require meaningful input or increase hazard coverage.');
 if(m.neverEnds)add('NEVER_ENDS','A run exceeds duration plus 0.25 seconds. Check terminal rules.');
 if(m.firstHazardFrame!==null&&m.firstHazardFrame<30)add('SPAWN_KILL','A hazard touches the player before 0.5 seconds. Move it away or use a safer origin.');
 if(m.peakEntities>60)add('OVERCROWDED','Peak count is '+m.peakEntities+'. Lower spawner max or spawn rate to stay at 60 entities.');
 return issues;
}
export function compact(report:Report):string {
 const m=report.metrics;
 return (report.pass?'PASS':'FAIL')+(m?' | 40 seeds | idle '+Math.round(m.idle.rate*100)+'% | random '+Math.round(m.random.rate*100)+'% | humanish '+Math.round(m.humanish.rate*100)+'% | peak '+m.peakEntities:'')+(m?.engagement?' | input '+Math.round(m.engagement.pairedOutcomeChanges*100)+'% | events '+m.engagement.meanEvents.toFixed(1)+' | score variance '+m.engagement.scoreVariance.toFixed(2):'')+
 report.issues.map(i=>'\n'+i.code+': '+i.hint).join('');
}
