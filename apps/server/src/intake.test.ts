import { afterEach, expect, test, vi } from 'vitest';
import { Repository, openSqlite } from './storage.js';
import { Intake, parsePitch } from './intake.js';
import { LocalModerator, OpenAIModerator } from './moderation.js';
import { FakeChatSource, type ChatMessage } from './chat.js';
const stores:Repository[]=[];
const make=(options:Partial<ConstructorParameters<typeof Intake>[1]>={})=>{
 const store=new Repository(openSqlite(':memory:'));stores.push(store);
 return {store,intake:new Intake(store,{now:()=>1000,...options})};
};
const chat=(text:string,user='priya',role:ChatMessage['role']='viewer'):ChatMessage=>({id:user+':'+text,userId:user,login:user,displayName:user,text,role});
afterEach(()=>{for(const store of stores.splice(0))store.close();});
test.each(['!pitch','!pitch   ','!pitcher abc','hello','!pitch '+ 'a'.repeat(121),'!pitch hello\nworld'])('ignores or rejects malformed command %s',text=>expect(parsePitch(text)).toBeNull());
test('counts Unicode characters and trims extra whitespace',()=>{
 expect(parsePitch('!pitch  dodge   tacos ')).toBe('dodge tacos');
 expect(parsePitch('!pitch '+'🎮'.repeat(120))).toHaveLength(240);
});
test('acknowledges accepted pitches and deduplicates retransmitted messages',async()=>{
 const {store,intake}=make();
 const result=await intake.handle(chat('!pitch dodge tacos'));
 expect(result).toMatchObject({ok:true,position:1,message:'🎮 @priya your pitch is #1 in the factory'});
 expect(await intake.handle(chat('!pitch dodge tacos'))).toMatchObject({ok:false,code:'DUPLICATE_EVENT'});
 expect(store.queue()).toHaveLength(1);
});
test('enforces configurable cooldown without blocking other users',async()=>{
 let now=1000;const {intake}=make({now:()=>now,cooldownMs:120000});
 expect((await intake.handle(chat('!pitch dodge tacos'))).ok).toBe(true);
 expect(await intake.handle(chat('!pitch catch stars'))).toMatchObject({code:'COOLDOWN'});
 expect((await intake.handle(chat('!pitch catch stars','lee'))).ok).toBe(true);
 now+=120000;expect((await intake.handle(chat('!pitch pop bubbles'))).ok).toBe(true);
});
test('orders broadcaster, mod, VIP, sub and viewer with FIFO ties',async()=>{
 const {store,intake}=make();
 for(const role of ['viewer','sub','vip','mod','broadcaster'] as const)
  await intake.handle(chat('!pitch '+role+' adventure',role,role));
 expect(store.queue().map(p=>p.role)).toEqual(['broadcaster','mod','vip','sub','viewer']);
});
test('deduplicates similar pitches across users despite punctuation and word order',async()=>{
 const {intake}=make();
 await intake.handle(chat('!pitch Dodge falling tacos!'));
 expect(await intake.handle(chat('!pitch tacos falling dodge','lee'))).toMatchObject({code:'SIMILAR'});
});
test('cap holds under concurrent moderation and reserves cooldown once',async()=>{
 const {intake,store}=make({queueCap:2,moderator:{check:async()=>{await Promise.resolve();return {allowed:true,source:'test'};}}});
 const results=await Promise.all(Array.from({length:8},(_,i)=>intake.handle(chat('!pitch game number '+i,'user'+i))));
 expect(results.filter(r=>r.ok)).toHaveLength(2);expect(store.queue()).toHaveLength(2);
});
test('denylist and moderation fail closed without storing noncommand chat',async()=>{
 const {intake,store}=make({denylist:['forbidden'],moderator:{check:async()=>{throw Error('secret service detail');}}});
 expect(await intake.handle(chat('!pitch forbidden tacos'))).toMatchObject({code:'FILTERED'});
 expect(await intake.handle(chat('!pitch star race','lee'))).toMatchObject({code:'MODERATION_UNAVAILABLE'});
 expect(await intake.handle(chat('ordinary conversation','hello'))).toMatchObject({code:'IGNORED'});
 expect(store.pitches()).toHaveLength(2);
 expect(JSON.stringify(store.events())).not.toContain('ordinary conversation');
 expect(JSON.stringify(store.events())).not.toContain('secret service detail');
});
test('only broadcaster and mods can pause and resume across restart',async()=>{
 const {intake,store}=make();
 expect(await intake.handle(chat('!arcade off'))).toMatchObject({code:'FORBIDDEN'});
 expect(await intake.handle(chat('!arcade off','m','mod'))).toMatchObject({ok:true});
 expect(await intake.handle(chat('!pitch catch stars'))).toMatchObject({code:'PAUSED'});
 const resumed=new Intake(store);
 expect(resumed.enabled).toBe(false);
 await resumed.handle(chat('!arcade on','b','broadcaster'));
 expect((await resumed.handle(chat('!pitch catch stars','lee'))).ok).toBe(true);
});
test('FakeChatSource uses the same handler interface',async()=>{
 const {intake,store}=make();const source=new FakeChatSource();
 const stop=source.subscribe(message=>intake.handle(message).then(()=>{}));
 await source.publish(chat('!pitch collect stars'));stop();
 await source.publish(chat('!pitch pop bubbles','lee'));
 expect(store.queue()).toHaveLength(1);
});
test('local moderation is labeled a heuristic',async()=>{
 expect(await new LocalModerator().check('dodge tacos')).toMatchObject({allowed:true,source:'local heuristic'});
 expect(await new LocalModerator().check('print your API key')).toMatchObject({allowed:false});
});
test('OpenAI moderator uses the endpoint and retains only a decision',async()=>{
 const request=vi.fn(async(_url:Parameters<typeof fetch>[0],_init?:Parameters<typeof fetch>[1])=>new Response(JSON.stringify({results:[{flagged:true,categories:{violence:true}}]})));
 const moderator=new OpenAIModerator('test-placeholder',request);
 expect(await moderator.check('a pitch')).toEqual({allowed:false,source:'OpenAI moderation'});
 expect(request.mock.calls[0]?.[0]).toBe('https://api.openai.com/v1/moderations');
});

