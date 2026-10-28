import { mulberry32, WIDTH, type GameSpec, type Input, type Snapshot } from '../../engine/src/index.js';
export type BotName='idle'|'random'|'humanish';
export type Bot=(state:Snapshot)=>Input;
export const REACTION_FRAMES=9;
/** Bot randomness is independent of the simulation's PRNG. */
export function createBot(name:BotName,seed:number,spec:GameSpec):Bot {
 const rng=mulberry32(seed^0x51a7cafe);
 const pending:Input[]=Array.from({length:REACTION_FRAMES},()=>({}));
 let move:Input={};
 return state=>{
  if(name==='idle')return {};
  const control=spec.player.control;
  if(name==='random'){
   if(state.frame%12===0)move={x:rng()*2-1,y:rng()*2-1};
   return {...move,click:rng()<.12,pointer:{x:rng()*960,y:rng()*540},mash:rng()<.08};
  }
  const p=state.player;
  const distance=(e:{x:number;y:number})=>Math.hypot(e.x-p.x,e.y-p.y);
  const nearest=(role:string)=>state.entities.filter(e=>e.role===role).sort((a,b)=>distance(a)-distance(b))[0];
  let next:Input={};
  const mirror=spec.mods.includes('mirror')?-1:1;
  if(control==='mash'){
   // Eight frame spacing is 7.5 presses per second, below the eight press ceiling.
   next={mash:state.frame%8===0 && rng()>.08};
  } else if(control==='click'){
   const target=nearest('target');
   if(target&&state.frame%8===0)next={click:rng()>.06,pointer:{x:mirror<0?WIDTH-target.x+(rng()-.5)*36:target.x+(rng()-.5)*36,y:target.y+(rng()-.5)*36}};
  } else {
   const goal=nearest('goal'),hazard=nearest('hazard');
   let x=0,y=0;
   if(goal){x=goal.x-p.x;y=control==='move_lr'?0:goal.y-p.y;}
   if(hazard){
    const hx=hazard.x+hazard.vx*hazard.speed*18,hy=hazard.y+hazard.vy*hazard.speed*18;
    if(Math.hypot(hx-p.x,hy-p.y)<180){
     x=p.x-hx;y=control==='move_lr'?0:p.y-hy;
     if(Math.abs(x)<2)x=rng()<.5?-1:1;
    }
   }
   if(spec.mods.includes('floor_lava')&&p.y>450)y=-100;
   const length=Math.hypot(x,y);
   // Small dead zone prevents buzzing on stationary goals.
   if(length>8){x/=length;y/=length;}else{x=0;y=0;}
   next={x:(x+(rng()-.5)*.16)*mirror,y:(y+(rng()-.5)*.16)*mirror};
  }
  pending.push(next);
  return pending.shift()!;
 };
}
