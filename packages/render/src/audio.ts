export class SynthSfx {
 private context:AudioContext|undefined;enabled=false;
 async enable():Promise<void>{this.context??=new AudioContext();await this.context.resume();this.enabled=true;}
 play(kind:'pop'|'boom'|'ding'|'none'):void{
  if(!this.enabled||!this.context||kind==='none')return;
  const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),time=ctx.currentTime;
  osc.type=kind==='boom'?'triangle':'sine';
  osc.frequency.setValueAtTime(kind==='ding'?880:kind==='pop'?550:110,time);
  osc.frequency.exponentialRampToValueAtTime(kind==='ding'?1320:60,time+.12);
  gain.gain.setValueAtTime(.07,time);gain.gain.exponentialRampToValueAtTime(.001,time+.16);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(time);osc.stop(time+.18);
 }
 async dispose():Promise<void>{await this.context?.close();this.context=undefined;this.enabled=false;}
}
