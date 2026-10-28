import {expect,test} from 'vitest';
import {Repository,openSqlite} from './storage.js';
test('creates the section 7.11 tables and cascades forget without deleting other users',()=>{
 const db=openSqlite(':memory:');const store=new Repository(db);
 try{
  expect(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table'").map(x=>x.name)).toEqual(expect.arrayContaining(['users','pitches','builds','games','gauntlets','plays','events']));
  for(const login of ['priya','lee'])store.addPitch({id:login,userId:login,login,displayName:login,text:'a game',role:'viewer'},1000,'queued',{allowed:true,source:'test'});
  store.event('pitch.received',{pitchId:1},1000,'priya');
  expect(store.forget('PRIYA')).toBe(1);
  expect(store.pitches().map(p=>p.login)).toEqual(['lee']);expect(store.events()).toHaveLength(0);
 }finally{store.close();}
});
