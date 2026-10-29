import type {PlayOutcome} from './protocol.js';
export function safeName(value:string):string{return /^[a-zA-Z0-9_]{1,25}$/.test(value)?value.toLowerCase():'anonymous';}
export function scoreRound(outcome:PlayOutcome,streak:number):{player:number;designer:number;combo:number;multiplier:number}{const combo=outcome==='win'?Math.max(0,Math.floor(Number.isFinite(streak)?streak:0))+1:0,multiplier=Math.min(5,Math.max(1,combo));return {player:outcome==='win'?100*multiplier:0,designer:outcome==='lose'?100:0,combo,multiplier};}
export interface ScoreEntry {login:string;score:number;simulated?:boolean}
export function rankScores<T extends ScoreEntry>(entries:T[],limit=5):T[]{return entries.map(entry=>({...entry,login:safeName(entry.login),score:Number.isFinite(entry.score)?Math.max(0,Math.floor(entry.score)):0})).sort((a,b)=>b.score-a.score||a.login.localeCompare(b.login,'en')).slice(0,limit);}
