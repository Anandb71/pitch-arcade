import type {ClipRequest,ResultItem} from '../../../packages/shared/src/protocol.js';
export interface ResultsSink {
 requestClip:(request:ClipRequest)=>Promise<void>|void;
 chat:(text:string,authorId:string|null)=>Promise<void>|void;
}
export class MockResultsSink implements ResultsSink {
 readonly items:ResultItem[]=[];private nextId=1;
 constructor(private emit:(item:ResultItem)=>void=()=>{}){}
 private add(kind:ResultItem['kind'],text:string,authorId:string|null):void{
  const item={id:this.nextId++,kind,text,authorId,simulated:true};
  this.items.push(item);if(this.items.length>50)this.items.shift();this.emit(item);
 }
 requestClip(request:ClipRequest):void{this.add('clip',request.title,request.authorId);}
 chat(text:string,authorId:string|null):void{this.add('chat',text,authorId);}
 forget(ids:Set<string>):void{for(let i=this.items.length-1;i>=0;i--)if(this.items[i]!.authorId&&ids.has(this.items[i]!.authorId!))this.items.splice(i,1);}
}
