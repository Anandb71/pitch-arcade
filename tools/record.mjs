import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
const executablePath=process.env.CHROME_PATH||'/usr/bin/google-chrome';
if(!existsSync(executablePath)&&!existsSync(chromium.executablePath())){console.log('Chromium is missing. Install it with npx playwright install chromium, then run npm run record.');process.exit(0);}
mkdirSync('shots',{recursive:true});mkdirSync('data',{recursive:true});
const temp=mkdtempSync('data/video-record-');
const server=spawn(process.execPath,['--experimental-sqlite','tools/start.mjs','--video','--hold'],{env:{...process.env,PORT:'3098',ARCADE_DB_PATH:temp+'/arcade.sqlite'},stdio:['ignore','pipe','inherit']});
let browser,context;
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Video server did not start.')),60000);server.once('exit',()=>{clearTimeout(timer);reject(Error('Video server stopped.'));});server.stdout.on('data',chunk=>{if(String(chunk).includes('Pitch Arcade is ready.')){clearTimeout(timer);resolve();}});});
 browser=await chromium.launch({...(existsSync(executablePath)?{executablePath}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:temp,size:{width:1920,height:1080}}});
 const page=await context.newPage();await page.goto('http://127.0.0.1:3098/play/?sound=0');
 const video=page.video();await page.waitForTimeout(112000);const state=await page.evaluate(async()=>await (await fetch('/api/state')).json());if(state.gauntlet.phase!=='finished'||state.gauntlet.outcomes.length!==5)throw Error('The recorded gauntlet did not finish all five games.');await page.screenshot({path:'data/video-final.png'});await context.close();context=undefined;await video.saveAs('shots/demo.webm');console.log('Saved shots/demo.webm. Playwright video has no audio. Use OBS for synthesized audio.');
}finally{await context?.close();await browser?.close();server.kill('SIGTERM');await new Promise(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',resolve);});rmSync(temp,{recursive:true,force:true});}
