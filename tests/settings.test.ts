import {expect,test} from 'vitest';
import {createArcade} from '../apps/server/src/app.js';
const headers={'x-arcade-control':'local'};
test('auto approval applies to validated mod and VIP games, never ordinary viewers',async()=>{
 const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,stepMs:0,seedLibrary:false});
 try{
  expect((await arcade.app.inject({method:'POST',url:'/api/settings',headers,payload:{autoApproveMods:true,autoApproveVips:true,denylist:['forbidden']}})).statusCode).toBe(200);
  for(const [login,role,text] of [['mira','mod','!pitch dodge tacos'],['lee','vip','!pitch pop bubbles'],['priya','viewer','!pitch catch berries']]){
   await arcade.app.inject({method:'POST',url:'/api/mock/chat',headers,payload:{login,role,text}});
  }
  await arcade.factory.idle();
  expect(arcade.library.approved().map(g=>g.authorLogin).sort()).toEqual(['lee','mira']);
  expect(arcade.library.all().find(g=>g.authorLogin==='priya')?.status).toBe('built');
  const filtered=await arcade.app.inject({method:'POST',url:'/api/mock/chat',headers,payload:{login:'admin',role:'mod',text:'!pitch forbidden stars'}});
  expect(filtered.json()).toMatchObject({code:'FILTERED'});
 }finally{await arcade.close();}
});
test('denylist edits affect later pitches and reject invalid settings',async()=>{
 const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,stepMs:0,seedLibrary:false});
 try{
  const settings={autoApproveMods:false,autoApproveVips:false,denylist:['tacos']};
  await arcade.app.inject({method:'POST',url:'/api/settings',headers,payload:settings});
  expect((await arcade.app.inject('/api/state')).json().settings).toEqual(settings);
  expect((await arcade.app.inject({method:'POST',url:'/api/mock/chat',headers,payload:{login:'priya',role:'viewer',text:'!pitch dodge tacos'}})).json().code).toBe('FILTERED');
  expect((await arcade.app.inject({method:'POST',url:'/api/settings',headers,payload:{...settings,denylist:['x'.repeat(100)]}})).statusCode).toBe(400);
  expect(arcade.store.events().some(event=>event.payload_json.includes('tacos'))).toBe(false);
 }finally{await arcade.close();}
});
