export const roles=['broadcaster','mod','vip','sub','viewer'] as const;
export type Role=typeof roles[number];
export interface ChatMessage {id:string;userId:string;login:string;displayName:string;text:string;role:Role}
export type ChatHandler=(message:ChatMessage)=>Promise<void>;
export interface ChatSource {subscribe:(handler:ChatHandler)=>()=>void}
export class FakeChatSource implements ChatSource {
 private handlers=new Set<ChatHandler>();
 subscribe(handler:ChatHandler):()=>void {this.handlers.add(handler);return ()=>{this.handlers.delete(handler);};}
 async publish(message:ChatMessage):Promise<void>{for(const handler of this.handlers)await handler(message);}
}
