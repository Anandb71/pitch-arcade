import {Engine} from '../../../packages/engine/src/engine.js';
import type {Input} from '../../../packages/engine/src/types.js';
import {createBot,type Bot} from '../../../packages/harness/src/bots.js';
import type {ArcadeGame,GauntletState,RoundGame,PlayOutcome} from '../../../packages/shared/src/protocol.js';
import {Library} from './library.js';
import {Repository} from './storage.js';
import type {ResultsSink} from './results.js';
export function selectGames(games:ArcadeGame[]):ArcadeGame[]{
 const viewers=games.filter(g=>g.status==='approved'&&!g.classic).sort((a,b)=>b.approvedAt-a.approvedAt||b.id-a.id);
 const classics=games.filter(g=>g.status==='approved'&&g.classic).sort((a,b)=>a.id-b.id);
 const ids=new Set<number>();return [...viewers,...classics].filter(g=>{if(ids.has(g.id))return false;ids.add(g.id);return true;}).slice(0,5);
}
const idle=():GauntletState=>({id:null,revision:0,phase:'idle',phaseFrames:0,round:0,total:5,lives:3,score:0,countdown:3,speedPercent:100,seed:0,autoplay:false,game:null,snapshot:null,pointer:null,outcomes:[],lastOutcome:null,reason:null});
export class Gauntlet {
 frozen=false;private revision=0;
 private value=idle();private games:RoundGame[]=[];private engine:Engine|undefined;private bot:Bot|undefined;
 private pointer:{x:number;y:number}|null=null;
 private input:Input={};private fractional=0;
 constructor(private store:Repository,private library:Library,private sink:ResultsSink,private onChange?:(state:GauntletState)=>void){
  store.db.run('UPDATE gauntlets SET ended_at=? WHERE ended_at IS NULL',Date.now());
 }
 get state():GauntletState{return structuredClone({...this.value,snapshot:this.engine?.snapshot()??null,pointer:this.pointer});}
 get active():boolean{return !['idle','finished'].includes(this.value.phase);}
 private notify():void{this.value.revision=++this.revision;this.onChange?.(this.state);}
 start(options:{seed?:number;autoplay?:boolean}={}):void{
  if(this.active)throw Error('GAUNTLET_BUSY');
  const selected=selectGames(this.library.approved());if(selected.length<5)throw Error('NEED_FIVE_GAMES');
  const id=Number(this.store.db.run('INSERT INTO gauntlets(started_at,lives_left,score) VALUES(?,3,0)',Date.now()).lastInsertRowid);
  this.games=selected.map(({id,title,verb,spec,authorId,authorLogin,classic})=>({id,title,verb,spec,authorId,authorLogin,classic}));
  this.value={...idle(),id,seed:(options.seed??2026+id*137)>>>0,autoplay:options.autoplay??false};
  this.nextRound();
 }
 private nextRound():void{
  this.value.round++;this.value.game=this.games[this.value.round-1]!;
  this.value.speedPercent=100+(this.value.round-1)*12;this.value.lastOutcome=null;this.fractional=0;this.input={};this.pointer=null;
  const seed=(this.value.seed+(this.value.round-1)*101)>>>0;
  this.engine=new Engine(this.value.game.spec,seed);this.bot=createBot('humanish',seed,this.value.game.spec);
  this.value.phase='title';this.value.phaseFrames=0;this.notify();
 }
 setInput(input:Input):void{
  const finite=(n:unknown,lo:number,hi:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):0;
  this.input={x:finite(input.x,-1,1),y:finite(input.y,-1,1),click:input.click===true,mash:input.mash===true,
   ...(input.pointer?{pointer:{x:finite(input.pointer.x,0,960),y:finite(input.pointer.y,0,540)}}:{})};
  if(this.input.pointer)this.pointer=this.input.pointer;
 }
 tick():void{
  if(!this.active||this.frozen)return;
  this.value.phaseFrames++;
  if(this.value.phase==='title'&&this.value.phaseFrames>=108){this.value.phase='countdown';this.value.phaseFrames=0;this.value.countdown=3;}
  else if(this.value.phase==='countdown'){
   this.value.countdown=Math.max(1,3-Math.floor(this.value.phaseFrames/60));
   if(this.value.phaseFrames>=180){this.value.phase='play';this.value.phaseFrames=0;}
  }else if(this.value.phase==='play'&&this.engine){
   this.fractional+=this.value.speedPercent;
   while(this.fractional>=100&&this.engine.outcome==='playing'){
    const input=this.value.autoplay?this.bot!(this.engine.snapshot()):this.input;
    this.engine.step(input);if(this.value.autoplay){this.input=input;if(input.pointer)this.pointer=input.pointer;}this.fractional-=100;
   }
   if(this.engine.outcome!=='playing')this.record(this.engine.outcome);
  }else if(this.value.phase==='result'&&this.value.phaseFrames>=96){
   if(this.value.lives<=0)this.finish('out_of_lives');
   else if(this.value.round===5)this.finish('complete');else this.nextRound();
  }
  this.notify();
 }
 skip():void{if(['title','countdown','play'].includes(this.value.phase))this.record('skip');}
 stop():void{
  if(!this.active)return;
  if(this.value.phase!=='result')this.record('skip');
  this.finish('stopped');
 }
 reset():void{this.stop();this.value=idle();this.engine=undefined;this.games=[];this.input={};this.pointer=null;this.notify();}
 forget(ids:Set<string>):void{if(this.games.some(game=>game.authorId&&ids.has(game.authorId)))this.reset();}
 private record(outcome:PlayOutcome):void{
  if(!this.value.game||this.value.outcomes.length>=this.value.round)return;
  const g=this.value.game,ms=this.value.phase==='play'?Math.round(this.value.phaseFrames/60*1000):0;
  if(outcome==='win')this.value.score++;
  if(outcome==='lose')this.value.lives--;
  const playId=Number(this.store.db.run('INSERT INTO plays(gauntlet_id,game_id,position,outcome,ms) VALUES(?,?,?,?,?)',this.value.id!,g.id,this.value.round,outcome,ms).lastInsertRowid);
  this.value.outcomes.push({gameId:g.id,title:g.title,designer:g.authorLogin,outcome,round:this.value.round,ms});
  this.store.db.run('UPDATE gauntlets SET lives_left=?,score=? WHERE id=?',this.value.lives,this.value.score,this.value.id!);
  if(outcome==='lose'){
   if(g.authorId)this.store.db.run('UPDATE users SET beats=beats+1 WHERE twitch_id=?',g.authorId);
   const request={title:g.title+' by @'+g.authorLogin,gameId:g.id,gauntletId:this.value.id!,playId,authorId:g.authorId};
   const invoke=(fn:()=>Promise<void>|void)=>{try{void Promise.resolve(fn()).catch(()=>this.store.event('results.failed',{playId}));}catch{this.store.event('results.failed',{playId});}};
   invoke(()=>this.sink.requestClip(request));
   invoke(()=>this.sink.chat(g.title+' by @'+g.authorLogin+' got the streamer. A clip was requested.',g.authorId));
   this.store.event('results.clip_requested',{playId,title:request.title},Date.now(),g.authorId);
  }
  this.value.phase='result';this.value.phaseFrames=0;this.value.lastOutcome=outcome;this.input={};this.notify();
 }
 private finish(reason:GauntletState['reason']):void{
  this.value.phase='finished';this.value.reason=reason;this.value.phaseFrames=0;
  try{void Promise.resolve(this.sink.gauntletFinished?.(this.value.score,this.value.lives)).catch(()=>this.store.event('results.failed',{gauntletId:this.value.id}));}catch{this.store.event('results.failed',{gauntletId:this.value.id});}
  try{void Promise.resolve(this.sink.chat('Gauntlet finished: '+this.value.score+' wins, '+this.value.lives+' lives left.',null)).catch(()=>this.store.event('results.failed',{gauntletId:this.value.id}));}catch{this.store.event('results.failed',{gauntletId:this.value.id});}
  this.store.db.run('UPDATE gauntlets SET ended_at=?,lives_left=?,score=? WHERE id=?',Date.now(),this.value.lives,this.value.score,this.value.id!);this.notify();
 }
}
