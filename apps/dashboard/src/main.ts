import '../../shared/style.css';
import './dashboard.css';
import {mount,node,topbar,post} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
import {receiptSummary} from '../../../packages/shared/src/receipt.js';
import type {ArcadeState,ArcadeGame,GauntletState,Settings} from '../../../packages/shared/src/protocol.js';
import {palettes,startPractice} from '../../../packages/render/src/index.js';
const root=mount();root.append(topbar('Control room'));
const shell=node('main','shell dashboard-shell'),intro=node('div','row between intro'),introCopy=node('div');
introCopy.append(node('p','eyebrow','THE PRODUCER DESK'),node('h1','','Let chat cook.'),node('p','muted','Approve the good ones. Then try to survive.'));
const introActions=node('div','row'),mode=node('span','pill orange','MOCK FACTORY'),kill=node('button','secondary','Pause arcade'),start=node('button','start-button','Start gauntlet ↗');introActions.append(mode,kill,start);intro.append(introCopy,introActions);
const stats=node('div','stats');
function stat(label:string,value:string,sub:string){const box=node('div','stat'),number=node('strong','',value),detail=node('span','muted',sub);box.append(node('span','mono muted',label),number,detail);stats.append(box);return {number,detail};}
const workerStat=stat('FACTORY','00 / 02','workers building'),pendingStat=stat('YOUR CALL','00','games to review'),readyStat=stat('READY TO PLAY','20','approved games'),livesStat=stat('THE GAUNTLET','♥ ♥ ♥','three lives to defend');
const grid=node('div','dashboard-grid'),main=node('div'),aside=node('aside','stack'),reviewHead=node('div','row between section-title'),reviewCount=node('button','pill dim','0 WAITING'),cards=node('div','review-grid');
reviewHead.append(node('h2','','Ready for a look'),reviewCount);
const libraryHead=node('div','row between section-title library-heading');libraryHead.append(node('h2','','The community collection'),node('span','mono muted','GOOD GAMES STICK AROUND'));
const browse=node('button','secondary compact','View all games');libraryHead.replaceChildren(node('h2','','The community collection'),browse);
const libraryRows=node('div','library-rows'),feedback=node('p','feedback');
main.append(reviewHead,cards,libraryHead,libraryRows,feedback);
const show=node('section','panel show-panel'),showPhase=node('span','pill lime','READY'),showTitle=node('h3','','Five games. Three lives.'),showDesigner=node('p','muted','The streamer takes it from here.'),showProgress=node('div','show-rounds'),showActions=node('div','row'),stop=node('button','secondary','Stop run'),skip=node('button','secondary','Skip game');
showActions.append(stop,skip);show.append(node('p','eyebrow','THE SHOW'),showPhase,showTitle,showDesigner,showProgress,showActions);
const rules=node('section','panel rules-panel');rules.append(node('h3','','Approval rules'),node('p','muted','Trusted designers can go straight to the library after validation.'));
function toggle(label:string){const row=node('label','switch-row'),text=node('span','',label),checkbox=node('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label',label);row.append(text,checkbox);rules.append(row);return checkbox;}
const mods=toggle('Auto approve mods'),vips=toggle('Auto approve VIPs');
const words=node('section','panel words-panel'),deny=node('textarea');deny.rows=3;deny.setAttribute('aria-label','Blocked words');deny.placeholder='One word or phrase per line';
const saveWords=node('button','secondary','Save word filter'),editWords=node('button','secondary','Edit blocked phrases'),wordSummary=node('p','muted','3 phrases blocked. Edit your local word filter.'),wordEditor=node('div','word-editor');wordEditor.hidden=true;wordEditor.append(deny,saveWords);words.append(node('h3','','Word filter'),wordSummary,editWords,wordEditor);
const obs=node('section','panel obs-panel'),obsLink=node('a','mono','Open transparent overlay ↗');obsLink.href='/overlay/';obsLink.target='_blank';obsLink.rel='noopener';
const copyObs=node('button','secondary','Copy OBS URL');obs.append(node('h3','','Put it on stream'),node('p','muted','OBS browser source · 1920 × 1080'),obsLink,copyObs);
aside.append(show,rules,words,obs);grid.append(main,aside);shell.append(intro,stats,grid);root.append(shell);
const dialog=node('dialog','preview-dialog'),modalHeader=node('div','row between'),modalTitle=node('h2'),close=node('button','secondary','Close preview'),modalCanvas=node('canvas'),modalStatus=node('p','muted','Arrow keys, WASD, space or mouse. This is a local preview.'),retry=node('button','','Play again');
modalHeader.append(modalTitle,close);dialog.append(modalHeader,modalCanvas,modalStatus,retry);root.append(dialog);
let showAllReview=false,showAllLibrary=false;
let current:ArcadeState|undefined,cardKey='',denyDirty=false,disposePreview:(()=>void)|undefined,previewGame:ArcadeGame|undefined;
const reportError=(error:unknown)=>{feedback.textContent=error instanceof Error?error.message:'That action could not finish.';};
async function act(path:string,body?:unknown):Promise<void>{try{await post(path,body);await client.refresh();}catch(error){reportError(error);}}
function playPreview():void{
 if(!previewGame)return;disposePreview?.();modalStatus.textContent='Arrow keys, WASD, space or mouse. This is a local preview.';
 disposePreview=startPractice(modalCanvas,previewGame.spec,outcome=>{modalStatus.textContent=outcome==='win'?'You survived. Ready to put it in the show?':'The designer got you. Try another run.';});
}
function preview(game:ArcadeGame):void{previewGame=game;modalTitle.textContent=game.title+' by @'+game.authorLogin;dialog.showModal();playPreview();}
retry.onclick=playPreview;close.onclick=()=>dialog.close();dialog.onclose=()=>{disposePreview?.();disposePreview=undefined;};dialog.onclick=e=>{if(e.target===dialog)dialog.close();};
function gameCard(game:ArcadeGame,state:ArcadeState):HTMLElement{
 const card=node('article','review-card'),cover=node('div','game-cover'),palette=palettes[game.spec.palette as keyof typeof palettes]??palettes.sunset;
 cover.style.background=palette.background;cover.style.color=palette.ink;cover.append(node('span','cover-verb',game.verb),node('span','cover-emoji',game.spec.spawners[0]?.emoji??game.spec.player.emoji),node('span','cover-player',game.spec.player.emoji),node('span','cover-time',game.spec.seconds+' SEC'));
 const body=node('div','game-body'),name=node('div','row between'),pitch=state.pitches.find(p=>p.id===game.pitchId);
 name.append(node('h3','',game.title),node('span','game-role',pitch?.role.toUpperCase()??'VIEWER'));
 body.append(name,node('p','game-designer','by @'+game.authorLogin));
 const rates=node('div','bot-rates');
 for(const [label,value] of [['Humanish',game.difficulty.humanishWinRate],['Random',game.difficulty.randomWinRate],['Idle',game.difficulty.idleWinRate]] as const){
  const row=node('div','rate-row'),bar=node('div','rate-track'),fill=node('div',label==='Humanish'?'rate-fill':'rate-fill muted-fill');
  fill.style.width=Math.round(value*100)+'%';bar.append(fill);row.append(node('span','',label),bar,node('strong','',Math.round(value*100)+'%'));rates.append(row);
 }
 body.append(rates,node('p','card-receipt',receiptSummary(game.receipt)));
 const actions=node('div','card-actions'),approve=node('button','','Approve'),tryIt=node('button','secondary','Preview'),reject=node('button','reject-button','Reject');
 approve.onclick=()=>{approve.disabled=true;void act('/api/games/'+game.id+'/approve');};tryIt.onclick=()=>preview(game);reject.onclick=()=>void act('/api/games/'+game.id+'/reject');
 actions.append(approve,tryIt,reject);body.append(actions);card.append(cover,body);return card;
}
function drawState(state:ArcadeState):void{
 current=state;mode.textContent=state.mockCodex?'MOCK FACTORY':'CODEX FACTORY';kill.textContent=state.enabled?'Pause arcade':'Resume arcade';kill.className=state.enabled?'secondary':'danger';
 const waiting=state.games.filter(g=>g.status==='built'),approved=state.games.filter(g=>g.status==='approved'),active=state.pitches.filter(p=>p.status==='building');
 workerStat.number.textContent=String(active.length).padStart(2,'0')+' / 02';pendingStat.number.textContent=String(waiting.length).padStart(2,'0');readyStat.number.textContent=String(approved.length).padStart(2,'0');
 reviewCount.textContent=waiting.length+' WAITING'+(waiting.length>3?(showAllReview?' · SHOW THREE':' · VIEW ALL'):'');reviewCount.disabled=waiting.length<=3;
 wordSummary.textContent=state.settings.denylist.length+' phrases blocked. Edit your local word filter.';mods.checked=state.settings.autoApproveMods;vips.checked=state.settings.autoApproveVips;if(!denyDirty)deny.value=state.settings.denylist.join('\n');
 const key=String(showAllLibrary)+String(showAllReview)+state.games.map(g=>g.id+':'+g.status+':'+JSON.stringify(g.receipt)).join('|');
 if(key===cardKey)return;cardKey=key;cards.replaceChildren();libraryRows.replaceChildren();
 if(!waiting.length){const empty=node('div','review-empty');empty.append(node('span','empty-spark','✳'),node('h3','','The next great idea is in chat.'),node('p','muted','New games appear here after the factory and bot playtest.'));cards.append(empty);}
 for(const game of waiting.slice(0,showAllReview?waiting.length:3))cards.append(gameCard(game,state));
 
 const tableHead=node('div','library-row table-head');for(const label of ['GAME / DESIGNER','BOT WIN RATE','SOURCE',''])tableHead.append(node('span','',label));libraryRows.append(tableHead);
 for(const game of approved.sort((a,b)=>Number(a.classic)-Number(b.classic)||b.approvedAt-a.approvedAt||b.id-a.id).slice(0,showAllLibrary?approved.length:3)){
  const row=node('div','library-row'),name=node('div','row'),emoji=node('span','library-emoji',game.spec.spawners[0]?.emoji??game.spec.player.emoji),copy=node('div');copy.append(node('strong','',game.title),node('small','','by @'+game.authorLogin));name.append(emoji,copy);
  const button=node('button','secondary compact','Preview');button.onclick=()=>preview(game);
  row.append(name,node('span','mono',Math.round(game.difficulty.humanishWinRate*100)+'% humanish'),node('span',game.classic?'pill dim':'pill lime',game.classic?'CLASSIC':'CHAT MADE'),button);libraryRows.append(row);
 }
 browse.textContent=showAllLibrary?'Show recent games':'View all '+approved.length+' games';
}
function drawGame(state:GauntletState):void{
 const active=!['idle','finished'].includes(state.phase);start.disabled=active||!current?.enabled;stop.disabled=!active;skip.disabled=!['title','countdown','play'].includes(state.phase);
 livesStat.number.textContent=Array.from({length:3},(_,i)=>i<state.lives?'♥':'♡').join(' ');livesStat.detail.textContent=active?'game '+state.round+' of 5':state.phase==='finished'?state.score+' games survived':'three lives to defend';
 showPhase.textContent=state.phase==='idle'?'READY':state.phase==='play'?'NOW PLAYING':state.phase.toUpperCase();
 showTitle.textContent=state.game?.title??'Five games. Three lives.';showDesigner.textContent=state.game?'by @'+state.game.authorLogin+(state.autoplay?' · Humanish bot demo':''):'The streamer takes it from here.';
 showProgress.replaceChildren();for(let i=1;i<=5;i++)showProgress.append(node('span',i<state.round?'done':i===state.round?'current':'',String(i)));
}
const client=new ArcadeClient(drawState,drawGame);
kill.onclick=()=>void act('/api/arcade',{enabled:!current?.enabled});start.onclick=()=>{window.open('/play/','pitch-arcade-play','popup,width=1440,height=1000');void act('/api/gauntlet/start',{});};stop.onclick=()=>void act('/api/gauntlet/stop');skip.onclick=()=>void act('/api/gauntlet/skip');
async function saveRules(update:Partial<Settings>):Promise<boolean>{
 if(!current)return false;try{await post('/api/settings',{...current.settings,...update});feedback.textContent='Show settings saved.';await client.refresh();return true;}catch(error){reportError(error);await client.refresh();return false;}
}
mods.onchange=()=>void saveRules({autoApproveMods:mods.checked});vips.onchange=()=>void saveRules({autoApproveVips:vips.checked});
deny.oninput=()=>{denyDirty=true;};saveWords.onclick=async()=>{if(await saveRules({denylist:deny.value.split('\n').map(w=>w.trim()).filter(Boolean)})){denyDirty=false;wordEditor.hidden=true;editWords.textContent='Edit blocked phrases';}};
 editWords.onclick=()=>{wordEditor.hidden=!wordEditor.hidden;editWords.textContent=wordEditor.hidden?'Edit blocked phrases':'Close editor';};
 reviewCount.onclick=()=>{showAllReview=!showAllReview;cardKey='';if(current)drawState(current);};
 browse.onclick=()=>{showAllLibrary=!showAllLibrary;cardKey='';if(current)drawState(current);};
copyObs.onclick=async()=>{const url=location.origin+'/overlay/';try{if(!navigator.clipboard)throw Error();await navigator.clipboard.writeText(url);feedback.textContent='OBS URL copied.';}catch{feedback.textContent='OBS URL: '+url;}};
window.addEventListener('pagehide',()=>{client.dispose();disposePreview?.();},{once:true});
