export interface Particle {x:number;y:number;vx:number;vy:number;life:number;max:number}
export class VisualEffects {
 particles:Particle[]=[];private shake=0;private age=0;
 burst(x:number,y:number,seed:number):void{
  for(let i=0;i<10;i++){
   const angle=(i*2.399963+seed)*1.3;
   this.particles.push({x,y,vx:Math.cos(angle)*(70+i*8),vy:Math.sin(angle)*(70+i*8),life:.55,max:.55});
  }
  this.particles=this.particles.slice(-96);
 }
 impact(amplitude=4):void{this.shake=Math.min(6,Math.max(0,amplitude));}
 update(dt:number):{x:number;y:number}{
  dt=Math.max(0,Math.min(.05,dt));this.age+=dt;
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;}
  this.particles=this.particles.filter(p=>p.life>0);
  this.shake=Math.max(0,this.shake-dt*24);
  return {x:Math.sin(this.age*90)*this.shake,y:Math.cos(this.age*71)*this.shake};
 }
}
