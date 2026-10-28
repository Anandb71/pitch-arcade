import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
function markdown(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?markdown(join(dir,entry.name)):entry.name.endsWith('.md')?[join(dir,entry.name)]:[]);}
const files=['README.md','SECURITY.md','DEVPOST.md',...markdown('docs')];let failures=0;
for(const file of files){let fence=false;for(const [index,line] of readFileSync(file,'utf8').split('\n').entries()){
 if(/[\u2013\u2014]/.test(line)){console.error(file+':'+(index+1)+': dash punctuation');failures++;}
 if(/^\s*```/.test(line)){fence=!fence;continue;}
 if(!fence&&!/^\s*\|[\s:|\-]+\|\s*$/.test(line)&&/\S[ \t]+-[ \t]+\S/.test(line)){console.error(file+':'+(index+1)+': spaced hyphen');failures++;}
}}
if(failures)process.exitCode=1;else console.log('PASS: '+files.length+' prose files contain no dash punctuation.');
