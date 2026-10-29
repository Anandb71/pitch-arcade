import {setTimeout as delay} from 'node:timers/promises';
import type {createArcade} from './app.js';
type Arcade=Awaited<ReturnType<typeof createArcade>>;
export async function prepareAutoDemo(arcade:Arcade,arrivalMs=180):Promise<void>{
 const pitches=[
  ['priya','viewer','dodge falling tacos'],
  ['lee','vip','pop tiny bubbles'],
  ['mira','mod','catch falling berries'],
  ['arun','viewer','escape to the moon'],
  ['zoe','viewer','mash to charge a rocket']
 ] as const;
 for(const [index,[login,role,text]] of pitches.entries()){
  await arcade.source.publish({id:'auto-demo-'+index,userId:'mock:'+login,login,displayName:login,role,text:'!pitch '+text});
  if(arrivalMs)await delay(arrivalMs);
 }
 await arcade.factory.idle();
 const games=arcade.library.all().filter(g=>!g.classic&&g.status==='built').sort((a,b)=>b.id-a.id);
 for(const game of games){arcade.library.approve(game.id,'scripted demo approval');await delay(5);}
 arcade.gauntlet.start({seed:8,autoplay:true});
}
export async function addDemoReviewPitches(arcade:Arcade):Promise<void>{
 for(const [index,[login,text]] of [
  ['cass','!pitch catch mushrooms and berries in enchanted woods'],
  ['noor','!pitch mash to fill the robot battery']
 ].entries()){
  await arcade.source.publish({id:'auto-review-'+index,userId:'mock:'+login,login:login!,displayName:login!,role:'viewer',text:text!});
 }
}
