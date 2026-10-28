import {it,expect} from 'vitest';
import {RealResultsSink} from './results.js';
import {HelixClient} from '../../../packages/twitch/src/helix.js';
import {missingTwitch} from './twitch-runtime.js';
it('posts clip links and contains clip and chat failures',async()=>{
 const messages:string[]=[];const helix={createClip:async()=> 'https://clips.twitch.tv/Fixture',sendChat:async(text:string)=>{messages.push(text);}} as unknown as HelixClient;
 const sink=new RealResultsSink(helix);await sink.requestClip({title:'Berries by @priya',gameId:1,gauntletId:1,playId:1,authorId:'priya'});expect(messages[0]).toContain('https://clips.twitch.tv/Fixture');expect(sink.items[0]!.simulated).toBe(false);
 helix.createClip=async()=>{throw Error('private upstream error');};await expect(sink.requestClip({title:'Berries by @priya',gameId:1,gauntletId:1,playId:2,authorId:'priya'})).resolves.toBeUndefined();expect(JSON.stringify(sink.items)).not.toContain('private upstream');
});
it('lists missing live configuration without values',()=>{expect(missingTwitch({TWITCH_CLIENT_ID:'private'})).toEqual(['TWITCH_CLIENT_SECRET','TWITCH_BROADCASTER_LOGIN','TWITCH_BOT_LOGIN']);});
