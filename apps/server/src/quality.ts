import {createHash} from 'node:crypto';
import type {GameSpec} from '../../../packages/engine/src/index.js';
import type {Report} from '../../../packages/harness/src/index.js';
export interface QualityIssue {code:string;hint:string}
export interface QualityReport {version:1;pass:boolean;issues:QualityIssue[];fingerprint:string}
export function mechanics(spec:GameSpec){
 const movement=spec.player.control==='move_lr'||spec.player.control==='move_4',movingEntities=spec.spawners.some(s=>s.role!=='decor'&&!['still','popup'].includes(s.motion));
 const usefulMods=spec.mods.filter(mod=>mod!=='spotlight'&&(mod==='speedup'?(movement||movingEntities):mod==='mirror'?(movement||spec.player.control==='click'):mod==='floor_lava'?spec.player.control==='move_4':movement));
 return {control:spec.player.control,seconds:spec.seconds,win:spec.win.type,n:'n' in spec.win?spec.win.n:1,lose:spec.lose.type,mods:usefulMods.sort(),player:movement?[spec.player.speed,spec.player.size]:[],spawners:spec.spawners.filter(s=>s.role!=='decor').map(s=>({role:s.role,from:s.from,motion:s.motion,every:s.every,max:s.every==='once'?1:Math.min(s.max,Math.ceil(spec.seconds/s.every)),speed:['still','popup'].includes(s.motion)?0:s.speed,size:s.size})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en'))};
}
export function mechanicsFingerprint(spec:GameSpec):string{return JSON.stringify(mechanics(spec));}
export function mechanicsKey(spec:GameSpec):string{return createHash('sha256').update(mechanicsFingerprint(spec)).digest('hex').slice(0,24);}
function shape(value:unknown):unknown{if(typeof value==='number')return '#';if(Array.isArray(value))return value.map(shape);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,shape(child)]));return value;}
function numbers(value:unknown):number[]{return typeof value==='number'?[value]:Array.isArray(value)?value.flatMap(numbers):value&&typeof value==='object'?Object.values(value).flatMap(numbers):[];}
export function nearDuplicate(a:GameSpec,b:GameSpec):boolean{const x=mechanics(a),y=mechanics(b);if(JSON.stringify(shape(x))!==JSON.stringify(shape(y)))return false;const left=numbers(x),right=numbers(y),distances=left.map((n,i)=>Math.abs(n-right[i]!)/Math.max(1,Math.abs(n),Math.abs(right[i]!)));return Math.max(...distances)<=.25+1e-9&&distances.reduce((sum,d)=>sum+d,0)/distances.length<=.12+1e-9;}
export function recentDigest(specs:GameSpec[]){return specs.slice(-8).reverse().map(spec=>({mechanic:spec.win.type,control:spec.player.control,theme:{palette:spec.palette,pattern:spec.pattern,player:spec.player.emoji,entities:spec.spawners.map(s=>s.emoji)},motions:spec.spawners.filter(s=>s.role!=='decor').map(s=>s.motion),mods:spec.mods,objective:'n' in spec.win?spec.win.n:1}));}
export function qualityCheck(spec:GameSpec,report:Report,catalog:readonly GameSpec[]):QualityReport{
 const issues:QualityIssue[]=[],add=(code:string,hint:string)=>issues.push({code,hint}),m=report.metrics,e=m?.engagement,fingerprint=mechanicsFingerprint(spec);
 if(!report.pass||!m||!e||m.seeds!==40||[m.idle,m.random,m.humanish].some(bot=>bot.runs!==40||!Number.isFinite(bot.rate))||Object.values(e).some(value=>!Number.isFinite(value)))add('FUN_EVIDENCE','Pass the original schema and forty seed bot harness before checking quality.');
 if(spec.seconds!==5)add('FUN_DURATION','Use an explicit five second objective so the cue and deadline stay clear.');
 if(spec.sfx==='none')add('FUN_FEEDBACK','Choose pop, ding or boom so the standard renderer can reinforce meaningful events.');
 if(m&&e){
  if(m.humanish.rate<.4||m.humanish.rate>.8||m.humanish.rate-m.random.rate<.15-1e-9)add('FUN_SKILL_GAP','Aim for humanish wins from 40% to 80%, at least 15 percentage points above random. Tune meaningful aiming, routes or cadence.');
  if(e.pairedOutcomeChanges<.2)add('FUN_INPUT','Humanish input must change at least 20% of paired outcomes against idle. Make the intended action matter.');
  if(m.idle.rate>(spec.win.type==='survive'?.25:.025))add('FUN_IDLE','Require active play. Idle may win at most 25% of survival seeds or 2.5% of objective seeds.');
  if(e.meanEvents<4&&e.scoreVariance<.15&&e.durationVariance<100)add('FUN_EVENTS','Provide at least four meaningful events per skilled run, or score variance of 0.15, or finish frame variance of 100. Decor does not count.');
 }
 if(catalog.some(other=>mechanicsFingerprint(other)===fingerprint))add('FUN_DUPLICATE','This repeats library mechanics. Change the control, goal, motion, origin, meaningful mods or spawn structure rather than the title or palette.');
 else if(catalog.some(other=>nearDuplicate(spec,other)))add('FUN_NEAR_DUPLICATE','This is too close to a library game. Make a substantial mechanic or parameter change, then rerun the playtest.');
 return {version:1,pass:issues.length===0,issues,fingerprint};
}
