import {test,expect} from 'vitest';
import WebSocket from 'ws';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {createArcade} from '../apps/server/src/app.js';
test('rejects cross origin and rebound WebSocket upgrades before exposing state',async()=>{
 const arcade=await createArcade({dbPath:':memory:',seedLibrary:false,mockTwitch:true,mockCodex:true});await arcade.app.listen({host:'127.0.0.1',port:0});const address=arcade.app.server.address();if(!address||typeof address==='string')throw Error();
 try{for(const headers of [{Origin:'https://attacker.invalid'},{Origin:'null'},{Host:'attacker.invalid'}]){const socket=new WebSocket('ws://127.0.0.1:'+address.port+'/events',{headers});let exposed=false;socket.on('message',()=>{exposed=true;});await new Promise<void>((resolve,reject)=>{socket.on('error',()=>{});socket.on('close',()=>resolve());setTimeout(()=>{socket.terminate();reject(Error('Upgrade did not close.'));},1000).unref();});expect(exposed).toBe(false);}}
 finally{await arcade.close();}
});
test('browser source uses text nodes and never executable HTML sinks for chat or models',()=>{
 const files=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):entry.name.endsWith('.ts')?[join(dir,entry.name)]:[]);
 for(const file of [...files('apps/overlay/src'),...files('apps/dashboard/src'),...files('apps/shared')])expect(readFileSync(file,'utf8')).not.toMatch(/\b(?:innerHTML|outerHTML|insertAdjacentHTML|eval|Function)\s*(?:=|\()/);
});
