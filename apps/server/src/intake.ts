import type {ChatMessage} from './chat.js';
import {roles} from './chat.js';
import {defaultDenylist,LocalModerator,type Moderator} from './moderation.js';
import {Repository} from './storage.js';
export interface IntakeOptions {cooldownMs?:number;queueCap?:number;denylist?:string[];getDenylist?:()=>readonly string[];moderator?:Moderator;now?:()=>number;onToggle?:(enabled:boolean)=>void}
export interface IntakeResult {ok:boolean;code:string;message?:string;pitchId?:number;position?:number}
export function parsePitch(text:string):string|null {
 const match=/^!pitch\s+(.+)$/iu.exec(text);
 if(!match||/[\r\n\x00-\x1f]/.test(text))return null;
 const pitch=match[1]!.normalize('NFKC').trim().replace(/\s+/g,' ');
 return pitch&&[...pitch].length<=120?pitch:null;
}
function similar(a:string,b:string):boolean {
 const tokens=(s:string)=>{const words=s.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu);return new Set(words?.map(w=>w.length>3?w.replace(/s$/,''):w)??[s]);};
 const x=tokens(a),y=tokens(b),intersection=[...x].filter(w=>y.has(w)).length;
 return intersection/(x.size+y.size-intersection)>=.8;
}
export class Intake {
 private stopped=false;
 stop():void{this.stopped=true;}
 async idle():Promise<void>{await this.tail;}
 private tail:Promise<unknown>=Promise.resolve();
 private seenCommands=new Set<string>();
 readonly moderator:Moderator;
 constructor(private store:Repository,private options:IntakeOptions={}){
  this.moderator=options.moderator??new LocalModerator();
 }
 get enabled():boolean{return this.store.enabled;}
 handle(message:ChatMessage):Promise<IntakeResult> {
  if(/^!arcade\s+(on|off)\s*$/i.test(message.text))return this.accept(message);
  const next=this.tail.then(()=>this.accept(message));this.tail=next.catch(()=>{});return next;
 }
 private async accept(message:ChatMessage):Promise<IntakeResult>{
  const fail=(code:string):IntakeResult=>({ok:false,code});
  if(this.stopped)return fail('PAUSED');
  if(!/^[a-z0-9_]{1,25}$/i.test(message.login)||!message.userId||message.userId.length>64||message.id.length>200||!roles.includes(message.role))return fail('INVALID_USER');
  const command=/^!arcade\s+(on|off)\s*$/i.exec(message.text);
  if(command){
   if(!['broadcaster','mod'].includes(message.role))return fail('FORBIDDEN');
   if(this.seenCommands.has(message.id))return fail('DUPLICATE_EVENT');
   this.seenCommands.add(message.id);
   if(this.seenCommands.size>1000)this.seenCommands.delete(this.seenCommands.values().next().value!);
   this.store.enabled=command[1]!.toLowerCase()==='on';
   this.options.onToggle?.(this.enabled);
   this.store.event('arcade.toggle',{enabled:this.enabled});
   return {ok:true,code:'TOGGLED',message:this.enabled?'The arcade is on.':'The arcade is paused.'};
  }
  const text=parsePitch(message.text);
  if(!text)return fail('IGNORED');
  if(this.store.seen(message.id))return fail('DUPLICATE_EVENT');
  if(this.stopped||!this.enabled)return fail('PAUSED');
  const now=(this.options.now??Date.now)(),last=this.store.lastPitch(message.userId);
  if(last!==undefined&&now-last<(this.options.cooldownMs??120000))return fail('COOLDOWN');
  if(this.store.active().length>=(this.options.queueCap??20))return fail('QUEUE_FULL');
  if(this.store.pitches().some(p=>['queued','building','built','approved'].includes(p.status)&&p.created_at>now-600000&&similar(p.text,text)))return fail('SIMILAR');
  const clean={...message,text,displayName:message.displayName.replace(/[\x00-\x1f]/g,'').slice(0,50)};
  const denied=()=>(this.options.getDenylist?.()??this.options.denylist??defaultDenylist).some(word=>text.toLowerCase().includes(word.toLowerCase()));
  let decision;
  try{decision=denied()?{allowed:false,source:'local denylist'}:await this.moderator.check(text);}
  catch{
   this.store.addPitch(clean,now,'filtered',{allowed:false,source:'moderation unavailable'},'MODERATION_UNAVAILABLE');
   return fail('MODERATION_UNAVAILABLE');
  }
  if(this.stopped||!this.enabled)return fail('PAUSED');
  if(denied())decision={allowed:false,source:'local denylist'};
  const pitch=this.store.addPitch(clean,now,decision.allowed?'queued':'filtered',decision,decision.allowed?null:'FILTERED');
  this.store.event(decision.allowed?'pitch.queued':'pitch.filtered',{pitchId:pitch.id},now,message.userId);
  if(!decision.allowed)return fail('FILTERED');
  const position=this.store.queue().findIndex(p=>p.id===pitch.id)+1;
  return {ok:true,code:'QUEUED',pitchId:pitch.id,position,message:'🎮 @'+message.login+' your pitch is #'+position+' in the factory'};
 }
}
