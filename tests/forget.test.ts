import {expect,test} from 'vitest';
import {mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createArcade} from '../apps/server/src/app.js';
test('forget CLI works against a running local server and persisted SQLite',async()=>{
 mkdirSync('data/tests',{recursive:true});const dir=mkdtempSync(resolve('data/tests/forget-')),path=join(dir,'arcade.sqlite');
 const arcade=await createArcade({dbPath:path,mockTwitch:true,mockCodex:true,stepMs:0,seedLibrary:false});
 try{
  await arcade.app.listen({host:'127.0.0.1',port:0});
  const address=arcade.app.server.address();if(!address||typeof address==='string')throw Error('No port');
  await arcade.app.inject({method:'POST',url:'/api/mock/chat',headers:{'x-arcade-control':'local'},payload:{login:'priya',role:'viewer',text:'!pitch dodge tacos'}});
  await arcade.factory.idle();
  const {stdout}=await promisify(execFile)(process.execPath,['--experimental-sqlite','tools/forget.mjs','priya'],{env:{...process.env,PORT:String(address.port),ARCADE_DB_PATH:path},timeout:10000});
  expect(stdout).toContain('Forgot 1 matching user.');expect(arcade.store.pitches()).toHaveLength(0);expect(arcade.library.all()).toHaveLength(0);
 }finally{await arcade.close();rmSync(dir,{recursive:true,force:true});}
});
