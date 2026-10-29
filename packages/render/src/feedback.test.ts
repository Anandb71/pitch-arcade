import {test,expect} from 'vitest';
import {HitFeedback} from './feedback.js';
import {SynthSfx,soundNotes} from './audio.js';
test('render hit stop is short and reduced motion disables spatial feedback',()=>{const f=new HitFeedback();f.hit(1,0);expect(f.hold).toBeLessThanOrEqual(.04);expect(f.combo).toBe(1);f.update(.05);expect(f.hold).toBe(0);const reduced=new HitFeedback(true);reduced.hit(5,0);expect(reduced.hold).toBe(0);expect(reduced.flash).toBe(0);});
test('synth recipes include each cue and volume is bounded',()=>{for(const kind of ['hit','tick','countdown','win','lose','pitch'] as const)expect(soundNotes[kind].every(n=>n>=45&&n<=1600)).toBe(true);const audio=new SynthSfx();audio.setVolume(12);expect(audio.volume).toBe(1);audio.setVolume(-1);expect(audio.volume).toBe(0);});
test('mute and volume control the master gain immediately, including active notes',async()=>{
 const {vi}=await import('vitest');const target=vi.fn(),master={gain:{setTargetAtTime:target},connect:vi.fn(),disconnect:vi.fn()};vi.stubGlobal('AudioContext',class{currentTime=0;state='running';destination={};createGain(){return master;}async resume(){}async close(){}});
 try{const audio=new SynthSfx();await audio.enable();audio.setVolume(.2);expect(target).toHaveBeenLastCalledWith(.2,0,.01);audio.enabled=false;expect(target).toHaveBeenLastCalledWith(0,0,.01);await audio.dispose();}finally{vi.unstubAllGlobals();}
});
