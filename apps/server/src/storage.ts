import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {migration} from './schema.js';
import {roles,type ChatMessage, type Role} from './chat.js';
import type {ModerationDecision} from './moderation.js';
export type Value=SQLInputValue;
/** The synchronous database boundary. Domain code does not depend on a SQLite binding. */
export interface SqlDatabase {
 exec(sql:string):void;
 run(sql:string,...values:Value[]):{lastInsertRowid:number|bigint;changes:number|bigint};
 get<T>(sql:string,...values:Value[]):T|undefined;
 all<T>(sql:string,...values:Value[]):T[];
 close():void;
}
export function openSqlite(path:string):SqlDatabase {
 const db=new DatabaseSync(path);
 return {
  exec:sql=>db.exec(sql),
  run:(sql,...values)=>db.prepare(sql).run(...values),
  get:<T>(sql:string,...values:Value[])=>db.prepare(sql).get(...values) as T|undefined,
  all:<T>(sql:string,...values:Value[])=>db.prepare(sql).all(...values) as T[],
  close:()=>db.close()
 };
}
export type PitchStatus='received'|'filtered'|'queued'|'building'|'built'|'failed'|'approved'|'rejected';
export interface Pitch {id:number;user_id:string;login:string;display_name:string;text:string;created_at:number;status:PitchStatus;role:Role}
export class Repository {
 constructor(readonly db:SqlDatabase){db.exec(migration);}
 transaction<T>(fn:()=>T):T {
  this.db.exec('BEGIN IMMEDIATE');
  try{const result=fn();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 addPitch(message:ChatMessage,now:number,status:PitchStatus,moderation:ModerationDecision,reason:string|null=null):Pitch {
  return this.transaction(()=>{
   this.db.run('INSERT INTO users(twitch_id,login,display_name,first_seen) VALUES(?,?,?,?) ON CONFLICT(twitch_id) DO UPDATE SET login=excluded.login,display_name=excluded.display_name',message.userId,message.login.toLowerCase(),message.displayName,now);
   const result=this.db.run('INSERT INTO pitches(user_id,text,created_at,status,reason,moderation_json,role,priority,message_id) VALUES(?,?,?,?,?,?,?,?,?)',message.userId,message.text,now,status,reason,JSON.stringify(moderation),message.role,roles.indexOf(message.role),message.id);
   this.db.run('UPDATE users SET pitches=pitches+1 WHERE twitch_id=?',message.userId);
   return this.pitch(Number(result.lastInsertRowid))!;
  });
 }
 pitch(id:number):Pitch|undefined {return this.db.get<Pitch>('SELECT p.*,u.login,u.display_name FROM pitches p JOIN users u ON p.user_id=u.twitch_id WHERE p.id=?',id);}
 pitches():Pitch[]{return this.db.all<Pitch>('SELECT p.*,u.login,u.display_name FROM pitches p JOIN users u ON p.user_id=u.twitch_id ORDER BY p.id');}
 queue():Pitch[]{return this.pitches().filter(p=>p.status==='queued').sort((a,b)=>roles.indexOf(a.role)-roles.indexOf(b.role)||a.id-b.id);}
 active():Pitch[]{return this.pitches().filter(p=>p.status==='queued'||p.status==='building');}
 seen(id:string):boolean{return !!this.db.get('SELECT id FROM pitches WHERE message_id=?',id);}
 lastPitch(userId:string):number|undefined{return this.db.get<{created_at:number}>("SELECT created_at FROM pitches WHERE user_id=? AND status NOT IN ('filtered','received') ORDER BY created_at DESC LIMIT 1",userId)?.created_at;}
 setPitch(id:number,status:PitchStatus,reason:string|null=null):void {this.db.run('UPDATE pitches SET status=?,reason=? WHERE id=?',status,reason,id);}
 event(type:string,payload:Record<string,unknown>,now=Date.now(),userId:string|null=null):void{this.db.run('INSERT INTO events(ts,type,payload_json,user_id) VALUES(?,?,?,?)',now,type,JSON.stringify(payload),userId);}
 events():{id:number;type:string;payload_json:string}[]{return this.db.all('SELECT id,type,payload_json FROM events ORDER BY id DESC LIMIT 100');}
 get enabled():boolean{return this.db.get<{value:string}>("SELECT value FROM settings WHERE key='enabled'")?.value!=='false';}
 set enabled(value:boolean){this.db.run("INSERT INTO settings(key,value) VALUES('enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",String(value));}
 forget(login:string):number {return this.transaction(()=>Number(this.db.run('DELETE FROM users WHERE login=? COLLATE NOCASE',login).changes));}
 close():void {this.db.close();}
}
