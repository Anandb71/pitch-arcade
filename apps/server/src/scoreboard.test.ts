import {test,expect} from 'vitest';
import {Repository,openSqlite} from './storage.js';
import {scoreboard} from './scoreboard.js';
import {Library} from './library.js';
import {Gauntlet} from './gauntlet.js';
import {MockResultsSink} from './results.js';
test('scoreboards persist idempotent round scores, distinguish bots and include empty boards',()=>{
 const store=new Repository(openSqlite(':memory:'));try{expect(scoreboard(store)).toEqual({designers:[],players:[]});const library=new Library(store);library.importSeeds('library');const g=new Gauntlet(store,library,new MockResultsSink());g.start({seed:1,autoplay:true});for(let i=0;i<6000;i++)g.tick();const first=scoreboard(store);expect(first.players[0]).toMatchObject({login:'humanish_bot',simulated:true});expect(first.players[0]!.score).toBeGreaterThan(0);g.stop();expect(scoreboard(store)).toEqual(first);expect(g.state.outcomes.every(r=>Number.isFinite(r.playerPoints))).toBe(true);}finally{store.close();}
});
test('designer totals rank ties safely and survive a database reopen',async()=>{
 const {mkdirSync,mkdtempSync,rmSync,readFileSync}=await import('node:fs');const {resolve}=await import('node:path');const {validateGame}=await import('./validator.js');mkdirSync('data/score-tests',{recursive:true});const dir=mkdtempSync(resolve('data/score-tests/run-')),path=dir+'/scores.sqlite';let store=new Repository(openSqlite(path));
 try{const library=new Library(store);library.importSeeds('library');const validated=validateGame(JSON.parse(readFileSync('library/03-berry-basket.json','utf8')));if(!validated.ok)throw Error('fixture');for(const login of ['zoe','lee','<script>']){const pitch=store.addPitch({id:login,userId:login,login,displayName:login,text:'berries',role:'viewer'},1,'built',{allowed:true,source:'test'});library.approve(library.addBuilt(pitch,validated,{}),'test');}const g=new Gauntlet(store,library,new MockResultsSink());g.start({seed:1});for(let i=0;i<6000;i++)g.tick();const expected=scoreboard(store);expect(expected.designers.map(d=>d.login)).toEqual(['anonymous','lee','zoe']);expect(expected.designers.every(d=>d.score===100)).toBe(true);store.close();store=new Repository(openSqlite(path));expect(scoreboard(store)).toEqual(expected);}finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
