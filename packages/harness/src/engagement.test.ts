import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {playtest} from './runner.js';
test('reports deterministic paired input outcomes and relevant events without counting decor',()=>{const spec=JSON.parse(readFileSync('library/03-berry-basket.json','utf8'));const a=playtest(spec),b=playtest(spec);expect(a).toEqual(b);expect(a.metrics!.engagement!.pairedOutcomeChanges).toBeGreaterThan(0);expect(a.metrics!.engagement!.meanEvents).toBeGreaterThan(3);expect(a.metrics!.engagement!.scoreVariance).toBeGreaterThan(0);});
test('idle only scenery cannot masquerade as meaningful events',()=>{const spec=JSON.parse(readFileSync('library/05-rocket-charge.json','utf8'));spec.win.n=100;const report=playtest(spec);expect(report.metrics!.engagement!.pairedOutcomeChanges).toBe(0);expect(report.metrics!.engagement!.meanEvents).toBeLessThan(40);});
