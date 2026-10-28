import '../../shared/style.css';
import './chat.css';
import {mount,node,topbar,post} from '../../shared/dom.js';
import {ArcadeClient} from '../../shared/client.js';
import type {ArcadeState,GauntletState} from '../../../packages/shared/src/protocol.js';
const root=mount();root.append(topbar('Mock chat'));
const shell=node('main','chat-shell'),intro=node('div','chat-intro');intro.append(node('p','eyebrow','THE IDEA STARTS HERE'),node('h1','','One message. A whole new game.'),node('p','muted','Chat designs it. Codex builds it. The streamer has to survive it.'));
const columns=node('div','chat-columns'),chat=node('section','chat-window'),chatHead=node('div','row between chat-head'),chatCount=node('span','mono muted','0 PITCHES');
chatHead.append(node('div','row', '◉  COMMUNITY CHAT'),node('span','pill lime','MOCK CHAT'));const feed=node('div','chat-feed');feed.setAttribute('aria-live','polite');
const composer=node('div','composer'),identity=node('div','row'),login=node('input'),role=node('select'),text=node('textarea'),send=node('button','','Send pitch ↗'),feedback=node('p','feedback');
login.value='river';login.maxLength=25;login.setAttribute('aria-label','Mock username');for(const name of ['viewer','vip','mod','broadcaster','sub']){const option=node('option','',name);role.append(option);}role.setAttribute('aria-label','Mock role');
identity.append(node('span','mono muted','POST AS'),login,role);text.value='!pitch dodge falling tacos';text.maxLength=160;text.rows=2;text.setAttribute('aria-label','Chat message');
const composerFoot=node('div','row between');composerFoot.append(node('span','composer-hint','A short idea. Five seconds of chaos.'),send);composer.append(identity,text,composerFoot,feedback);
chat.append(chatHead,feed,composer);
const side=node('aside','chat-side stack'),how=node('section','panel how-panel');how.append(node('p','eyebrow','FROM CHAT TO CHALLENGE'),node('h2','','Make the streamer sweat.'));
for(const [index,title,copy] of [['01','Pitch something weird','Start with !pitch and an idea. Keep it under 120 characters.'],['02','Watch the factory work','Codex writes game data, playtests it and tunes the challenge.'],['03','Put it on the show','The streamer approves it, plays it and credits the designer.']]){const step=node('div','how-step'),body=node('div');body.append(node('h3','',title),node('p','muted',copy));step.append(node('span','step-index',index),body);how.append(step);}
const ideas=node('section','panel ideas-panel');ideas.append(node('h3','','Need a spark?'));
for(const phrase of ['catch falling berries','pop tiny bubbles','mash to charge a rocket']){const button=node('button','idea-button','!pitch '+phrase);button.onclick=()=>{text.value='!pitch '+phrase;text.focus();};ideas.append(button);}
const now=node('section','panel chat-now'),nowLabel=node('p','eyebrow','THE SHOW'),nowTitle=node('h2','','The games are ready.'),nowBy=node('p','muted','Your idea could be next.'),showLink=node('a','pill lime','Open play window ↗');showLink.href='/play/';showLink.target='_blank';now.append(nowLabel,nowTitle,nowBy,showLink);
side.append(how,ideas,now);columns.append(chat,side);shell.append(intro,columns);root.append(shell);
let previousKey='';
function drawState(state:ArcadeState):void{
 send.disabled=!state.mockTwitch;
 chatCount.textContent=state.pitches.length+' PITCHES';
 const key=state.pitches.map(p=>p.id+':'+p.status).join(',')+state.acks.join('|');if(key===previousKey)return;previousKey=key;feed.replaceChildren();
 const welcome=node('div','chat-welcome');welcome.append(node('span','welcome-spark','✳'),node('strong','','Welcome to the game studio.'),node('p','muted','The best ideas are the ones nobody saw coming.'));feed.append(welcome);
 for(const pitch of state.pitches.filter(p=>p.status!=='filtered').slice(-6)){
  const message=node('div','chat-message'),avatar=node('span','chat-avatar',pitch.login[0]!.toUpperCase()),body=node('div'),by=node('div','row');by.append(node('strong','chat-user','@'+pitch.login),node('span','chat-role',pitch.role==='viewer'?'DESIGNER':pitch.role.toUpperCase()));
  body.append(by,node('p','','!pitch '+pitch.text));message.append(avatar,body);feed.append(message);
  const ack=state.acks.find(line=>line.startsWith('🎮 @'+pitch.login+' '));
  if(ack){const bot=node('div','bot-message');bot.append(node('span','bot-mark','p'),node('p','',ack.replace('🎮 ','')));feed.append(bot);}
 }
 for(const line of state.acks.filter(line=>line.startsWith('Mock results:')).slice(-2)){const result=node('div','result-message');result.append(node('span','pill orange','MOCK RESULT'),node('p','',line.replace('Mock results: ','')));feed.append(result);}
 feed.scrollTop=feed.scrollHeight;
}
function drawGame(state:GauntletState):void{nowLabel.textContent=state.phase==='play'?'NOW PLAYING':'THE SHOW';nowTitle.textContent=state.game?.title??'The games are ready.';nowBy.textContent=state.game?'by @'+state.game.authorLogin+' · '+state.lives+' lives left':'Your idea could be next.';}
const client=new ArcadeClient(drawState,drawGame);
async function submit():Promise<void>{
 send.disabled=true;
 try{
  const result=await post<{ok:boolean;code:string;message?:string}>('/api/mock/chat',{login:login.value,role:role.value,text:text.value});
  const hints:Record<string,string>={COOLDOWN:'Give this designer a moment, or try another mock username.',SIMILAR:'A similar idea is already cooking. Try another twist.',QUEUE_FULL:'The factory is full. Try again shortly.',FILTERED:'That pitch did not pass the content check.',PAUSED:'The arcade is paused. A mod can turn it back on.',IGNORED:'Start with !pitch and a short game idea.'};
  feedback.textContent=result.message??hints[result.code]??result.code;await client.refresh();
 }catch(error){feedback.textContent=error instanceof Error?error.message:'That pitch could not be sent.';}finally{send.disabled=false;}
}
send.onclick=()=>void submit();text.onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();void submit();}};
