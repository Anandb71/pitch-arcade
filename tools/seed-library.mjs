import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {validateGame} from '../dist/validator.mjs';
const id=(process.env.CODEX_BUILD_THREAD_ID||readFileSync(new URL('../../SESSION_ID.txt',import.meta.url),'utf8')).trim();
if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Provide the verified main build thread ID.');
mkdirSync('library',{recursive:true});
let count=0;
for(const file of readdirSync('packages/engine/examples').sort().slice(0,20)){
 const raw=JSON.parse(readFileSync('packages/engine/examples/'+file,'utf8'));
 const result=validateGame(raw);if(!result.ok)throw Error(file+' failed validation.');
 writeFileSync('library/'+file,JSON.stringify(result.spec,null,2)+'\n');
 writeFileSync('library/'+file.replace('.json','.receipt.json'),JSON.stringify({
  source:'seed library written during the build in Codex thread '+id,
  buildThreadId:id,threadId:null,model:null,durationMs:null,playtests:null,tokensIn:null,tokensOut:null,
  validation:{seedsPerBot:40,report:result.report,difficulty:result.difficulty}
 },null,2)+'\n');
 count++;
}
console.log('Validated '+count+' seed games. Receipts identify the build thread and do not claim runtime generation.');
