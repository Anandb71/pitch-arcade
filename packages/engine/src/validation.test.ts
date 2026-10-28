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
