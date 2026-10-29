import {expect,test} from 'vitest';
import {VideoSchedule} from './video-demo.js';
test('video schedule is ordered, deterministic and exactly 110 seconds',()=>{
 const a=new VideoSchedule(8),b=new VideoSchedule(8);
 expect(a.events).toEqual(b.events);expect(a.durationMs).toBe(110000);
 expect(a.due(0).map(e=>e.kind)).toEqual(['intro']);
 expect(a.due(50000).filter(e=>e.kind==='pitch')).toHaveLength(8);
 expect(a.due(50000)).toEqual([]);expect(a.due(110000).at(-1)?.kind).toBe('end');
});
test('late scheduler ticks never repeat or reorder actions and reject invalid seeds',()=>{
 const s=new VideoSchedule(123);const all=s.due(200000);
 expect(all.filter(e=>e.kind==='approve')).toHaveLength(1);
 expect(all.filter(e=>e.kind==='start')).toHaveLength(1);
 expect(s.due(0)).toEqual([]);expect(()=>new VideoSchedule(NaN)).toThrow();
});

test('full video cycles rebuild safely and reach mixed results with final hold',async()=>{
 const {checkVideo}=await import('./video-check.js');await checkVideo();
},30000);
