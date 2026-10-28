import WebSocket from 'ws';
import {setTimeout as delay} from 'node:timers/promises';
const url=process.argv[2]||'ws://127.0.0.1:8081';
const parsed=new URL(url);
if(parsed.protocol!=='ws:'||!['127.0.0.1','localhost'].includes(parsed.hostname))throw Error('Replay connects only to a local EventSub mock.');
const socket=new WebSocket(url);
await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
try{
 const pitches=[
  ['priya','viewer','!pitch dodge falling tacos'],
  ['lee','vip','!pitch pop tiny bubbles'],
  ['mira','mod','!pitch catch falling berries'],
  ['arun','viewer','!pitch escape to the moon'],
  ['zoe','viewer','!pitch mash to charge a rocket']
 ];
 for(const [login,role,text] of pitches){socket.send(JSON.stringify({mock:'chat',login,role,text}));await delay(500);}
 console.log('Replayed five simulated pitches through the EventSub mock WebSocket server.');
}finally{socket.close();}
