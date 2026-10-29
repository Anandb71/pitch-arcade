import '../../shared/style.css';
import './overlay.css';
import {node,mount,brand} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
import {soundControls} from '../../shared/sound.js';
import {SceneTransitions,countdownCue} from '../../../packages/shared/src/presentation.js';
import {safeName} from '../../../packages/shared/src/scoring.js';
import {receiptSummary} from '../../../packages/shared/src/receipt.js';
import type {ArcadeState,GauntletState} from '../../../packages/shared/src/protocol.js';
const root=mount();root.className='overlay-stage';
if(new URLSearchParams(location.search).has('backdrop'))root.classList.add('with-backdrop');
const logo=brand();logo.classList.add('overlay-brand');
const session=node('span','pill overlay-session','LOCAL ARCADE'),factory=node('section','overlay-panel factory-panel'),factoryHead=node('div','row between'),jobCount=node('span','pill lime','0 ACTIVE');
const recentReceipt=node('p','last-build');
const factoryTitle=node('div');factoryTitle.append(node('p','eyebrow','THE COMMUNITY IS THE STUDIO'),node('h2','','Factory floor'));
factoryHead.append(factoryTitle,jobCount);const jobs=node('div','job-list'),factoryFoot=node('div','factory-foot');factoryFoot.append(recentReceipt,node('span','mono','MAKE SOMETHING WEIRD.'),node('span','pitch-command','!pitch your game'));
factory.append(factoryHead,jobs,factoryFoot);
const playing=node('section','overlay-panel now-panel'),nowTop=node('div','row between'),phase=node('span','eyebrow','UP NEXT'),gameRound=node('span','mono muted','01 / 05');
nowTop.append(phase,gameRound);const nowTitle=node('h1','now-title','Your move.'),nowBy=node('p','now-designer','Your chat makes the games.'),nowEmoji=node('span','now-emoji','🎮'),nowBottom=node('div','row between'),hearts=node('div','now-hearts'),pace=node('span','pill dim','1.00× SPEED');
const nowObjective=node('div','now-objective'),objectiveText=node('strong'),objectiveTime=node('span');nowObjective.append(objectiveText,objectiveTime);
nowBottom.append(hearts,pace);playing.append(nowTop,nowTitle,nowBy,nowEmoji,nowObjective,nowBottom);
const leaders=node('section','overlay-panel leader-panel'),leaderTop=node('div','row between'),leaderList=node('div','leader-list');
leaderTop.append(node('h2','','Designer league'),node('span','mono muted','POINTS'));leaders.append(leaderTop,leaderList);
const roundTag=node('div','overlay-panel round-tag'),tagText=node('span','mono','FIVE GAMES. THREE LIVES.'),tagScore=node('strong','','0 / 5');
roundTag.append(tagText,tagScore);
const ticker=node('div','overlay-ticker'),tickerLabel=node('span','ticker-label','IN THE FACTORY'),tickerText=node('span','ticker-text','Pitch a five second game with !pitch'),tickerEnd=node('span','ticker-end','CHAT MADE THIS.');
ticker.append(tickerLabel,tickerText,tickerEnd);
const sound=soundControls(false);sound.element.classList.add('overlay-sound');
const mode=node('div','broadcast-mode','THE CHAT ARCADE'),pitchToast=node('div','pitch-toast');pitchToast.hidden=true;
const players=node('section','overlay-panel player-panel'),playerList=node('div','player-list');players.append(node('h2','','Player high scores'),playerList,node('p','league-note','WIN STREAKS PAY MORE'));
const designerBadge=node('span','credit-badge','CHAT DESIGNER');nowBy.append(designerBadge);
const intro=node('section','overlay-intro'),introLogo=brand(),introKicker=node('p','intro-kicker','THE COMMUNITY GAUNTLET'),introTitle=node('h2','intro-title','CHAT MADE THIS.'),introSub=node('p','intro-sub','Five games. Three lives. Make them proud.'),introCount=node('strong','intro-count');introLogo.classList.add('intro-logo');intro.append(introLogo,introKicker,introTitle,introSub,introCount);intro.hidden=true;
root.append(logo,session,sound.element,mode,factory,playing,leaders,players,roundTag,ticker,pitchToast,intro);
const transitions=new SceneTransitions();let currentPhase:GauntletState['phase']='idle',phaseSignature='',lastPitch=-1,toastTimer=0,boardSignature='';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function changeScene():void{const active=latest?.pitches??[],next=transitions.next(currentPhase,active.filter(p=>p.status==='building').length,active.filter(p=>p.status==='queued').length,!pitchToast.hidden);root.dataset.scene=next.scene;mode.textContent=({queue:'OPEN FOR PITCHES',pitching:'A NEW CHALLENGER',factory:'THE FACTORY IS COOKING',gauntlet:'CHAT VS STREAMER',results:'THE SCORE IS SET'})[next.scene];if(next.changed&&!reduced.matches)for(const [index,panel] of [factory,playing,leaders,players,roundTag].entries()){panel.getAnimations().forEach(a=>a.cancel());panel.animate([{opacity:.5,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,delay:index*24,easing:'cubic-bezier(.16,1,.3,1)'});}}

let latest:ArcadeState|undefined,lastResultId=0,resultUntil=0;
function drawTicker(state:ArcadeState):void{
 const result=state.resultTicker.filter(item=>item.kind==='chat').at(-1);
 if(result&&result.id!==lastResultId){lastResultId=result.id;resultUntil=performance.now()+8000;}
 const active=state.pitches.filter(p=>['queued','building'].includes(p.status)),showResult=!!result&&performance.now()<resultUntil;
 tickerLabel.textContent=showResult?'ARCADE RESULTS':'IN THE FACTORY';
 tickerText.textContent=showResult?(result!.simulated?'Simulated results · ':'Twitch · ')+result!.text:active.length?active.slice(0,3).map(p=>'@'+p.login+': '+p.text).join('   /   '):'Pitch a five second game with !pitch. Your idea could be next.';
}
function drawState(state:ArcadeState):void{
 latest=state;
 const newest=state.pitches.at(-1);if(lastPitch>=0&&newest&&newest.id>lastPitch){sound.audio.play('pitch');pitchToast.textContent='NEW PITCH · @'+safeName(newest.login);pitchToast.hidden=false;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>{pitchToast.hidden=true;changeScene();},2800);}lastPitch=newest?.id??Math.max(0,lastPitch);
 changeScene();
 session.textContent=state.mockTwitch?'● MOCK SESSION':'● LOCAL ARCADE';
 const recent=state.builds.find(build=>build.status==='completed'&&build.receipt_json);
 const spike=state.games.find(game=>game.receipt&&typeof game.receipt==='object'&&(game.receipt as Record<string,unknown>).source==='codex-cli');
 recentReceipt.textContent='';
 if(spike)recentReceipt.textContent='Real Codex spike · '+spike.title+'\n'+receiptSummary(spike.receipt);
 else if(recent?.receipt_json){try{recentReceipt.textContent='Last build · '+receiptSummary(JSON.parse(recent.receipt_json));}catch{}}

 const active=state.pitches.filter(p=>['queued','building'].includes(p.status));
 jobCount.textContent=active.length+' ACTIVE';jobs.replaceChildren();
 const shown=[...active.filter(p=>p.status==='building'),...active.filter(p=>p.status==='queued'),...state.pitches.filter(p=>['built','approved'].includes(p.status)).slice(-2).reverse()].filter((p,i,list)=>list.findIndex(q=>q.id===p.id)===i).slice(0,2);
 if(!shown.length){jobs.append(node('div','overlay-empty','The next great idea starts in chat.'));jobs.append(node('p','muted','Pitch it. Build it. Make the streamer survive it.'));}
 for(const pitch of shown){
  const card=node('div','factory-job'),game=state.games.find(g=>g.pitchId===pitch.id),last=state.steps.filter(step=>step.pitchId===pitch.id).at(-1),build=state.builds.find(b=>b.pitch_id===pitch.id);
  const top=node('div','row between');top.append(node('span','job-number','#'+String(pitch.id).padStart(2,'0')),node('span',pitch.status==='building'?'job-state working':'job-state',pitch.status==='building'?'BUILDING':pitch.status==='queued'?'QUEUED':'READY'));
  card.append(top,node('h3','job-title',game?.title??pitch.text),node('p','job-by','by @'+pitch.login));
  const bars=node('div','factory-stages');const current=last?.kind==='done'?2:last?.kind==='playtest'?1:0;
  for(const [i,label] of ['DESIGN','PLAYTEST','READY'].entries())bars.append(node('span',i<=current?'filled':'',label));
  card.append(bars,node('p','job-step',last?(last.simulated?'Mock · ':'')+last.label:'Waiting for a factory worker'));
  if(build?.receipt_json){try{card.append(node('p','job-receipt',receiptSummary(JSON.parse(build.receipt_json))));}catch{}}
  jobs.append(card);
 }
 const signature=JSON.stringify(state.scoreboards);
 if(signature!==boardSignature){boardSignature=signature;leaderList.replaceChildren();playerList.replaceChildren();
  for(const [entries,list] of [[state.scoreboards.designers,leaderList],[state.scoreboards.players,playerList]] as const){
   if(!entries.length)list.append(node('p','leader-empty','The next great score could be yours.'));
   for(const [index,entry] of entries.slice(0,3).entries()){const row=node('div','leader-row');row.append(node('span','leader-rank',String(index+1).padStart(2,'0')),node('strong','','@'+safeName(entry.login)),node('span','leader-beats',String(entry.score)));if(entry.simulated)row.querySelector('strong')!.append(node('span','credit-badge','BOT'));list.append(row);}
  }
 }

 drawTicker(state);
}
function drawGame(state:GauntletState):void{
 root.dataset.phase=state.phase;currentPhase=state.phase;changeScene();
 const cue=countdownCue(state.phase,state.countdown,state.phaseFrames),signature=state.id+':'+state.round+':'+state.phase+':'+cue;
 if(signature!==phaseSignature){phaseSignature=signature;if(state.phase==='countdown')sound.audio.play('countdown');if(cue==='GO')sound.audio.play('go');if(state.phase==='result')sound.audio.play(state.lastOutcome==='win'?'win':state.lastOutcome==='lose'?'lose':'tick');}
 intro.hidden=!(state.round===1&&['title','countdown'].includes(state.phase))&&cue!=='GO';intro.classList.toggle('intro-go',cue==='GO');intro.classList.toggle('intro-counting',state.phase==='countdown');introCount.textContent=cue;introTitle.textContent=state.phase==='title'?'CHAT MADE THIS.':'YOUR TURN.';
 if(cue==='GO'&&!reduced.matches&&intro.dataset.cue!=='GO')intro.animate([{transform:'scale(.85)',opacity:1},{transform:'scale(1.06)',opacity:0}],{duration:400,easing:'ease-out'});intro.dataset.cue=cue;
 phase.textContent=state.phase==='play'?'NOW PLAYING':state.phase==='countdown'?'GET READY · '+state.countdown:state.phase==='result'?(state.lastOutcome==='lose'?'THE DESIGNER WINS':state.lastOutcome==='win'?'STREAMER SURVIVES':'SKIPPED'):state.phase==='finished'?'GAUNTLET COMPLETE':'UP NEXT';
 gameRound.textContent=String(state.round||1).padStart(2,'0')+' / 05';
 nowTitle.textContent=state.game?.title??'Your move.';
 nowBy.replaceChildren(node('span','',state.game?'by @'+safeName(state.game.authorLogin):'Your chat makes the games.'));designerBadge.textContent=state.game?.classic?'ARCADE CLASSIC':'CHAT DESIGNER';nowBy.append(designerBadge);
 nowEmoji.textContent=state.game?.spec.spawners[0]?.emoji??'🎮';
 nowObjective.hidden=state.phase!=='play';
 if(state.game&&state.snapshot){objectiveText.textContent=state.game.verb+('n' in state.game.spec.win?' · '+state.snapshot.score+' / '+state.game.spec.win.n:'');objectiveTime.textContent=Math.max(0,state.game.spec.seconds-state.snapshot.frame/60).toFixed(1)+'s left';}
 hearts.replaceChildren();for(let i=0;i<3;i++)hearts.append(node('span',i<state.lives?'':'spent','♥'));
 pace.textContent=(state.speedPercent/100).toFixed(2)+'× SPEED';
 tagText.textContent=state.autoplay?'HUMANISH BOT · DEMO':'THE COMMUNITY GAUNTLET';tagScore.textContent=state.points+' PTS';
}
setInterval(()=>{if(latest)drawTicker(latest);},1000);
new ArcadeClient(drawState,drawGame);
