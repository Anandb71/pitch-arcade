import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdirSync,mkdtempSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';

mkdirSync('data/shot-sessions',{recursive:true});mkdirSync('shots',{recursive:true});
const data=mkdtempSync(resolve('data/shot-sessions/session-'));
const port=await new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const address=server.address();server.close(()=>resolve(address.port));});});
const base='http://127.0.0.1:'+port;
const child=spawn(process.execPath,['--experimental-sqlite','tools/start.mjs','--mock','--auto'],{
 env:{...process.env,PORT:String(port),ARCADE_DB_PATH:join(data,'arcade.sqlite'),MOCK_FACTORY_STEP_MS:'700'},stdio:['ignore','pipe','pipe']
});
let serverLog='';child.stdout.on('data',chunk=>{serverLog=(serverLog+chunk).slice(-8000);});child.stderr.on('data',chunk=>{serverLog=(serverLog+chunk).slice(-8000);});
let browser;
const errors=[],captures=[];
async function state(){const response=await fetch(base+'/api/state',{signal:AbortSignal.timeout(2000)});if(!response.ok)throw Error('State unavailable.');return response.json();}
async function post(path,body={}){const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Arcade-Control':'local'},body:JSON.stringify(body)});assert.ok(response.ok,path+' returned '+response.status);return response.json();}
async function until(predicate,timeout=90000){
 const end=Date.now()+timeout;let last;
 while(Date.now()<end){if(child.exitCode!==null)throw Error('Demo exited early. '+serverLog);try{last=await state();if(predicate(last))return last;}catch(error){if(child.exitCode!==null)throw error;}await delay(35);}
 throw Error('Scene timed out. Last phase: '+last?.gauntlet?.phase+' / '+last?.gauntlet?.round+'\n'+serverLog);
}
async function capture(page,file,scene){
 await page.screenshot({path:resolve('shots',file),animations:'disabled',fullPage:false});
 captures.push({file,...scene});console.log('Captured '+file);
}
try{
 console.log('Starting the real scripted mock session.');
 await until(()=>true,20000);
 const executable=process.env.CHROME_PATH||(existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':chromium.executablePath());
 browser=await chromium.launch({executablePath:executable,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
 const play=await context.newPage(),overlay=await context.newPage(),dashboard=await context.newPage(),chat=await context.newPage();
 for(const page of [play,overlay,dashboard,chat])page.on('pageerror',error=>errors.push(error.message));
 await Promise.all([play.goto(base+'/play/'),overlay.goto(base+'/overlay/?backdrop=1'),dashboard.goto(base+'/dashboard/'),chat.goto(base+'/chat/')]);
 if((await state()).gauntlet.phase==='idle')await dashboard.getByRole('button',{name:'Start gauntlet',exact:false}).waitFor({state:'visible'});
 await until(s=>s.gauntlet.phase==='title');
 await post('/api/demo/freeze',{frozen:true});
 await play.waitForFunction(()=>document.getElementById('app').dataset.phase==='title');
 await capture(play,'play-title.png',{phase:'title'});
 await post('/api/demo/freeze',{frozen:false});
 const ids=new Set();
 for(let index=0;index<3;index++){
  const live=await until(s=>s.gauntlet.phase==='play'&&s.gauntlet.snapshot.frame>=110&&!ids.has(s.gauntlet.game.id));
  ids.add(live.gauntlet.game.id);
  await post('/api/demo/freeze',{frozen:true});
  await play.waitForFunction(id=>document.getElementById('app').dataset.phase==='play'&&document.getElementById('app').dataset.game===String(id),live.gauntlet.game.id);
  const frozen=await state();
  await play.waitForFunction(frame=>Number(document.getElementById('app').dataset.frame)>=frame,frozen.gauntlet.snapshot.frame);
  await delay(90);
  assert.ok(await play.locator('.game-hud').evaluate(el=>{const a=document.querySelector('.arena').getBoundingClientRect(),h=el.getBoundingClientRect();return h.top>=a.bottom;}),'The HUD must not obscure simulated targets.');
  assert.equal(await play.locator('.hud-verb').textContent(),frozen.gauntlet.game.verb+'!');
  if('n' in frozen.gauntlet.game.spec.win)assert.equal(await play.locator('.hud-goal').textContent(),frozen.gauntlet.snapshot.score+' / '+frozen.gauntlet.game.spec.win.n);
  await capture(play,index===0?'play-game.png':'play-game-'+(index+1)+'.png',{phase:'play',game:live.gauntlet.game.title,round:live.gauntlet.round,frame:frozen.gauntlet.snapshot.frame});
  if(index===2){
   assert.ok(live.leaderboard.length,'A real bot loss must populate the leaderboard.');
   for(const [login,text] of [['river','!pitch escape from a maze of garden stars'],['cobalt','!pitch dodge soaring clouds in an ocean storm']]){
    assert.equal((await post('/api/mock/chat',{login,role:'viewer',text})).ok,true);
   }
   await overlay.waitForFunction(()=>document.querySelectorAll('.factory-job .working').length===2);
   await overlay.getByText('@lee',{exact:true}).waitFor();
   const safe=await overlay.locator('.overlay-panel,.overlay-ticker').evaluateAll(elements=>elements.every(el=>{const r=el.getBoundingClientRect();return r.left>=48&&r.top>=48&&r.right<=1872&&r.bottom<=1032;}));
   assert.ok(safe,'Overlay panels must stay inside the safe area.');
   await capture(overlay,'overlay.png',{phase:'play',factory:'two actual mock jobs building',leaderboard:live.leaderboard});
   await until(s=>s.pitches.every(p=>!['queued','building'].includes(p.status)),15000);
   await dashboard.getByRole('button',{name:'Approve',exact:true}).first().waitFor();
   await capture(dashboard,'dashboard.png',{pending:'actual independently validated mock games'});
   await capture(chat,'chat-panel.png',{source:'actual mock pitches and result messages'});
   const before=(await state()).gauntlet.snapshot.frame;
   await dashboard.getByRole('button',{name:'Preview',exact:true}).first().click();
   await dashboard.locator('dialog[open] canvas').waitFor();
   await dashboard.waitForFunction(()=>{const canvas=document.querySelector('dialog[open] canvas');return canvas?.width===960&&canvas.getContext('2d').getImageData(0,0,1,1).data[3]>0;});
   assert.equal((await state()).gauntlet.snapshot.frame,before,'Dashboard preview must not step the shared game.');
   await dashboard.getByRole('button',{name:'Close preview',exact:true}).click();
   const transparent=await context.newPage();await transparent.goto(base+'/overlay/');
   assert.equal(await transparent.locator('#app').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
   await transparent.close();
  }
  await post('/api/demo/freeze',{frozen:false});
 }
 console.log('Checking the unattended gauntlet finishes.');
 const finished=await until(s=>s.gauntlet.phase==='finished');
 assert.equal(finished.gauntlet.outcomes.length,5);assert.equal(finished.gauntlet.score,4);
 await dashboard.getByRole('button',{name:'Start gauntlet',exact:false}).waitFor();
 await until(()=>true);
 await delay(100);assert.equal(await dashboard.getByRole('button',{name:'Start gauntlet',exact:false}).isEnabled(),true);
 console.log('Checking the manual control room and player input.');
 const popup=context.waitForEvent('page');
 await dashboard.getByRole('button',{name:'Start gauntlet',exact:false}).click();
 const manual=await popup;manual.on('pageerror',error=>errors.push(error.message));await manual.waitForLoadState('domcontentloaded');
 await until(s=>s.gauntlet.phase==='play');
 await manual.keyboard.down('ArrowRight');await delay(180);await manual.keyboard.up('ArrowRight');
 assert.ok((await state()).gauntlet.snapshot.player.x>480,'Keyboard input must reach the authoritative engine.');
 await manual.keyboard.press('s');await delay(60);await manual.keyboard.press('s');
 await until(s=>s.gauntlet.phase==='result'&&s.gauntlet.lastOutcome==='skip');
 await dashboard.getByRole('button',{name:'Stop run',exact:true}).click();
 await until(s=>s.gauntlet.phase==='finished'&&s.gauntlet.reason==='stopped');
 await dashboard.getByRole('checkbox',{name:'Auto approve mods',exact:true}).check();
 await until(s=>s.settings.autoApproveMods);
 await dashboard.getByRole('button',{name:'Edit blocked phrases',exact:true}).click();
 const words=dashboard.getByRole('textbox',{name:'Blocked words',exact:true}),original=(await state()).settings;
 await words.fill(original.denylist.join('\n')+'\nspoilers');
 await dashboard.getByRole('button',{name:'Save word filter',exact:true}).click();
 await until(s=>s.settings.denylist.includes('spoilers'));
 await post('/api/settings',{...original,autoApproveMods:false});
 await manual.close();
 assert.deepEqual(errors,[],'Browser pages must have no uncaught errors.');
 writeFileSync('shots/manifest.json',JSON.stringify({viewport:{width:1920,height:1080},seed:1,source:'Actual scripted mock session. Humanish inputs and engine outcomes are real; factory generation and clip requests are simulated.',captures,finished:{score:finished.gauntlet.score,lives:finished.gauntlet.lives,outcomes:finished.gauntlet.outcomes},manualControls:{keyboardMovement:true,doubleTapSkip:true,previewIsolated:true,approvalRules:true,wordFilter:true},browserErrors:errors},null,2)+'\n');
 console.log('PASS: seven screenshots, three distinct games, working controls and a finished five game gauntlet.');
}finally{
 await browser?.close();child.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(5000).then(()=>child.kill('SIGKILL'))]);
}
