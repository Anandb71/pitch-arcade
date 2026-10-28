import {afterEach,expect,test,vi} from 'vitest';
import {subscribeChat,createChatSender} from './live.js';
const auth={clientId:'test-client',token:'test-placeholder',broadcasterId:'b',botId:'u'};
afterEach(()=>vi.useRealTimers());
test('subscribes to chat using the welcomed websocket session',async()=>{
 const request=vi.fn(async(_url:Parameters<typeof fetch>[0],_init?:Parameters<typeof fetch>[1])=>new Response('{}',{status:202}));
 await subscribeChat('session',auth,request);
 expect(request.mock.calls[0]?.[0]).toBe('https://api.twitch.tv/helix/eventsub/subscriptions');
 expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body))).toMatchObject({type:'channel.chat.message',version:'1',transport:{method:'websocket',session_id:'session'},condition:{broadcaster_user_id:'b',user_id:'u'}});
});
test('chat sends stay at least one second apart and never expose response details',async()=>{
 vi.useFakeTimers();
 const times:number[]=[];
 const request=vi.fn(async()=>{times.push(Date.now());return new Response(JSON.stringify({data:[{is_sent:true}]}));});
 const sender=createChatSender(auth,request);
 const first=sender.send('one'),second=sender.send('two');
 await vi.advanceTimersByTimeAsync(1000);await Promise.all([first,second]);
 expect(times[1]!-times[0]!).toBeGreaterThanOrEqual(1000);sender.stop();
});
