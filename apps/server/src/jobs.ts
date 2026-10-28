import {cpSync,mkdirSync,mkdtempSync,writeFileSync,rmSync,chmodSync,readdirSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
export interface JobPitch {id:number;login:string;text:string}
export function prepareJob(pitch:JobPitch,jobsRoot=resolve('factory/jobs')):string {
 mkdirSync(jobsRoot,{recursive:true});
 const dir=mkdtempSync(join(jobsRoot,'job-'));
 try{
  cpSync(resolve('factory/template'),dir,{recursive:true});
  mkdirSync(join(dir,'inbox'));mkdirSync(join(dir,'out'));
  writeFileSync(join(dir,'inbox/pitch.json'),JSON.stringify({id:pitch.id,author:pitch.login,untrusted_text:pitch.text}));
  execFileSync('git',['-c','core.hooksPath=/dev/null','-c','init.defaultBranch=main','init','--quiet',dir],{stdio:'ignore'});
  const protect=(path:string):void=>{
   for(const file of readdirSync(path)){const name=join(path,file);const stat=lstatSync(name);if(stat.isSymbolicLink())throw Error('UNSAFE_TEMPLATE');if(stat.isDirectory())protect(name);else chmodSync(name,0o444);}
  };
  for(const sub of ['tools','spec','examples','inbox','.codex'])protect(join(dir,sub));
  chmodSync(join(dir,'AGENTS.md'),0o444);
  return dir;
 }catch(error){removeJob(dir);throw error;}
}
export function removeJob(dir:string):void{rmSync(dir,{recursive:true,force:true});}
