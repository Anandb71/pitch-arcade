import {it,expect} from 'vitest';
import {simulatedTwitch} from './twitch-sim.js';
import {createArcade} from './app.js';
import {RealResultsSink} from './results.js';
it('runs fake Twitch wires through intake factory approval and results hooks',async()=>{
 const sim=await simulatedTwitch();const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,stepMs:0,chatSource:sim.source,sendChat:text=>sim.helix.sendChat(text),resultsSink:new RealResultsSink(sim.helix,true)});
 try{sim.source.start();await sim.ready;sim.mock.chat('priya','!pitch catch berries','vip');for(let i=0;i<100&&!arcade.store.pitches().length;i++)await new Promise(r=>setTimeout(r,10));await arcade.factory.idle();const game=arcade.library.all().find(g=>g.status==='built');expect(game).toBeTruthy();arcade.library.approve(game!.id,'test');arcade.gauntlet.start({seed:1});for(let frame=0;frame<6000&&arcade.gauntlet.state.phase!=='finished';frame++)arcade.gauntlet.tick();expect(arcade.gauntlet.state.phase).toBe('finished');for(let i=0;i<1000&&(!sim.fake.calls.some(c=>String(c.body.message).startsWith('Gauntlet finished:'))||!sim.fake.calls.some(c=>String(c.body.message).includes('https://clips.twitch.tv/')));i++)await new Promise(r=>setTimeout(r,10));expect(sim.fake.calls.some(c=>c.path==='/eventsub/subscriptions')).toBe(true);expect(sim.fake.calls.some(c=>c.path==='/clips')).toBe(true);expect(sim.fake.calls.some(c=>c.path==='/chat/messages')).toBe(true);expect(arcade.getState().leaderboard.length).toBeGreaterThan(0);expect(sim.fake.calls.some(c=>String(c.body.message).includes('https://clips.twitch.tv/'))).toBe(true);expect(sim.fake.calls.some(c=>String(c.body.message).startsWith('Gauntlet finished:'))).toBe(true);
 }finally{await arcade.close();await sim.stop();}
},15000);
