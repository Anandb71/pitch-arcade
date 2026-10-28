import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { validateSpec, verbs, emoji } from './index.js';

const examples = readdirSync('factory/template/examples').filter(x => x.endsWith('.json')).map(x => JSON.parse(readFileSync('factory/template/examples/' + x, 'utf8')));
describe('format v1', () => {
 test('curated examples validate', () => {
  expect(examples.length).toBeGreaterThanOrEqual(10);
  for (const spec of examples) expect(validateSpec(spec), spec.title).toMatchObject({ok:true});
 });
 test('allowlists are explicit and substantial', () => {
  expect(Object.keys(verbs)).toHaveLength(30);
  expect(emoji.length).toBeGreaterThanOrEqual(290);
  expect(new Set(emoji).size).toBe(emoji.length);
 });
 test.each(['https://bad.test', 'bad/title', 'Bad—Title', '<script>', 'ab', 'a'.repeat(25)])('rejects title %s', title => {
  expect(validateSpec({...examples[0], title}).ok).toBe(false);
 });
 test('rejects code and unknown properties at every depth', () => {
  expect(validateSpec({...examples[0], script:'alert(1)'}).ok).toBe(false);
  expect(validateSpec({...examples[0], player:{...examples[0].player, url:'x'}}).ok).toBe(false);
 });
 test('reports mismatched verbs separately', () => {
  expect(validateSpec({...examples[0], verb:'MASH'}).issues).toEqual(expect.arrayContaining([expect.objectContaining({code:'VERB_MISMATCH'})]));
 });
 test('checks referenced roles and control consistency', () => {
  const s = {...examples[0], verb:'COLLECT', win:{type:'collect',n:2}, lose:{type:'timeout'}};
  expect(validateSpec(s).issues.some(x => x.message.includes('goal'))).toBe(true);
  expect(validateSpec({...s, player:{...s.player, control:'click'}}).ok).toBe(false);
 });
 test('rejects conflicting mods, duplicates, unsafe emoji and excessive limits', () => {
  for (const patch of [{mods:['wind_left','wind_right']},{mods:['mirror','mirror']},{player:{...examples[0].player,emoji:'🔫'}},{spawners:Array(5).fill(examples[0].spawners[0])}])
   expect(validateSpec({...examples[0],...patch}).ok).toBe(false);
 });
 test('defaults duration without mutating input', () => {
  const s = {...examples[0]}; delete s.seconds;
  const r = validateSpec(s);
  expect(r.ok && r.spec.seconds).toBe(5);
  expect(s.seconds).toBeUndefined();
 });
});

test('examples cover every closed MVP value',()=>{
 const cover=(actual:string[],expected:string[])=>expect(new Set(actual)).toEqual(new Set(expected));
 cover(examples.map(s=>s.player.control),['move_lr','move_4','click','mash']);
 cover(examples.flatMap(s=>s.spawners.map((p:{motion:string})=>p.motion)),['fall','rise','sweep','bounce','chase','flee','still','popup']);
 cover(examples.flatMap(s=>s.spawners.map((p:{from:string})=>p.from)),['top','bottom','left','right','edges','random','center']);
 cover(examples.flatMap(s=>s.spawners.map((p:{role:string})=>p.role)),['hazard','goal','target','decor']);
 cover(examples.flatMap(s=>[s.player.size,...s.spawners.map((p:{size:string})=>p.size)]),['s','m','l']);
 cover(examples.map(s=>s.win.type),['survive','collect','reach','hit','mash']);
 cover(examples.flatMap(s=>s.mods),['wind_left','wind_right','mirror','spotlight','floor_lava','speedup']);
 cover(examples.map(s=>s.palette),['sunset','ocean','candy','forest','midnight','citrus','ice','mono']);
 cover(examples.map(s=>s.pattern),['none','dots','stripes','grid','stars']);
 cover(examples.map(s=>s.sfx),['pop','boom','ding','none']);
 cover(examples.map(s=>s.verb),Object.keys(verbs));
});