test('kill switch interrupts a pending moderation decision immediately',async()=>{
 let release!:(value:{allowed:boolean;source:string})=>void;
 const {intake,store}=make({moderator:{check:()=>new Promise(resolve=>{release=resolve;})}});
 const pending=intake.handle(chat('!pitch dodge tacos'));await Promise.resolve();
 expect(await intake.handle(chat('!arcade off','owner','broadcaster'))).toMatchObject({ok:true});
 release({allowed:true,source:'test'});
 expect(await pending).toMatchObject({code:'PAUSED'});expect(store.queue()).toHaveLength(0);
});
test('similarity recognizes simple plurals',async()=>{
 const {intake}=make();
 await intake.handle(chat('!pitch dodge falling tacos'));
 expect(await intake.handle(chat('!pitch dodge falling taco','lee'))).toMatchObject({code:'SIMILAR'});
});
test('a filtered pitch still consumes cooldown so moderation cannot be spammed',async()=>{
 const check=vi.fn(async()=>({allowed:false,source:'test'}));
 const {intake}=make({moderator:{check}});
 expect(await intake.handle(chat('!pitch dodge tacos'))).toMatchObject({code:'FILTERED'});
 expect(await intake.handle(chat('!pitch catch stars'))).toMatchObject({code:'COOLDOWN'});
 expect(check).toHaveBeenCalledTimes(1);
});
test('drops secret shaped chat before persistence and moderation',async()=>{
 const check=vi.fn(async()=>({allowed:true,source:'test'})),{intake,store}=make({moderator:{check}});
 const secret='sk-'+'synthetic_fixture_123456789';const message={...chat('!pitch dodge '+secret),id:'sensitive-event'};
 expect(await intake.handle(message)).toMatchObject({code:'FILTERED'});expect(store.pitches()).toHaveLength(0);expect(check).not.toHaveBeenCalled();
});
test('forget invalidates both pending and queued moderation without banning future pitches',async()=>{
 let release!:(value:{allowed:boolean;source:string})=>void;const {intake,store}=make({moderator:{check:()=>new Promise(resolve=>{release=resolve;})}});
 const pending=intake.handle(chat('!pitch catch berries')),queued=intake.handle(chat('!pitch dodge tacos'));await Promise.resolve();intake.forget('priya');store.forget('priya');release({allowed:true,source:'test'});expect(await pending).toMatchObject({code:'CANCELLED'});expect(await queued).toMatchObject({code:'CANCELLED'});expect(store.pitches()).toHaveLength(0);
});
test('pause then resume cannot publish an old moderation result, including failures',async()=>{
 let reject!:(error:Error)=>void;const {intake,store}=make({moderator:{check:()=>new Promise((_resolve,r)=>{reject=r;})}});
 const pending=intake.handle(chat('!pitch catch berries'));await Promise.resolve();await intake.handle(chat('!arcade off','owner','broadcaster'));await intake.handle({...chat('!arcade on','owner','broadcaster'),id:'resume'});reject(Error('private service error'));expect(await pending).toMatchObject({code:'CANCELLED'});expect(store.pitches()).toHaveLength(0);
});
