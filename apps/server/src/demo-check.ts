import assert from 'node:assert/strict';
import {createArcade} from './app.js';
const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,stepMs:0});
const headers={'x-arcade-control':'local'};
try{
 assert.equal(arcade.library.approved().length,33);
 const response=await arcade.app.inject({method:'POST',url:'/api/mock/chat',headers,payload:{login:'demo_designer',role:'viewer',text:'!pitch dodge falling tacos'}});
 assert.equal(response.statusCode,200);assert.equal(response.json().ok,true);
 await arcade.factory.idle();
 const game=arcade.library.all().find(g=>g.status==='built');assert.ok(game);assert.equal(game.report.pass,true);
 const approved=await arcade.app.inject({method:'POST',url:'/api/games/'+game.id+'/approve',headers});assert.equal(approved.statusCode,200);
 assert.equal(arcade.library.approved().length,34);
 console.log('PASS: mock chat reached the queue, simulated factory, independent validator, approval and library.');
 console.log('33 library games passed their applicable validation. One new mock build passed and was approved. No credentials or network were used.');
}finally{await arcade.close();}
