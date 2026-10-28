import {afterEach,expect,test} from 'vitest';
import {readFileSync} from 'node:fs';
import {Repository,openSqlite} from './storage.js';
import {Library} from './library.js';
import {Gauntlet,selectGames} from './gauntlet.js';
import {MockResultsSink} from './results.js';
import {validateGame} from './validator.js';
const stores:Repository[]=[];
function setup(){
 const store=new Repository(openSqlite(':memory:'));stores.push(store);const library=new Library(store);library.importSeeds('library');
 const sink=new MockResultsSink();return {store,library,sink,gauntlet:new Gauntlet(store,library,sink)};
}
function advance(g:Gauntlet,n:number){for(let i=0;i<n;i++)g.tick();}
afterEach(()=>{for(const store of stores.splice(0))store.close();});
test('selects newest approved viewer games before distinct classics',()=>{
 const {library}=setup(),games=library.approved();
 const viewer={...games[0]!,id:99,classic:false,authorId:'u',authorLogin:'priya',approvedAt:999};
 expect(selectGames([...games,viewer]).map(g=>g.id)).toEqual([99,1,2,3,4]);
 expect(new Set(selectGames([...games,viewer]).map(g=>g.id)).size).toBe(5);
});
test('title card and three second countdown lead to play',()=>{
 const {gauntlet}=setup();gauntlet.start({seed:3});
 expect(gauntlet.state).toMatchObject({phase:'title',lives:3,round:1,score:0});
 advance(gauntlet,108);expect(gauntlet.state).toMatchObject({phase:'countdown',countdown:3});
 advance(gauntlet,60);expect(gauntlet.state.countdown).toBe(2);
 advance(gauntlet,60);expect(gauntlet.state.countdown).toBe(1);
 advance(gauntlet,60);expect(gauntlet.state.phase).toBe('play');
});
test('skip costs no life, advances speed and never calls results hooks',()=>{
 const {gauntlet,sink}=setup();gauntlet.start({seed:1});gauntlet.skip();
 expect(gauntlet.state).toMatchObject({phase:'result',lives:3,lastOutcome:'skip'});
 advance(gauntlet,96);expect(gauntlet.state).toMatchObject({round:2,speedPercent:112,phase:'title'});
 expect(sink.items).toHaveLength(0);
});
test('fixed rational speed scaling is deterministic through five rounds',()=>{
 const a=setup().gauntlet,b=setup().gauntlet;
 a.start({seed:12,autoplay:true});b.start({seed:12,autoplay:true});
 for(let i=0;i<5000;i++){a.tick();b.tick();expect(a.state.snapshot).toEqual(b.state.snapshot);}
 expect(a.state.phase).toBe('finished');expect(a.state.outcomes).toEqual(b.state.outcomes);
 expect(a.state.speedPercent).toBeGreaterThan(100);
});
test('server computes losses, persists plays and emits one clip request per loss',()=>{
 const {store,gauntlet,sink}=setup();gauntlet.start({seed:1});
 advance(gauntlet,288);
 while(gauntlet.state.phase==='play')gauntlet.tick();
 const losses=gauntlet.state.outcomes.filter(r=>r.outcome==='lose');
 expect(store.db.all('SELECT * FROM plays')).toHaveLength(1);
 if(losses.length){expect(sink.items.filter(i=>i.kind==='clip')).toHaveLength(1);expect(gauntlet.state.lives).toBe(2);}
 advance(gauntlet,10);expect(store.db.all('SELECT * FROM plays')).toHaveLength(1);
});
test('stop finishes once and records an interrupted round as skip',()=>{
 const {store,gauntlet}=setup();gauntlet.start({seed:2});gauntlet.stop();gauntlet.stop();
 expect(gauntlet.state).toMatchObject({phase:'finished',reason:'stopped',lives:3});
 expect(store.db.all('SELECT * FROM plays')).toHaveLength(1);
 expect(store.db.get<{ended_at:number}>('SELECT ended_at FROM gauntlets')?.ended_at).toBeTruthy();
});
test('a viewer loss increments their leaderboard and uses the designer in the clip title',()=>{
 const {store,library,sink}=setup();
 const raw=JSON.parse(readFileSync('library/04-moon-escape.json','utf8')),validated=validateGame(raw);if(!validated.ok)throw Error('fixture');
 const pitch=store.addPitch({id:'viewer',userId:'priya',login:'priya',displayName:'Priya',text:'escape moon',role:'viewer'},0,'building',{allowed:true,source:'test'});
 library.approve(library.addBuilt(pitch,validated,{}),'streamer');
 const gauntlet=new Gauntlet(store,library,sink);gauntlet.start({seed:1});
 advance(gauntlet,650);
 expect(sink.items.some(i=>i.kind==='clip'&&i.text==='Moon Escape by @priya')).toBe(true);
 expect(store.db.get<{beats:number}>("SELECT beats FROM users WHERE login='priya'")?.beats).toBe(1);
});
test('cannot start without five distinct approved games or overlap sessions',()=>{
 const {store,library,gauntlet}=setup();gauntlet.start({seed:1});expect(()=>gauntlet.start({seed:1})).toThrow('GAUNTLET_BUSY');
 gauntlet.stop();store.db.run("UPDATE games SET status='rejected' WHERE id>4");expect(()=>gauntlet.start({seed:1})).toThrow('NEED_FIVE_GAMES');
});
test('the round engine keeps exactly 60 Hz steps at accelerated game time',()=>{
 const {gauntlet}=setup();gauntlet.start({seed:1});
 for(let round=1;round<5;round++){gauntlet.skip();advance(gauntlet,96);}
 expect(gauntlet.state.speedPercent).toBe(148);
 advance(gauntlet,288);advance(gauntlet,30);
 expect(gauntlet.state.snapshot?.frame).toBe(44);
});
test('three losses exhaust lives and prevent a fourth game',()=>{
 const {store,gauntlet,sink}=setup();
 const spec=readFileSync('library/04-moon-escape.json','utf8');
 store.db.run('UPDATE games SET spec_json=? WHERE id<=5',spec);
 gauntlet.start({seed:900});
 advance(gauntlet,5000);
 expect(gauntlet.state).toMatchObject({phase:'finished',lives:0,score:0,reason:'out_of_lives',round:3});
 expect(store.db.all('SELECT * FROM plays')).toHaveLength(3);expect(sink.items.filter(i=>i.kind==='clip')).toHaveLength(3);
});
test('publishes each fixed engine frame so the play renderer receives 60 Hz snapshots',()=>{
 const {store,library,sink}=setup(),frames:number[]=[];
 const gauntlet=new Gauntlet(store,library,sink,state=>{if(state.phase==='play')frames.push(state.snapshot!.frame);});
 gauntlet.start({seed:1});advance(gauntlet,288);advance(gauntlet,30);
 expect(frames).toEqual(Array.from({length:31},(_,i)=>i));
});
test('the cursor spotlight retains its last aim between bot click frames',()=>{
 const {gauntlet}=setup();gauntlet.start({seed:1,autoplay:true});gauntlet.skip();advance(gauntlet,96+288);
 for(let i=0;i<40&&!gauntlet.state.pointer;i++)gauntlet.tick();
 const pointer=gauntlet.state.pointer;expect(pointer).not.toBeNull();gauntlet.tick();
 expect(gauntlet.state.pointer).toEqual(pointer);
});
test('rejecting any selected game stops the run before it can play again',()=>{const {gauntlet}=setup();gauntlet.start();const id=gauntlet.state.game!.id;gauntlet.rejectGame(id);expect(gauntlet.state).toMatchObject({phase:'finished',reason:'stopped'});});
test('a new gauntlet clears the screenshot freeze latch',()=>{const {gauntlet}=setup();gauntlet.start();gauntlet.frozen=true;gauntlet.stop();gauntlet.start();gauntlet.tick();expect(gauntlet.state.phaseFrames).toBe(1);});
