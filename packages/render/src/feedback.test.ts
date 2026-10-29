import {test,expect} from 'vitest';
import {HitFeedback} from './feedback.js';
import {SynthSfx,soundNotes} from './audio.js';
test('render hit stop is short and reduced motion disables spatial feedback',()=>{const f=new HitFeedback();f.hit(1,0);expect(f.hold).toBeLessThanOrEqual(.04);expect(f.combo).toBe(1);f.update(.05);expect(f.hold).toBe(0);const reduced=new HitFeedback(true);reduced.hit(5,0);expect(reduced.hold).toBe(0);expect(reduced.flash).toBe(0);});
test('synth recipes include each cue and volume is bounded',()=>{for(const kind of ['hit','tick','countdown','win','lose','pitch'] as const)expect(soundNotes[kind].every(n=>n>=45&&n<=1600)).toBe(true);const audio=new SynthSfx();audio.setVolume(12);expect(audio.volume).toBe(1);audio.setVolume(-1);expect(audio.volume).toBe(0);});
