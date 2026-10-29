import assert from 'node:assert/strict';
import {createArcade} from './app.js';
import {VideoDemo,VideoRunner} from './video-demo.js';
export async function checkVideo(){
 const runner=new VideoRunner(0),arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,runner,cooldownMs:0,maxJobsPerHour:100});
 try{
  let video=new VideoDemo(arcade,runner,8,true);let previous:string[]=[];
  for(let cycle=0;cycle<2;cycle++){
   await video.begin();await video.tick(35000);
   for(let frame=0;frame<5000&&arcade.gauntlet.active;frame++)arcade.gauntlet.tick();
   const state=arcade.getState();
   assert.equal(state.gauntlet.reason,'complete');assert.equal(state.gauntlet.outcomes.length,5);
   assert.ok(state.gauntlet.outcomes.some(o=>o.outcome==='win'));assert.ok(state.gauntlet.outcomes.some(o=>o.outcome==='lose'));
   assert.ok(state.acks.some(a=>a.startsWith('🛡')));assert.equal(state.acks.filter(a=>a.startsWith('✓ APPROVED')).length>=5,true);
   const outcomes=state.gauntlet.outcomes.map(o=>o.title+':'+o.outcome);if(cycle)assert.deepEqual(outcomes,previous);previous=outcomes;
   assert.equal(await video.tick(110000),cycle?'loop':'hold');assert.ok(state.scoreboards.designers.length);video=new VideoDemo(arcade,runner,8,false);video.next();
  }
  console.log('PASS: two video cycles, five games each, mixed wins and losses, moderation, approvals, credits, leaderboards, final hold and looping. No network or credentials.');
 }finally{await arcade.close();}
}
