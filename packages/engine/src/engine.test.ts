import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { Engine, mulberry32, validateSpec, type GameSpec, type Input } from './index.js';
const source = JSON.parse(readFileSync('factory/template/examples/01-taco-rain.json','utf8'));
function spec(patch: Partial<GameSpec> = {}):GameSpec { return {...structuredClone(source),...patch}; }
function run(s:GameSpec,seed=1,inputs:Input[]=[]):Engine {
 const e=new Engine(s,seed);
 for(let i=0;i<600 && e.outcome==='playing';i++) e.step(inputs[i]??{});
 return e;
}
const goal = {...source.spawners[0],role:'goal',from:'center',motion:'still',every:'once',speed:1};
describe('deterministic simulation', () => {
 test('mulberry32 golden sequence',()=> {
  const r=mulberry32(1);
  expect([r(),r(),r()]).toEqual([0.6270739405881613,0.002735721180215478,0.5274470399599522]);
 });
 test('same seed and frame stream give identical snapshots',()=> {
  const inputs=Array.from({length:480},(_,i)=>({x:Math.sin(i),y:Math.cos(i)}));
  expect(run(spec(),77,inputs).snapshot()).toEqual(run(spec(),77,inputs).snapshot());
  expect(run(spec(),78,inputs).snapshot()).not.toEqual(run(spec(),77,inputs).snapshot());
 });
 test('fixed timeout and frozen terminal state',()=>{
  const e=run(spec({spawners:[],lose:{type:'timeout'}}));
  expect([e.frame,e.outcome]).toEqual([300,'win']);
  const before=e.snapshot();e.step({x:1});expect(e.snapshot()).toEqual(before);
 });
 test('seed and spec cannot be changed through snapshots or caller mutation',()=>{
  const s=spec();const e=new Engine(s,1);s.player.speed=10;
  const snapshot=e.snapshot();snapshot.player.x=0;e.step({x:1});
  expect(e.player.x).toBe(486);
 });
 test.each(['collect','reach'] as const)('%s completes through contact', type=>{
  const win=type==='reach'?{type}:{type,n:1};
  const e=run(spec({verb:type==='reach'?'REACH':'COLLECT',player:{...source.player,control:'move_4'},spawners:[goal],win,lose:{type:'timeout'},mods:[]}));
  expect(e.outcome).toBe('win');expect(e.frame).toBe(1);
 });
 test('click needs target aim and rising edges',()=>{
  const e=new Engine(spec({verb:'CLICK',player:{...source.player,control:'click'},spawners:[{...goal,role:'target',every:.15}],win:{type:'hit',n:2},lose:{type:'timeout'},mods:[]}),1);
  e.step({click:true,pointer:{x:0,y:0}}); expect(e.score).toBe(0);
  e.step({click:false});e.step({click:true,pointer:{x:480,y:270}});expect(e.score).toBe(1);
  for(let i=0;i<12;i++)e.step({click:true,pointer:{x:480,y:270}});
  expect(e.score).toBe(1);e.step({click:false});e.step({click:true,pointer:{x:480,y:270}});expect(e.outcome).toBe('win');
 });
 test('mash counts presses rather than held frames',()=>{
  const e=new Engine(spec({verb:'MASH',player:{...source.player,control:'mash'},spawners:[],win:{type:'mash',n:2},lose:{type:'timeout'},mods:[]}),1);
  e.step({mash:true});e.step({mash:true});expect(e.score).toBe(1);
  e.step({});e.step({mash:true});expect(e.outcome).toBe('win');
 });
 test('hazard collision takes priority over objective completion',()=>{
  const e=run(spec({verb:'REACH',player:{...source.player,control:'move_4'},spawners:[goal,{...goal,role:'hazard'}],win:{type:'reach'},lose:{type:'timeout'},mods:[]}));
  expect(e.outcome).toBe('lose');expect(e.metrics.firstHazardFrame).toBe(0);
 });
 test('input is bounded and finite and move_lr ignores y',()=>{
  const e=new Engine(spec({spawners:[],mods:[]}),1);
  e.step({x:Infinity,y:100});expect(e.player).toMatchObject({x:480,y:460});
  e.step({x:100,y:1});expect(e.player.x).toBe(486);
 });
 test('once and max are live entity caps',()=>{
  const e=new Engine(spec({spawners:[{...goal,role:'decor'},{...goal,role:'decor',every:.15,max:2}],mods:[]}),1);
  for(let i=0;i<60;i++)e.step({});
  expect(e.entities).toHaveLength(3);
 });
 test.each(['fall','rise','sweep','bounce','chase','flee','still','popup'] as const)('motion %s behaves headlessly',motion=>{
  const e=new Engine(spec({spawners:[{...goal,role:'decor',motion}],mods:[]}),17);
  e.step({x:1});const initial=e.snapshot().entities[0]!;
  for(let i=0;i<50;i++)e.step({x:1});
  if(motion==='popup')expect(e.entities).toHaveLength(0);
  else if(motion==='still')expect(e.entities[0]).toMatchObject({x:initial.x,y:initial.y});
  else expect([e.entities[0]!.x,e.entities[0]!.y]).not.toEqual([initial.x,initial.y]);
 });
 test('mirror, wind, speedup and spotlight have defined effects',()=>{
  const make=(mods:GameSpec['mods'])=>new Engine(spec({spawners:[],mods}),1);
  const a=make([]), b=make(['mirror']),c=make(['wind_right']),d=make(['spotlight']),f=make(['speedup']);
  for(let i=0;i<30;i++)for(const e of [a,b,c,d,f])e.step({x:1});
  expect(b.player.x).toBeLessThan(480);expect(c.player.x).toBeGreaterThan(a.player.x);
  expect(d.player).toEqual(a.player);expect(f.player.x).toBeGreaterThan(a.player.x);
 });
 test('floor lava causes loss near the bottom',()=>{
  const e=run(spec({spawners:[],player:{...source.player,control:'move_4'},mods:['floor_lava']}),1,Array(300).fill({y:1}));
  expect(e.outcome).toBe('lose');expect(e.frame).toBeLessThan(300);
 });
 test('objective timeout loses',()=>{
  expect(run(spec({verb:'REACH',win:{type:'reach'},lose:{type:'timeout'},spawners:[{...goal,from:'top'}],mods:[]})).outcome).toBe('lose');
 });
 test('all examples terminate at or before their deadline',()=>{
  for(const f of readdirSync('factory/template/examples')){
   const r=validateSpec(JSON.parse(readFileSync('factory/template/examples/'+f,'utf8')));
   expect(r.ok).toBe(true);if(!r.ok)continue;
   const e=run(r.spec);expect(e.outcome).not.toBe('playing');expect(e.frame).toBeLessThanOrEqual(r.spec.seconds*60);
  }
 });
});

