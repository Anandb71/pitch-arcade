import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {Repository,openSqlite} from './storage.js';
import {removeJob} from './jobs.js';
const login=process.argv[2];
if(!login||!/^[a-zA-Z0-9_]{1,25}$/.test(login))throw Error('Usage: npm run forget -- <login>');
const url='http://127.0.0.1:'+(process.env.PORT||3000);
let online=false;
try{
 const health=await fetch(url+'/api/health',{signal:AbortSignal.timeout(700)});
 online=health.ok&&(await health.json() as {app?:string}).app==='pitch-arcade';
}catch{}
if(online){
 const response=await fetch(url+'/api/users/'+encodeURIComponent(login)+'/forget',{method:'POST',headers:{'X-Arcade-Control':'local'},signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw Error('Privacy deletion could not finish.');
 const result=await response.json() as {deleted:number};console.log('Forgot '+result.deleted+' matching user.');
}else{
 const path=resolve(process.env.ARCADE_DB_PATH||'data/arcade.sqlite');
 if(!existsSync(path))throw Error('Database not found. Set ARCADE_DB_PATH to the saved arcade database.');
 const store=new Repository(openSqlite(path));
 try{
  const ids=new Set(store.pitches().filter(p=>p.login.toLowerCase()===login.toLowerCase()).map(p=>p.id));
  const jobs=resolve('factory/jobs');
  if(existsSync(jobs))for(const name of readdirSync(jobs)){
   const dir=join(jobs,name);
   try{const inbox=JSON.parse(readFileSync(join(dir,'inbox/pitch.json'),'utf8')) as {id:number};if(ids.has(inbox.id))removeJob(dir);}catch{}
  }
  console.log('Forgot '+store.forget(login)+' matching user.');
 }finally{store.close();}
}
