import {expect,test} from 'vitest';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync,chmodSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {compact,playtest} from '../packages/harness/src/index.js';
test('factory CLI is self contained and works with read only tools',()=>{
 mkdirSync('factory/jobs',{recursive:true});
 const dir=mkdtempSync(resolve('factory/jobs/cli-'));
 try {
  cpSync('factory/template',dir,{recursive:true});
  chmodSync(dir+'/tools/playtest.mjs',0o444);
  const file='examples/01-taco-rain.json';
  const spec=JSON.parse(readFileSync(dir+'/'+file,'utf8'));
  expect(execFileSync(process.execPath,['tools/playtest.mjs',file],{cwd:dir,encoding:'utf8'}).trim()).toBe(compact(playtest(spec)));
  writeFileSync(dir+'/bad.json','{"v":');
  for(const args of [[],['bad.json'],['missing.json']]){
   const result=spawnSync(process.execPath,['tools/playtest.mjs',...args],{cwd:dir,encoding:'utf8'});
   expect(result.status).toBe(1);expect(result.stdout).toContain('SCHEMA_ERROR');expect(result.stderr).toBe('');
  }
  const bad=JSON.parse(readFileSync('packages/harness/fixtures/too-hard.json','utf8'));
  writeFileSync(dir+'/bad.json',JSON.stringify(bad));
  const result=spawnSync(process.execPath,['tools/playtest.mjs','bad.json'],{cwd:dir,encoding:'utf8'});
  expect(result.status).toBe(1);expect(result.stdout).toContain('TOO_HARD');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
