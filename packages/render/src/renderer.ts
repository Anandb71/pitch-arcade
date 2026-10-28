import type {GameSpec} from '../../engine/src/types.js';
import type {Snapshot} from '../../engine/src/engine.js';
import {VisualEffects} from './effects.js';
export const EMOJI_FONT='"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
export const palettes={
 sunset:{background:'#fff1d9',ink:'#25303c',accent:'#f17745',secondary:'#f9c56a'},
 ocean:{background:'#dcf3f0',ink:'#173c4c',accent:'#168e9b',secondary:'#72cbb7'},
 candy:{background:'#f7e3ee',ink:'#562e5d',accent:'#cb5e96',secondary:'#e9acda'},
 forest:{background:'#e4ecd5',ink:'#294734',accent:'#6e9d55',secondary:'#b5c981'},
 midnight:{background:'#252b49',ink:'#e8eafb',accent:'#b1a1ff',secondary:'#6374ab'},
 citrus:{background:'#f5f2cb',ink:'#41452b',accent:'#de9e2d',secondary:'#d9dd76'},
 ice:{background:'#e1edfa',ink:'#2f4563',accent:'#7b9ee2',secondary:'#a4d7e8'},
 mono:{background:'#eeece4',ink:'#30322f',accent:'#838a78',secondary:'#c2c5b9'}
} as const;
export const patterns=['none','dots','stripes','grid','stars'] as const;
export class ArcadeRenderer {
 readonly effects=new VisualEffects();
 private ctx:CanvasRenderingContext2D;private previousScore=0;private previousOutcome='playing';
 constructor(private canvas:HTMLCanvasElement,readonly spec:GameSpec,private onSfx:(sfx:GameSpec['sfx'])=>void=()=>{}){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas 2D is unavailable.');
  this.ctx=ctx;canvas.width=960;canvas.height=540;
 }
 draw(snapshot:Snapshot,dt=1/60,pointer?:{x:number;y:number}):void{
  const ctx=this.ctx,palette=palettes[this.spec.palette as keyof typeof palettes]??palettes.sunset;
  if(snapshot.score>this.previousScore){this.effects.burst(snapshot.player.x,snapshot.player.y,snapshot.frame);this.onSfx(this.spec.sfx);}
  if(snapshot.outcome==='lose'&&this.previousOutcome!=='lose'){this.effects.impact(4);this.onSfx('boom');}
  this.previousScore=snapshot.score;this.previousOutcome=snapshot.outcome;
  const shake=this.effects.update(dt);
  ctx.save();ctx.clearRect(0,0,960,540);ctx.fillStyle=palette.background;ctx.fillRect(0,0,960,540);
  ctx.translate(shake.x,shake.y);
  ctx.strokeStyle=palette.ink;ctx.fillStyle=palette.ink;ctx.globalAlpha=.055;
  if(this.spec.pattern==='dots'||this.spec.pattern==='stars'){
   for(let x=24;x<960;x+=48)for(let y=24;y<540;y+=48){
    ctx.beginPath();
    if(this.spec.pattern==='stars'){ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();}
    else{ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
   }
  }else if(this.spec.pattern==='grid'||this.spec.pattern==='stripes'){
   ctx.beginPath();
   for(let x=0;x<1500;x+=48){ctx.moveTo(x,0);ctx.lineTo(this.spec.pattern==='stripes'?x-540:x,540);}
   if(this.spec.pattern==='grid')for(let y=0;y<540;y+=48){ctx.moveTo(0,y);ctx.lineTo(960,y);}
   ctx.stroke();
  }
  ctx.globalAlpha=1;
  if(this.spec.mods.includes('floor_lava')){
   ctx.fillStyle=palette.accent;ctx.fillRect(0,508,960,32);
   ctx.fillStyle=palette.ink;ctx.globalAlpha=.12;
   for(let x=0;x<960;x+=28){ctx.beginPath();ctx.moveTo(x,540);ctx.lineTo(x+18,516);ctx.lineTo(x+28,540);ctx.fill();}
   ctx.globalAlpha=1;
  }
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const entity of snapshot.entities){
   ctx.fillStyle=entity.role==='hazard'?palette.accent:palette.secondary;
   ctx.globalAlpha=.15;ctx.beginPath();ctx.arc(entity.x,entity.y,entity.radius+5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
   ctx.font=entity.radius*2+'px '+EMOJI_FONT;ctx.fillText(entity.emoji,entity.x,entity.y);
  }
  const p=snapshot.player;
  ctx.fillStyle=palette.ink;ctx.globalAlpha=.12;ctx.beginPath();ctx.ellipse(p.x,p.y+p.radius*.8,p.radius*.85,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.radius+7,0,Math.PI*2);ctx.stroke();
  ctx.font=p.radius*2+'px '+EMOJI_FONT;ctx.fillText(this.spec.player.emoji,p.x,p.y);
  for(const particle of this.effects.particles){ctx.globalAlpha=particle.life/particle.max;ctx.fillStyle=palette.accent;ctx.fillRect(particle.x,particle.y,5,5);}ctx.globalAlpha=1;
  const aim=pointer?{x:this.spec.mods.includes('mirror')?960-pointer.x:pointer.x,y:pointer.y}:p;
  if(this.spec.mods.includes('spotlight')){
   const gradient=ctx.createRadialGradient(aim.x,aim.y,40,aim.x,aim.y,400);
   gradient.addColorStop(0,'rgba(10,12,24,0)');gradient.addColorStop(1,'rgba(10,12,24,.34)');
   ctx.fillStyle=gradient;ctx.fillRect(0,0,960,540);
  }
  ctx.restore();
 }
}
