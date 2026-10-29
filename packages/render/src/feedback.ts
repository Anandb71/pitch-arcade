import {feedbackPoints} from '../../shared/src/presentation.js';
export class HitFeedback {
 hold=0;flash=0;pop=0;combo=0;multiplier=1;points=0;private lastHit=-Infinity;
 constructor(readonly reduced=false){}
 hit(hits:number,time:number):void{const next=feedbackPoints(hits,this.combo,this.lastHit,time);this.combo=next.combo;this.multiplier=next.multiplier;this.points=next.points;this.lastHit=time;this.pop=.65;if(!this.reduced){this.hold=.035;this.flash=.12;}}
 update(dt:number):void{dt=Math.max(0,Math.min(.05,dt));this.hold=Math.max(0,this.hold-dt);this.flash=Math.max(0,this.flash-dt);this.pop=Math.max(0,this.pop-dt);}
}
