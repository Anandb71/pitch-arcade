import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {validateGame} from '../dist/validator.mjs';
import {qualityCheck} from '../dist/quality.mjs';
const session='01a18380-92df-7fb1-84cd-1b45659bee41';
const files=readdirSync('library').filter(f=>f.endsWith('.json')&&!f.endsWith('.receipt.json')).sort();
const games=files.map(file=>({file,spec:JSON.parse(readFileSync('library/'+file,'utf8'))}));
const fresh=games.filter(row=>/^\d{2}-/.test(row.file)&&Number(row.file.slice(0,2))>=31);
for(const row of fresh){const result=validateGame(row.spec);if(!result.ok)throw Error('Base validation failed: '+row.file);const quality=qualityCheck(result.spec,result.report,games.filter(other=>other.file!==row.file).map(other=>other.spec));if(!quality.pass)throw Error('Quality failed: '+row.file+' '+quality.issues.map(i=>i.code));writeFileSync('library/'+row.file.replace('.json','.receipt.json'),JSON.stringify({source:'seed library written during the build in Codex thread '+session,buildThreadId:session,threadId:null,model:null,durationMs:null,playtests:null,tokensIn:null,tokensOut:null,designer:{login:'arcade_studio',kind:'seed'},qualityVersion:1,quality,validation:{seedsPerBot:40,report:result.report,difficulty:result.difficulty}},null,2)+'\n');}
const catalog=games.map(row=>row.spec),pool=[];
for(const row of fresh){let accepted=0;const base=row.spec;
 const mods=[['speedup'],['speedup','mirror'],['speedup','wind_left'],['speedup','wind_right'],['mirror'],['wind_left'],['wind_right'],[],['wind_left','mirror'],['wind_right','mirror'],['floor_lava','speedup']];
 outer:for(const mod of mods)for(const scale of [1,.65,.8,1.3,1.6,2])for(const nOffset of [0,-1,1,-2,2,-3,3,-4,4]){
  const spec=structuredClone(base);spec.mods=mod;spec.player.speed=Math.max(1,Math.min(10,Number((base.player.speed*scale).toFixed(2))));for(const spawner of spec.spawners)if(spawner.role!=='decor'){spawner.speed=Math.max(1,Math.min(10,Number((spawner.speed*scale).toFixed(2))));if(!['move_lr','move_4'].includes(spec.player.control)&&typeof spawner.every==='number')spawner.every=Math.max(.15,Math.min(3,Number((spawner.every/scale).toFixed(3))));}if('n' in spec.win)spec.win.n=Math.max(1,spec.win.n+nOffset);
  const result=validateGame(spec);if(!result.ok)continue;const quality=qualityCheck(result.spec,result.report,catalog);if(!quality.pass)continue;
  pool.push({family:row.file,spec:result.spec});catalog.push(result.spec);accepted++;if(accepted>=4)break outer;
 }
 console.log(row.file+': '+accepted+' distinct mock variants');
}
if(fresh.length<10||pool.length<30)throw Error('Need ten seeds and at least thirty mock variants.');
writeFileSync('apps/server/src/mock-pool.json',JSON.stringify({source:'Original measured mock variants from the ten M7 seed games',games:pool},null,2)+'\n');
console.log('Validated '+fresh.length+' new seed games and '+pool.length+' pairwise distinct mock variants.');
