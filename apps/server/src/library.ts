import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import type {GameSpec} from '../../../packages/engine/src/index.js';
import type {Report} from '../../../packages/harness/src/index.js';
import {Repository,type Pitch} from './storage.js';
import {validateGame,type Difficulty,type ValidatedGame} from './validator.js';
import type {ArcadeGame} from '../../../packages/shared/src/protocol.js';
export type LibraryGame=ArcadeGame;
interface GameRow {id:number;title:string;verb:string;author_id:string|null;author_login:string|null;classic:number;approved_at:number|null;status:LibraryGame['status'];spec_json:string;report_json:string;receipt_json:string;pitch_id:number|null}
export class Library {
 constructor(private store:Repository){}
 all():LibraryGame[]{
  return this.store.db.all<GameRow>('SELECT g.*,u.login AS author_login FROM games g LEFT JOIN users u ON u.twitch_id=g.author_id ORDER BY g.id').map(row=>{
   const report=JSON.parse(row.report_json) as Report,m=report.metrics!;
   return {id:row.id,pitchId:row.pitch_id,title:row.title,verb:row.verb,authorId:row.author_id,authorLogin:row.author_login??'arcade',classic:!!row.classic,approvedAt:row.approved_at??0,status:row.status,spec:JSON.parse(row.spec_json) as GameSpec,report,difficulty:{humanishWinRate:m.humanish.rate,idleWinRate:m.idle.rate,randomWinRate:m.random.rate,challenge:1-m.humanish.rate},receipt:JSON.parse(row.receipt_json)};
  });
 }
 approved():LibraryGame[]{return this.all().filter(game=>game.status==='approved');}
 addBuilt(pitch:Pitch,game:ValidatedGame,receipt:unknown):number{
  return this.store.transaction(()=>{
   const row=this.store.db.run("INSERT INTO games(pitch_id,spec_json,title,verb,author_id,report_json,difficulty,status,receipt_json) VALUES(?,?,?,?,?,?,?,'built',?)",pitch.id,JSON.stringify(game.spec),game.spec.title,game.spec.verb,pitch.user_id,JSON.stringify(game.report),game.difficulty.challenge,JSON.stringify(receipt));
   this.store.setPitch(pitch.id,'built');
   this.store.event('game.built',{pitchId:pitch.id,gameId:Number(row.lastInsertRowid)},Date.now(),pitch.user_id);
   return Number(row.lastInsertRowid);
  });
 }
 approve(id:number,by:string):boolean{
  return this.store.transaction(()=>{
   const row=this.store.db.get<GameRow>('SELECT * FROM games WHERE id=?',id);
   if(!row||row.status==='rejected')return false;
   if(row.status==='approved')return true;
   this.store.db.run("UPDATE games SET status='approved',approved_by=?,approved_at=? WHERE id=?",by,Date.now(),id);
   if(row.pitch_id!==null)this.store.setPitch(row.pitch_id,'approved');
   if(row.author_id!==null)this.store.db.run('UPDATE users SET games_approved=games_approved+1 WHERE twitch_id=?',row.author_id);
   this.store.event('game.approved',{gameId:id},Date.now(),row.author_id);
   return true;
  });
 }
 reject(id:number):boolean{
  return this.store.transaction(()=>{
   const row=this.store.db.get<GameRow>('SELECT * FROM games WHERE id=?',id);if(!row)return false;
   this.store.db.run("UPDATE games SET status='rejected' WHERE id=?",id);
   if(row.pitch_id!==null)this.store.setPitch(row.pitch_id,'rejected');
   this.store.event('game.rejected',{gameId:id},Date.now(),row.author_id);return true;
  });
 }
 importSeeds(dir:string):number{
  let added=0;
  const files=readdirSync(dir).filter(file=>file.endsWith('.json')&&!file.endsWith('.receipt.json')).sort();
  for(const file of files){
   const raw=JSON.parse(readFileSync(join(dir,file),'utf8')) as unknown,game=validateGame(raw);
   if(!game.ok)throw Error('Seed library validation failed: '+file);
   const receipt=JSON.parse(readFileSync(join(dir,file.replace('.json','.receipt.json')),'utf8')) as Record<string,unknown>;
   const seed=typeof receipt.source==='string'&&/^seed library written during the build in Codex thread [a-f0-9-]{36}$/.test(receipt.source)&&receipt.threadId===null&&receipt.durationMs===null;
   const runtime=receipt.source==='codex-cli'&&receipt.simulated===false&&receipt.status==='completed'&&typeof receipt.threadId==='string'&&/^[a-f0-9-]{36}$/.test(receipt.threadId)&&typeof receipt.durationMs==='number'&&receipt.durationMs>0&&typeof receipt.tokensIn==='number'&&typeof receipt.tokensOut==='number';
   if(!seed&&!runtime)throw Error('Invalid seed receipt.');
   const result=this.store.db.run("INSERT INTO games(spec_json,title,verb,report_json,difficulty,approved_by,approved_at,classic,status,seed_key,receipt_json) VALUES(?,?,?,?,?,'seed library',?,1,'approved',?,?) ON CONFLICT(seed_key) DO NOTHING",JSON.stringify(game.spec),game.spec.title,game.spec.verb,JSON.stringify(game.report),game.difficulty.challenge,Date.now(),file,JSON.stringify(receipt));
   added+=Number(result.changes);
  }
  return added;
 }
}
