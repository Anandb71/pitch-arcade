import {expect,test} from 'vitest';
import WebSocket from 'ws';
import {createArcade} from '../apps/server/src/app.js';
test('only a claimed local play connection can provide engine input',async()=>{
 const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true});
 try{
  await arcade.app.listen({host:'127.0.0.1',port:0});const address=arcade.app.server.address();if(!address||typeof address==='string')throw Error('No address');
  const socket=new WebSocket('ws://127.0.0.1:'+address.port+'/events');
  const initial=new Promise<void>(resolve=>socket.once('message',()=>resolve()));await initial;
  arcade.gauntlet.start({seed:1});for(let i=0;i<288;i++)arcade.gauntlet.tick();
  const x=arcade.gauntlet.state.snapshot!.player.x;
  socket.send(JSON.stringify({type:'input',input:{x:1},control:'local'}));
  await new Promise(resolve=>setTimeout(resolve,15));arcade.gauntlet.tick();
  expect(arcade.gauntlet.state.snapshot!.player.x).toBe(x);
  const granted=new Promise<void>(resolve=>socket.on('message',raw=>{const e=JSON.parse(raw.toString());if(e.type==='player-control'&&e.granted)resolve();}));
  socket.send(JSON.stringify({type:'claim-player',control:'local'}));await granted;
  socket.send(JSON.stringify({type:'input',input:{x:1},control:'local'}));
  await new Promise(resolve=>setTimeout(resolve,15));arcade.gauntlet.tick();
  expect(arcade.gauntlet.state.snapshot!.player.x).toBeGreaterThan(x);
  socket.close();
 }finally{await arcade.close();}
});
