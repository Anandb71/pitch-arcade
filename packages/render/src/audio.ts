export type Sound='pop'|'boom'|'ding'|'none'|'hit'|'tick'|'countdown'|'go'|'win'|'lose'|'pitch';
export const soundNotes:Record<Exclude<Sound,'none'>,number[]>={pop:[660,320],boom:[110,55],ding:[880,1320],hit:[520,180],tick:[960,1440],countdown:[440,440],go:[660,990,1320],win:[523,659,784,1047],lose:[220,165,110],pitch:[160,480,960]};
export class SynthSfx {
 private context:AudioContext|undefined;private master:GainNode|undefined;private active=false;volume=.35;
 get enabled():boolean{return this.active;}
 set enabled(value:boolean){this.active=value;this.master?.gain.setTargetAtTime(value?this.volume:0,this.context?.currentTime??0,.01);}
 async enable():Promise<void>{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}this.enabled=true;await this.context.resume();}
 setVolume(value:number):void{this.volume=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;this.enabled=this.active;}
 play(kind:Sound):void{
  if(!this.enabled||!this.context||this.context.state!=='running'||kind==='none')return;
  const ctx=this.context,notes=soundNotes[kind],time=ctx.currentTime,melodic=kind==='win'||kind==='go'||kind==='lose';
  for(const [i,note] of notes.entries()){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),at=time+(melodic?i*.085:0),duration=melodic?.16:.12;
   osc.type=kind==='lose'||kind==='boom'?'triangle':'sine';osc.frequency.setValueAtTime(note,at);osc.frequency.exponentialRampToValueAtTime(melodic?note:Math.max(45,note*.5),at+duration);
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.11/Math.sqrt(notes.length),at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   osc.connect(gain);gain.connect(this.master!);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
 }
 async dispose():Promise<void>{const context=this.context;this.context=undefined;this.enabled=false;this.master?.disconnect();this.master=undefined;if(context&&context.state!=='closed')await context.close();}
}
