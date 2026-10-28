import {Engine} from '../../engine/src/engine.js';
import type {GameSpec} from '../../engine/src/types.js';
import {ArcadeRenderer} from './renderer.js';
import {bindInput} from './input.js';
export function startPractice(canvas:HTMLCanvasElement,spec:GameSpec,onEnd:(outcome:string)=>void=()=>{},onSfx:(kind:GameSpec['sfx'])=>void=()=>{}):()=>void {
 const engine=new Engine(spec,12),renderer=new ArcadeRenderer(canvas,spec,onSfx),input=bindInput(canvas);
 let frame=0,last=performance.now(),accumulator=0,ended=false,disposed=false;
 const animate=(now:number)=>{
  if(disposed)return;accumulator+=Math.min(.1,(now-last)/1000);last=now;
  while(accumulator>=1/60){engine.step(input.state.read());accumulator-=1/60;}
  renderer.draw(engine.snapshot(),1/60,input.state.read().pointer);
  if(engine.outcome!=='playing'&&!ended){ended=true;onEnd(engine.outcome);}
  frame=requestAnimationFrame(animate);
 };
 frame=requestAnimationFrame(animate);
 return ()=>{disposed=true;cancelAnimationFrame(frame);input.dispose();};
}
