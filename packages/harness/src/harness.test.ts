import { expect, test } from 'vitest';
import { readFileSync,readdirSync } from 'node:fs';
import { playtest, assess, createBot, type Metrics } from './index.js';
import { Engine, validateSpec } from '../../engine/src/index.js';
const examples=()=>readdirSync('factory/template/examples').map(f=>JSON.parse(readFileSync('factory/template/examples/'+f,'utf8')));
const metric:Metrics={seeds:40,idle:{wins:0,runs:40,rate:0},random:{wins:10,runs:40,rate:.25},humanish:{wins:24,runs:40,rate:.6},neverEnds:0,firstHazardFrame:null,peakEntities:10,maxFrames:300};
test('all good examples satisfy actual 40 seed runs',()=>{
 for(const spec of examples()){
  const report=playtest(spec);expect(report,spec.title).toMatchObject({pass:true});
  expect(report.metrics?.seeds).toBe(40);
  for(const name of ['idle','random','humanish'] as const)expect(report.metrics?.[name].runs).toBe(40);
 }
});
test('reports repeat exactly',()=>expect(playtest(examples()[0])).toEqual(playtest(examples()[0])));
test('invalid schema and verb do not simulate',()=>{
 expect(playtest({}).issues[0]?.code).toBe('SCHEMA_ERROR');
 expect(playtest({...examples()[0],verb:'MASH'}).issues[0]?.code).toBe('VERB_MISMATCH');
});
test.each([
 ['TOO_EASY',{humanish:{wins:35,runs:40,rate:.875}}],
 ['TOO_HARD',{humanish:{wins:13,runs:40,rate:.325}}],
 ['TOO_HARD',{random:{wins:27,runs:40,rate:.675}}],
 ['IDLE_WINS',{idle:{wins:25,runs:40,rate:.625}}],
 ['NEVER_ENDS',{neverEnds:1}],
 ['SPAWN_KILL',{firstHazardFrame:29}],
 ['OVERCROWDED',{peakEntities:61}]
] as const)('assessment emits %s with a hint',(code,patch)=>{
 expect(assess({...metric,...patch},'survive')).toEqual(expect.arrayContaining([expect.objectContaining({code,hint:expect.any(String)})]));
});
test('exact boundary rates and entity limits pass',()=>{
 expect(assess({...metric,humanish:{wins:14,runs:40,rate:.35},random:{wins:16,runs:40,rate:.4},idle:{wins:24,runs:40,rate:.6},firstHazardFrame:30,peakEntities:60},'survive')).toEqual([]);
 expect(assess({...metric,humanish:{wins:34,runs:40,rate:.85},idle:{wins:2,runs:40,rate:.05}},'collect')).toEqual([]);
 expect(assess({...metric,idle:{wins:3,runs:40,rate:.075}},'collect').some(x=>x.code==='IDLE_WINS')).toBe(true);
});
test('humanish has nine frames of reaction delay',()=>{
 const r=validateSpec(examples().find(s=>s.win.type==='mash'));if(!r.ok)throw Error('fixture');
 const e=new Engine(r.spec,1), bot=createBot('humanish',1,r.spec);
 for(let i=0;i<9;i++){const input=bot(e.snapshot());expect(input).toEqual({});e.step(input);}
 expect(bot(e.snapshot()).mash).toBe(true);
});
test('humanish never exceeds eight mash presses in a sliding second',()=>{
 const r=validateSpec(examples().find(s=>s.win.type==='mash'));if(!r.ok)throw Error('fixture');
 const e=new Engine(r.spec,1),bot=createBot('humanish',5,r.spec);
 const presses=Array.from({length:480},(_,frame)=>Number(!!bot({...e.snapshot(),frame}).mash));
 for(let i=0;i<=420;i++)expect(presses.slice(i,i+60).reduce((a,b)=>a+b,0)).toBeLessThanOrEqual(8);
});
test('seven broken fixture files fail with expected codes',()=>{
 const files=readdirSync('packages/harness/fixtures');
 expect(files).toHaveLength(7);
 for(const file of files){
  const spec=JSON.parse(readFileSync('packages/harness/fixtures/'+file,'utf8'));
  const expected=file.replace('.json','').replaceAll('-','_').toUpperCase();
  expect(playtest(spec).issues.map(x=>x.code),file).toContain(expected);
 }
});
