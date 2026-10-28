import '../../shared/style.css';
import './overlay.css';
import {node,mount,brand} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
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
leaderTop.append(node('h2','','Toughest designers'),node('span','mono muted','BEATS'));leaders.append(leaderTop,leaderList);
const roundTag=node('div','overlay-panel round-tag'),tagText=node('span','mono','FIVE GAMES. THREE LIVES.'),tagScore=node('strong','','0 / 5');
roundTag.append(tagText,tagScore);
const ticker=node('div','overlay-ticker'),tickerLabel=node('span','ticker-label','IN THE FACTORY'),tickerText=node('span','ticker-text','Pitch a five second game with !pitch'),tickerEnd=node('span','ticker-end','CHAT MADE THIS.');
ticker.append(tickerLabel,tickerText,tickerEnd);
root.append(logo,session,factory,playing,leaders,roundTag,ticker);
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
 session.textContent=state.mockTwitch?'● MOCK SESSION':'● LOCAL ARCADE';
 const recent=state.builds.find(build=>build.status==='completed'&&build.receipt_json);
 recentReceipt.textContent='';if(recent?.receipt_json){try{recentReceipt.textContent='Last build · '+receiptSummary(JSON.parse(recent.receipt_json));}catch{}}
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
 leaderList.replaceChildren();
 if(!state.leaderboard.length)leaderList.append(node('p','leader-empty','The first loss puts a designer on the board.'));
 for(const [index,leader] of state.leaderboard.slice(0,3).entries()){
  const row=node('div','leader-row');row.append(node('span','leader-rank',String(index+1).padStart(2,'0')),node('strong','','@'+leader.login),node('span','leader-beats',String(leader.beats)));leaderList.append(row);
 }
 drawTicker(state);
}
function drawGame(state:GauntletState):void{
 root.dataset.phase=state.phase;
 phase.textContent=state.phase==='play'?'NOW PLAYING':state.phase==='countdown'?'GET READY · '+state.countdown:state.phase==='result'?(state.lastOutcome==='lose'?'THE DESIGNER WINS':state.lastOutcome==='win'?'STREAMER SURVIVES':'SKIPPED'):state.phase==='finished'?'GAUNTLET COMPLETE':'UP NEXT';
 gameRound.textContent=String(state.round||1).padStart(2,'0')+' / 05';
 nowTitle.textContent=state.game?.title??'Your move.';
 nowBy.textContent=state.game?'by @'+state.game.authorLogin:'Your chat makes the games.';
 nowEmoji.textContent=state.game?.spec.spawners[0]?.emoji??'🎮';
 nowObjective.hidden=state.phase!=='play';
 if(state.game&&state.snapshot){objectiveText.textContent=state.game.verb+('n' in state.game.spec.win?' · '+state.snapshot.score+' / '+state.game.spec.win.n:'');objectiveTime.textContent=Math.max(0,state.game.spec.seconds-state.snapshot.frame/60).toFixed(1)+'s left';}
 hearts.replaceChildren();for(let i=0;i<3;i++)hearts.append(node('span',i<state.lives?'':'spent','♥'));
 pace.textContent=(state.speedPercent/100).toFixed(2)+'× SPEED';
 tagText.textContent=state.autoplay?'HUMANISH BOT · DEMO':'THE COMMUNITY GAUNTLET';tagScore.textContent=state.score+' / 5';
}
setInterval(()=>{if(latest)drawTicker(latest);},1000);
new ArcadeClient(drawState,drawGame);
