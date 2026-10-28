import {performance} from 'node:perf_hooks';
/** Wall time selects tick count. Every simulation tick remains an exact 1/60 step. */
export function startClock(tick:()=>void):()=>void{
 let last=performance.now(),accumulator=0;
 const timer=setInterval(()=>{
  const now=performance.now();accumulator+=Math.min(100,now-last);last=now;
  let steps=0;while(accumulator>=1000/60&&steps++<6){tick();accumulator-=1000/60;}
 },4);
 return ()=>clearInterval(timer);
}
