import {expect,test} from 'vitest';
import {createArcade} from '../apps/server/src/app.js';
import {prepareAutoDemo,addDemoReviewPitches} from '../apps/server/src/auto-demo.js';
test('demo:auto reaches a finished five game gauntlet using actual humanish inputs',async()=>{
 const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,stepMs:0,cooldownMs:0});
 try{
  await prepareAutoDemo(arcade,0);await addDemoReviewPitches(arcade);await arcade.factory.idle();
  expect(arcade.library.approved().filter(g=>!g.classic)).toHaveLength(5);
  expect(arcade.library.all().filter(g=>g.status==='built')).toHaveLength(2);
  for(let frame=0;frame<6000;frame++)arcade.gauntlet.tick();
  expect(arcade.gauntlet.state).toMatchObject({phase:'finished',round:5,autoplay:true,score:4,lives:2,reason:'complete'});
  expect(arcade.gauntlet.state.outcomes).toHaveLength(5);
  expect(arcade.getState().leaderboard).toEqual(expect.arrayContaining([expect.objectContaining({login:'lee',beats:1})]));
  expect(arcade.getState().resultTicker.some(item=>item.kind==='clip'&&item.text==='Lantern Snap by @lee')).toBe(true);
 }finally{await arcade.close();}
},10000);