test('versioned engine golden replay',()=>{
 const e=run(spec(),123,Array.from({length:300},(_,i)=>({x:i%80<40?-1:1})));
 expect({frame:e.frame,outcome:e.outcome,score:e.score,player:e.player,metrics:e.metrics,entities:e.entities.map(({id,x,y})=>({id,x,y}))}).toMatchInlineSnapshot(`
   {
     "entities": [
       {
         "id": 3,
         "x": 814.5861082617193,
         "y": 530,
       },
       {
         "id": 4,
         "x": 396.3659093622118,
         "y": 425,
       },
       {
         "id": 5,
         "x": 193.36111498996615,
         "y": 320,
       },
       {
         "id": 6,
         "x": 346.99116746895015,
         "y": 215,
       },
       {
         "id": 7,
         "x": 213.89241073280573,
         "y": 110,
       },
     ],
     "frame": 144,
     "metrics": {
       "firstHazardFrame": 143,
       "peakEntities": 7,
     },
     "outcome": "lose",
     "player": {
       "radius": 20,
       "x": 384,
       "y": 460,
     },
     "score": 0,
   }
 `);
});
test('all origins stay in the logical arena at birth',()=>{
 for(const from of ['top','bottom','left','right','edges','random','center'] as const){
  const e=new Engine(spec({spawners:[{...goal,from,role:'decor'}],mods:[]}),9);e.step({});
  const entity=e.entities[0]!;
  expect(entity.x).toBeGreaterThanOrEqual(entity.radius);expect(entity.x).toBeLessThanOrEqual(960-entity.radius);
  expect(entity.y).toBeGreaterThanOrEqual(entity.radius);expect(entity.y).toBeLessThanOrEqual(540-entity.radius);
 }
});
