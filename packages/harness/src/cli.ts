import { readFileSync } from 'node:fs';
import { playtest } from './runner.js';
import { compact, type Report } from './report.js';
let report:Report;
try {
 const file=process.argv[2];
 if(!file)throw Error('Usage: node tools/playtest.mjs <file>');
 const raw=readFileSync(file,'utf8');
 if(Buffer.byteLength(raw)>65536)throw Error('Spec exceeds 64 KiB.');
 report=playtest(JSON.parse(raw));
} catch(error) {
 report={pass:false,issues:[{code:'SCHEMA_ERROR',hint:error instanceof Error?error.message:'Cannot read game JSON.'}]};
}
console.log(compact(report));
process.exitCode=report.pass?0:1;
