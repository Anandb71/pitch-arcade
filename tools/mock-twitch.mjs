import {startEventSubMock} from '../dist/twitch-mock.mjs';
const mock=await startEventSubMock(Number(process.env.MOCK_TWITCH_PORT||8081));
console.log('Local EventSub mock listening at '+mock.url);
console.log('Emitting simulated pitches every 10 seconds. Press Ctrl+C to stop.');
const keepalive=setInterval(()=>mock.keepalive(),5000);
const pitches=['dodge falling tacos','pop tiny bubbles','catch falling berries'];
let index=0;
const chat=setInterval(()=>mock.chat('mock_viewer','!pitch '+pitches[index++%pitches.length]),10000);
const close=async()=>{
 clearInterval(keepalive);clearInterval(chat);await mock.close();
};
process.once('SIGINT',close);process.once('SIGTERM',close);
