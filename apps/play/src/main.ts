import '../../shared/style.css';
import './play.css';
import {brand,mount,node,topbar,post} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
import {ArcadeRenderer,bindInput} from '../../../packages/render/src/index.js';
import {soundControls} from '../../shared/sound.js';
import {countdownCue} from '../../../packages/shared/src/presentation.js';
import {safeName} from '../../../packages/shared/src/scoring.js';
import type {ArcadeState,GauntletState} from '../../../packages/shared/src/protocol.js';
const root=mount();root.append(topbar('Play window'));
const shell=node('main','play-shell'),head=node('div','row between'),left=node('div'),round=node('span','eyebrow','THE COMMUNITY GAUNTLET'),title=node('h1','','Your chat made this.');
left.append(round,title);
const lives=node('div','lives'),speed=node('span','pill dim','1.00× SPEED'),headRight=node('div','row');const points=node('strong','run-points','0000 PTS'),combo=node('span','run-combo','STREAK 0'),scoreColumn=node('div','score-column');scoreColumn.append(points,combo);headRight.append(scoreColumn,speed,lives);head.append(left,headRight);
const canvas=node('canvas');canvas.setAttribute('aria-label','Microgame arena');
const stage=node('div','arena'),card=node('div','stage-card'),cardInner=node('div','stage-card-inner');card.append(cardInner);stage.append(canvas,card);
const gameHud=node('div','game-hud'),hudVerb=node('strong','hud-verb'),hudGoal=node('span','hud-goal'),hudTime=node('strong','hud-time');gameHud.append(hudVerb,hudGoal,hudTime);gameHud.hidden=true;
const progress=node('div','game-progress'),fill=node('div');progress.append(fill);
const bottom=node('div','row between play-bottom'),hint=node('div','control-hint'),actions=node('div','row'),skip=node('button','secondary','Skip game'),start=node('button','','Start gauntlet');
const sound=soundControls(true);actions.append(sound.element,skip,start);bottom.append(hint,gameHud,actions);
const caption=node('div','row between play-caption'),credit=node('span'),auto=node('span','mono muted');caption.append(credit,auto);
shell.append(head,stage,progress,bottom,caption);root.append(shell);
const audio=sound.audio;
skip.title='Double tap S or press Shift + S to skip.';
skip.onclick=()=>void post('/api/gauntlet/skip');
start.onclick=()=>void post('/api/gauntlet/start',{});
const go=node('div','go-burst','GO!');go.hidden=true;stage.append(go);
let boards:ArcadeState['scoreboards']={designers:[],players:[]};
const input=bindInput(canvas,()=>void post('/api/gauntlet/skip'));
let state:GauntletState|undefined,renderer:ArcadeRenderer|undefined,key='',phaseKey='',last=performance.now(),lastInput=0;
function update(value:GauntletState):void{
 state=value;root.dataset.phase=value.phase;root.dataset.game=value.game?.id.toString()??'';root.dataset.frame=value.snapshot?.frame.toString()??'0';
 const nextKey=value.id+':'+value.round;
 if(value.game&&nextKey!==key){key=nextKey;renderer=new ArcadeRenderer(canvas,value.game.spec,kind=>audio.play(kind==='boom'?'hit':'tick'));}
 round.textContent=value.phase==='idle'?'THE COMMUNITY GAUNTLET':'GAME '+String(value.round).padStart(2,'0')+' / 05';
 points.textContent=String(value.points).padStart(4,'0')+' PTS';combo.textContent='STREAK '+value.combo+' · '+Math.min(5,Math.max(1,value.combo))+'×';
 title.textContent=value.game?.title??'Your chat made this.';
 lives.replaceChildren();for(let i=0;i<3;i++)lives.append(node('span',i<value.lives?'heart':'heart empty','♥'));
 speed.textContent=(value.speedPercent/100).toFixed(2)+'× SPEED';
 credit.replaceChildren(node('span','',value.game?'by @'+safeName(value.game.authorLogin):'Five games. Three lives. Your move.'));if(value.game)credit.append(node('span','credit-badge',value.game.classic?'ARCADE CLASSIC':'CHAT DESIGNER'));
 auto.textContent=value.autoplay?'HUMANISH BOT · DEMO':'YOU ARE THE PLAYER · DOUBLE TAP S TO SKIP';
 const control=value.game?.spec.player.control;
 hint.textContent=control==='mash'?'Tap SPACE repeatedly':control==='click'?'Click the targets · Space also clicks':control==='move_lr'?'← → or A D to move':'Arrow keys or WASD to move';
 start.hidden=!['idle','finished'].includes(value.phase);skip.disabled=!['title','countdown','play'].includes(value.phase);
 fill.style.width=(value.snapshot&&value.game?Math.max(0,100-value.snapshot.frame/(value.game.spec.seconds*60)*100):100)+'%';
 gameHud.hidden=value.phase!=='play';
 if(value.game&&value.snapshot){
  hudVerb.textContent=value.game.verb+'!';
  hudGoal.textContent='n' in value.game.spec.win?value.snapshot.score+' / '+value.game.spec.win.n:(value.game.spec.win.type==='reach'?'Reach the goal':'Stay safe');
  hudTime.textContent=(Math.max(0,value.game.spec.seconds-value.snapshot.frame/60)).toFixed(1)+'s';
 }
 const cue=countdownCue(value.phase,value.countdown,value.phaseFrames);go.hidden=cue!=='GO';
 const nextPhase=value.id+':'+value.round+':'+value.phase+':'+value.countdown+':'+value.lastOutcome;
 if(nextPhase!==phaseKey){
  if(value.phase==='countdown')audio.play('countdown');
  if(value.phase==='play'){audio.play('go');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)stage.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:160});}
  if(value.phase==='result')audio.play(value.lastOutcome==='win'?'win':value.lastOutcome==='lose'?'lose':'tick');
  if(value.phase!=='play'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){cardInner.getAnimations().forEach(a=>a.cancel());cardInner.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.16,1,.3,1)'});}
  phaseKey=nextPhase;cardInner.replaceChildren();card.hidden=value.phase==='play';card.className='stage-card phase-'+value.phase;
  if(value.phase==='idle'){cardInner.append(node('p','stage-kicker','THE GAMES ARE READY'),node('h2','stage-verb','Chat made it.'),node('p','stage-sub','Now it is your turn to survive.')); }
  else if(value.phase==='title'){
   if(value.round===1){const intro=brand();intro.classList.add('intro-logo');cardInner.append(intro,node('p','intro-tag','FIVE GAMES. THREE LIVES. ALL CHAT.'));}
   cardInner.append(node('p','stage-kicker','YOUR CHAT MADE THIS'),node('h2','stage-verb',value.game!.verb+'!'),node('p','stage-sub',value.game!.title+' by @'+safeName(value.game!.authorLogin)),node('div','title-emoji',value.game!.spec.spawners[0]?.emoji??value.game!.spec.player.emoji));
  }else if(value.phase==='countdown'){cardInner.append(node('p','stage-kicker',value.game!.verb+' · GET READY'),node('h2','count-number',String(value.countdown)),node('p','stage-sub','You have '+value.game!.spec.seconds+' seconds.'));}
  else if(value.phase==='result'){cardInner.append(node('p','stage-kicker','GAME '+value.round+' / 05'),node('h2','stage-verb',value.lastOutcome==='win'?'NAILED IT.':value.lastOutcome==='lose'?'THEY GOT YOU.':'NEXT ONE.'),node('p','stage-sub',value.lastOutcome==='lose'?'Point to @'+safeName(value.game!.authorLogin)+'. '+value.lives+' lives left.':value.lastOutcome==='skip'?'Skipped. Your lives are safe.':'That is one for the streamer.'));const result=value.outcomes.at(-1);if(result)cardInner.append(node('p','round-score',result.outcome==='win'?'+'+result.playerPoints+' PTS · '+result.combo+' WIN STREAK':result.outcome==='lose'?'DESIGNER +'+result.designerPoints+' PTS':'LIVES PRESERVED'));}
  else if(value.phase==='finished'){cardInner.append(node('p','stage-kicker',value.reason==='stopped'?'GAUNTLET STOPPED':value.reason==='out_of_lives'?'OUT OF LIVES':'GAUNTLET COMPLETE'),node('h2','stage-verb',value.score+' / 5'),node('p','stage-sub','Games survived · '+value.lives+' lives left'),node('p','stage-note',value.points+' PTS · Best streak '+Math.max(0,...value.outcomes.map(r=>r.combo))+' · '+(value.autoplay?'Humanish bot demo':'Streamer run')));drawResults(value);}
 }
}
function drawResults(value:GauntletState):void{
 const layout=node('div','results-layout'),games=node('div','results-rounds'),leaders=node('div','results-leaders');
 for(const result of value.outcomes){const row=node('div','round-receipt'),details=node('div');details.append(node('strong','',result.title),node('small','','by @'+safeName(result.designer)));row.append(node('span','result-mark',result.outcome==='win'?'✓':result.outcome==='lose'?'♥':'↗'),details,node('strong','',result.outcome==='lose'?'DESIGNER +'+result.designerPoints:'+'+result.playerPoints+' PTS'));games.append(row);}
 for(const [title,entries] of [['TOP DESIGNERS',boards.designers],['PLAYER HIGH SCORES',boards.players]] as const){leaders.append(node('p','eyebrow',title));if(!entries.length)leaders.append(node('p','empty-score','Your score could be first.'));for(const entry of entries.slice(0,3)){const row=node('div','result-rank');row.append(node('span','','@'+safeName(entry.login)+(entry.simulated?' · BOT':'')),node('strong','',String(entry.score)));leaders.append(row);}}
 layout.append(games,leaders);cardInner.append(layout);
}
const client=new ArcadeClient(value=>{boards=value.scoreboards;if(state?.phase==='finished'){phaseKey='';update(state);}},update,true);
function draw(now:number):void{
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(state?.snapshot&&renderer)renderer.draw(state.snapshot,dt,state.pointer??undefined);
 if(now-lastInput>=1000/60&&state?.phase==='play'&&!state.autoplay){client.input(input.state.read());lastInput=now;}
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
window.addEventListener('pagehide',()=>{input.dispose();client.dispose();},{once:true});
