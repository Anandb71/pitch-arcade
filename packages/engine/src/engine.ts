import type { Entity, GameSpec, Input, Outcome, Spawner } from './types.js';
import { mulberry32 } from './random.js';

export const WIDTH=960, HEIGHT=540, HZ=60;
export const RADII={s:12,m:20,l:30} as const;
const finite=(n:number|undefined)=>Number.isFinite(n)?n!:0;
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export interface Metrics {peakEntities:number;firstHazardFrame:number|null}
export interface Snapshot {
 frame:number; outcome:Outcome;score:number;player:{x:number;y:number;radius:number};
 entities:Entity[];metrics:Metrics;
}
/** Pass validated specs. Each call consumes one input frame, including empty frames. */
export class Engine {
 readonly spec:GameSpec;
 frame=0;
 outcome:Outcome='playing';
 score=0;
 readonly player:{x:number;y:number;radius:number};
 entities:Entity[]=[];
 readonly metrics:Metrics={peakEntities:1,firstHazardFrame:null};
 private readonly rng:()=>number;
 private nextId=1;
 private clickHeld=false;
 private mashHeld=false;
 constructor(spec:GameSpec,seed:number) {
  this.spec=structuredClone(spec);
  this.rng=mulberry32(seed);
  this.player={x:480,y:spec.player.control==='move_lr'?460:270,radius:RADII[spec.player.size]};
 }
 snapshot():Snapshot {
  return {frame:this.frame,outcome:this.outcome,score:this.score,player:{...this.player},entities:this.entities.map(e=>({...e})),metrics:{...this.metrics}};
 }
 private spawn(s:Spawner,index:number):void {
  const radius=RADII[s.size];
  let from=s.from;
  if(from==='edges')from=(['top','bottom','left','right'] as const)[Math.floor(this.rng()*4)]!;
  let x=radius+this.rng()*(WIDTH-2*radius),y=radius+this.rng()*(HEIGHT-2*radius);
  if(from==='top')y=radius;
  if(from==='bottom')y=HEIGHT-radius;
  if(from==='left')x=radius;
  if(from==='right')x=WIDTH-radius;
  if(from==='center'){x=WIDTH/2;y=HEIGHT/2;}
  const angle=this.rng()*Math.PI*2;
  let vx=Math.cos(angle),vy=Math.sin(angle);
  if(s.motion==='fall'){vx=0;vy=1;}
  if(s.motion==='rise'){vx=0;vy=-1;}
  if(s.motion==='sweep'){vx=from==='right'?-1:1;vy=0;}
  if(s.motion==='still'||s.motion==='popup'){vx=0;vy=0;}
  this.entities.push({id:this.nextId++,emoji:s.emoji,role:s.role,x,y,vx,vy,radius,motion:s.motion,speed:s.speed,born:this.frame,spawner:index});
 }
 step(input:Input):void {
  if(this.outcome!=='playing')return;
  const s=this.spec,p=this.player;
  const multiplier=s.mods.includes('speedup')?1+0.5*this.frame/(s.seconds*HZ):1;
  const mirror=s.mods.includes('mirror')?-1:1;
  let x=clamp(finite(input.x),-1,1)*mirror,y=clamp(finite(input.y),-1,1)*mirror;
  if(s.player.control==='move_lr')y=0;
  const length=Math.hypot(x,y);
  if(length>1){x/=length;y/=length;}
  if(s.player.control==='move_lr'||s.player.control==='move_4'){
   const wind=(s.mods.includes('wind_right')?70:0)-(s.mods.includes('wind_left')?70:0);
   p.x=clamp(p.x+(x*s.player.speed*60*multiplier+wind)/HZ,p.radius,WIDTH-p.radius);
   p.y=clamp(p.y+y*s.player.speed*60*multiplier/HZ,p.radius,HEIGHT-p.radius);
  }
  s.spawners.forEach((sp,index)=>{
   const due=sp.every==='once'?this.frame===0:this.frame%Math.ceil(sp.every*HZ)===0;
   if(due && this.entities.filter(e=>e.spawner===index).length<sp.max)this.spawn(sp,index);
  });
  this.metrics.peakEntities=Math.max(this.metrics.peakEntities,this.entities.length+1);
  for(const e of this.entities){
   if(e.motion==='chase'||e.motion==='flee'){
    const dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy);
    const direction=e.motion==='flee'?-1:1;
    if(len>0){e.vx=dx/len*direction;e.vy=dy/len*direction;}
   }
   e.x+=e.vx*e.speed*60*multiplier/HZ;e.y+=e.vy*e.speed*60*multiplier/HZ;
   if(e.motion==='bounce'||e.motion==='flee'){
    if(e.x<e.radius||e.x>WIDTH-e.radius){e.vx*=-1;e.x=clamp(e.x,e.radius,WIDTH-e.radius);}
    if(e.y<e.radius||e.y>HEIGHT-e.radius){e.vy*=-1;e.y=clamp(e.y,e.radius,HEIGHT-e.radius);}
   }
  }
  this.entities=this.entities.filter(e=>e.x>=-e.radius&&e.x<=WIDTH+e.radius&&e.y>=-e.radius&&e.y<=HEIGHT+e.radius&&!(e.motion==='popup'&&this.frame-e.born>=45));
  const contacts=this.entities.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<=e.radius+p.radius);
  if(contacts.some(e=>e.role==='hazard')){
   this.metrics.firstHazardFrame??=this.frame;this.outcome='lose';
  }
  if(s.lose.type==='touch'){
   const role=s.lose.role;
   if(contacts.some(e=>e.role===role))this.outcome='lose';
  }
  if(s.mods.includes('floor_lava')&&p.y+p.radius>=HEIGHT-32)this.outcome='lose';
  const removed=new Set<number>();
  for(const e of contacts){
   if(e.role==='goal'&&(s.win.type==='collect'||s.win.type==='reach')){
    this.score++;removed.add(e.id);
   }
  }
  if(s.player.control==='click'&&input.click&&!this.clickHeld&&input.pointer){
   const px=mirror<0?WIDTH-finite(input.pointer.x):finite(input.pointer.x),py=finite(input.pointer.y);
   const target=this.entities.find(e=>e.role==='target'&&Math.hypot(e.x-px,e.y-py)<=e.radius);
   if(target){this.score++;removed.add(target.id);}
  }
  if(s.player.control==='mash'&&input.mash&&!this.mashHeld)this.score++;
  this.clickHeld=!!input.click;this.mashHeld=!!input.mash;
  this.entities=this.entities.filter(e=>!removed.has(e.id));
  this.frame++;
  if(this.outcome==='lose')return;
  if((s.win.type==='reach'&&this.score>0)||('n' in s.win&&this.score>=s.win.n))this.outcome='win';
  if(this.frame>=Math.ceil(s.seconds*HZ)&&this.outcome==='playing')this.outcome=s.win.type==='survive'?'win':'lose';
 }
}
