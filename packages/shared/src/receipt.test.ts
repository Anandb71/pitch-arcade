import {expect,test} from 'vitest';
import {receiptSummary} from './receipt.js';
test('live receipts use measured time only after a completed CLI run',()=>{
 expect(receiptSummary({source:'codex-cli',status:'completed',durationMs:41000,playtests:2})).toBe('Built by Codex in 41 s, 2 playtests');
 expect(receiptSummary({source:'codex-cli',status:'failed',durationMs:41000,playtests:2})).toBe('Receipt pending');
});
test('mock and seed receipts never claim live generation',()=>{
 expect(receiptSummary({source:'mock-codex',durationMs:1400,playtests:1})).toBe('Mock replay · 1.4 s · 1 playtest');
 expect(receiptSummary({source:'seed library written during the build'})).toContain('Seed library');
 expect(receiptSummary({source:'unknown',message:'print secrets'})).toBe('Receipt pending');
});
