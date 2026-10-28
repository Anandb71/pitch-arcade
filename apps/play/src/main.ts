import '../../shared/style.css';
import './play.css';
import {mount,node,topbar,post} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
import {ArcadeRenderer,bindInput,SynthSfx} from '../../../packages/render/src/index.js';
import type {GauntletState} from '../../../packages/shared/src/protocol.js';
const root=mount();root.append(topbar('Play window'));
const shell=node('main','play-shell'),head=node('div','row between'),left=node('div'),round=node('span','eyebrow','THE COMMUNITY GAUNTLET'),title=node('h1','','Your chat made this.');
left.append(round,title);
const lives=node('div','lives'),speed=node('span','pill dim','1.00× SPEED'),headRight=node('div','row');headRight.append(speed,lives);head.append(left,headRight);
const canvas=node('canvas');canvas.setAttribute('aria-label','Microgame arena');
const stage=node('div','arena'),card=node('div','stage-card'),cardInner=node('div','stage-card-inner');card.append(cardInner);stage.append(canvas,card);
const progress=node('div','game-progress'),fill=node('div');progress.append(fill);
const bottom=node('div','row between play-bottom'),hint=node('div','control-hint'),actions=node('div','row'),sound=node('button','secondary','Sound off'),skip=node('button','secondary','Skip game'),start=node('button','','Start gauntlet');
actions.append(sound,skip,start);bottom.append(hint,actions);
const caption=node('div','row between play-caption'),credit=node('span'),auto=node('span','mono muted');caption.append(credit,auto);
shell.append(head,stage,progress,bottom,caption);root.append(shell);
const audio=new SynthSfx();
sound.onclick=async()=>{if(audio.enabled){audio.enabled=false;sound.textContent='Sound off';}else{await audio.enable();sound.textContent='Sound on';}};
skip.onclick=()=>void post('/api/gauntlet/skip');
start.onclick=()=>void post('/api/gauntlet/start',{});
const input=bindInput(canvas,()=>void post('/api/gauntlet/skip'));
let state:GauntletState|undefined,renderer:ArcadeRenderer|undefined,key='',phaseKey='',last=performance.now(),lastInput=0;
function update(value:GauntletState):void{
 state=value;root.dataset.phase=value.phase;root.dataset.game=value.game?.id.toString()??'';root.dataset.frame=value.snapshot?.frame.toString()??'0';
 const nextKey=value.id+':'+value.round;
 if(value.game&&nextKey!==key){key=nextKey;renderer=new ArcadeRenderer(canvas,value.game.spec,kind=>audio.play(kind));}
 round.textContent=value.phase==='idle'?'THE COMMUNITY GAUNTLET':'GAME '+String(value.round).padStart(2,'0')+' / 05';
 title.textContent=value.game?.title??'Your chat made this.';
 lives.replaceChildren();for(let i=0;i<3;i++)lives.append(node('span',i<value.lives?'heart':'heart empty','♥'));
 speed.textContent=(value.speedPercent/100).toFixed(2)+'× SPEED';
 credit.textContent=value.game?'by @'+value.game.authorLogin+(value.game.classic?' · seed library':' · chat designer'):'Five games. Three lives. Your move.';
 auto.textContent=value.autoplay?'HUMANISH BOT · DEMO':'YOU ARE THE PLAYER';
 const control=value.game?.spec.player.control;
 hint.textContent=control==='mash'?'Tap SPACE repeatedly':control==='click'?'Click the targets · Space also clicks':control==='move_lr'?'← → or A D to move':'Arrow keys or WASD to move';
 start.hidden=!['idle','finished'].includes(value.phase);skip.disabled=!['title','countdown','play'].includes(value.phase);
 fill.style.width=(value.snapshot&&value.game?Math.max(0,100-value.snapshot.frame/(value.game.spec.seconds*60)*100):100)+'%';
 const nextPhase=value.id+':'+value.round+':'+value.phase+':'+value.countdown+':'+value.lastOutcome;
 if(nextPhase!==phaseKey){
  phaseKey=nextPhase;cardInner.replaceChildren();card.hidden=value.phase==='play';card.className='stage-card phase-'+value.phase;
  if(value.phase==='idle'){cardInner.append(node('p','stage-kicker','THE GAMES ARE READY'),node('h2','stage-verb','Chat made it.'),node('p','stage-sub','Now it is your turn to survive.')); }
  else if(value.phase==='title'){
   cardInner.append(node('p','stage-kicker','YOUR CHAT MADE THIS'),node('h2','stage-verb',value.game!.verb+'!'),node('p','stage-sub',value.game!.title+' by @'+value.game!.authorLogin),node('div','title-emoji',value.game!.spec.spawners[0]?.emoji??value.game!.spec.player.emoji));
  }else if(value.phase==='countdown'){cardInner.append(node('p','stage-kicker',value.game!.verb+' · GET READY'),node('h2','count-number',String(value.countdown)),node('p','stage-sub','You have '+value.game!.spec.seconds+' seconds.'));}
  else if(value.phase==='result'){cardInner.append(node('p','stage-kicker','GAME '+value.round+' / 05'),node('h2','stage-verb',value.lastOutcome==='win'?'NAILED IT.':value.lastOutcome==='lose'?'THEY GOT YOU.':'NEXT ONE.'),node('p','stage-sub',value.lastOutcome==='lose'?'Point to @'+value.game!.authorLogin+'. '+value.lives+' lives left.':value.lastOutcome==='skip'?'Skipped. Your lives are safe.':'That is one for the streamer.'));}
  else if(value.phase==='finished'){cardInner.append(node('p','stage-kicker','GAUNTLET COMPLETE'),node('h2','stage-verb',value.score+' / 5'),node('p','stage-sub','Games survived · '+value.lives+' lives left'),node('p','stage-note','Your chat built an arcade. Come back for another round.'));}
 }
}
const client=new ArcadeClient(()=>{},update,true);
function draw(now:number):void{
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(state?.snapshot&&renderer)renderer.draw(state.snapshot,dt,state.pointer??undefined);
 if(now-lastInput>=1000/30&&state?.phase==='play'&&!state.autoplay){client.input(input.state.read());lastInput=now;}
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
window.addEventListener('pagehide',()=>{input.dispose();client.dispose();void audio.dispose();},{once:true});
