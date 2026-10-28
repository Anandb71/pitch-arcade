import { Ajv } from 'ajv';
import schema from '../schema.json';
import verbList from '../verbs.json';
import emojiList from '../emoji.json';
import type { GameSpec } from './types.js';
export const verbs: Readonly<Record<string,string>> = verbList;
export const emoji: readonly string[] = emojiList;
const check = new Ajv({allErrors:true, strict:true}).compile(schema);
export interface Issue { code:'SCHEMA_ERROR'|'VERB_MISMATCH'; message:string }
export type Validation = {ok:true;spec:GameSpec;issues:[]} | {ok:false;issues:Issue[]};
export function validateSpec(value:unknown):Validation {
 if (!check(value)) return {ok:false, issues:(check.errors ?? []).map(e => ({code:'SCHEMA_ERROR',message:e.instancePath + ' ' + (e.message ?? 'invalid')}))};
 const spec = structuredClone(value) as unknown as GameSpec;
 spec.seconds ??= 5;
 const issues:Issue[]=[];
 const bad = (message:string) => issues.push({code:'SCHEMA_ERROR',message});
 if (!spec.title.trim() || spec.title !== spec.title.trim()) bad('Title must start and end with a letter, digit or punctuation.');
 const type = spec.win.type;
 if (verbs[spec.verb] !== type || (type === 'survive' && !(spec.lose.type === 'touch' && spec.lose.role === 'hazard'))) {
  issues.push({code:'VERB_MISMATCH',message:'Verb must match its win rule; survival needs touch hazard.'});
 }
 const control = spec.player.control;
 if ((type==='hit' && control!=='click') || (type==='mash' && control!=='mash') ||
     (['survive','collect','reach'].includes(type) && !['move_lr','move_4'].includes(control))) {
  bad('Control must support the win rule.');
 }
 const roles = new Set(spec.spawners.map(s=>s.role));
 const needed = type==='collect'||type==='reach' ? 'goal' : type==='hit' ? 'target' : undefined;
 if (needed && !roles.has(needed)) bad('Win references missing role '+needed+'.');
 if (spec.lose.type==='touch' && !roles.has(spec.lose.role)) bad('Lose references missing role '+spec.lose.role+'.');
 if (spec.mods.includes('wind_left') && spec.mods.includes('wind_right')) bad('Opposing wind mods conflict.');
 if (spec.mods.includes('floor_lava') && control!=='move_lr' && control!=='move_4') bad('floor_lava needs a moving player.');
 if (type!=='survive' && spec.lose.type!=='timeout') bad('Objective games use timeout as their lose rule.');
 return issues.length ? {ok:false,issues} : {ok:true,spec,issues:[]};
}
