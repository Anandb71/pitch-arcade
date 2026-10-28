import {expect,test,vi} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {Engine} from '../../engine/src/index.js';
import {ArcadeRenderer,InputState,logicalPointer,palettes,patterns,VisualEffects,skipGesture} from './index.js';
const spec=JSON.parse(readFileSync('library/01-taco-rain.json','utf8'));
test('palette and pattern sets match the format',()=>{
 expect(Object.keys(palettes)).toHaveLength(8);expect(patterns).toEqual(['none','dots','stripes','grid','stars']);
});
test('pointer coordinates scale to logical Canvas bounds',()=>{
 expect(logicalPointer(740,470,{left:100,top:110,width:1280,height:720})).toEqual({x:480,y:270});
 expect(logicalPointer(-50,9999,{left:0,top:0,width:960,height:540})).toEqual({x:0,y:540});
});
test('keyboard and pointer input preserve held state for engine edge detection',()=>{
 const state=new InputState();
 state.key('ArrowLeft',true);state.key('KeyW',true);state.key('Space',true);
 expect(state.read()).toMatchObject({x:-1,y:-1,mash:true});
 state.pointer({x:20,y:30},true);expect(state.read()).toMatchObject({click:true,pointer:{x:20,y:30}});
 state.clear();expect(state.read()).toMatchObject({x:0,y:0,mash:false,click:false});
});
test('S remains a down key while a double tap or Shift + S skips',()=>{
 const state=new InputState();state.key('KeyS',true);expect(state.read().y).toBe(1);
 expect(skipGesture(100,250,false)).toBe(true);expect(skipGesture(100,700,false)).toBe(false);expect(skipGesture(-Infinity,700,true)).toBe(true);
});
test('effects stay bounded and do not mutate simulation snapshots',()=>{
 const fx=new VisualEffects();for(let i=0;i<100;i++)fx.burst(480,270,i);
 fx.impact(999);expect(fx.particles.length).toBeLessThanOrEqual(96);
 for(let i=0;i<60;i++){const offset=fx.update(1/60);expect(Math.abs(offset.x)).toBeLessThanOrEqual(6);expect(Math.abs(offset.y)).toBeLessThanOrEqual(6);}
 expect(fx.particles).toHaveLength(0);
});
test('renderer draws the exact engine entity and player coordinates without modifying state',()=>{
 const calls:{name:string;args:unknown[]}[]=[];
 const gradient={addColorStop:vi.fn()};
 const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:10})},{
  get(target,name){if(name in target)return target[name as keyof typeof target];return (...args:unknown[])=>calls.push({name:String(name),args});},
  set(){return true;}
 }) as unknown as CanvasRenderingContext2D;
 const canvas={width:960,height:540,getContext:()=>context} as unknown as HTMLCanvasElement;
 const engine=new Engine(spec,1);engine.step({});const snapshot=engine.snapshot(),before=structuredClone(snapshot);
 new ArcadeRenderer(canvas,spec).draw(snapshot,1/60);
 expect(snapshot).toEqual(before);
 for(const entity of snapshot.entities)expect(calls).toContainEqual({name:'fillText',args:[entity.emoji,entity.x,entity.y]});
 expect(calls).toContainEqual({name:'fillText',args:[spec.player.emoji,snapshot.player.x,snapshot.player.y]});
});
test('engine source remains independent of browser APIs and wall clock randomness',()=>{
 for(const file of readdirSync('packages/engine/src').filter(f=>f.endsWith('.ts')&&!f.endsWith('.test.ts'))){
  const source=readFileSync('packages/engine/src/'+file,'utf8');
  expect(source).not.toMatch(/\b(?:document|window|Date\.now|Math\.random)\b/);
 }
});
