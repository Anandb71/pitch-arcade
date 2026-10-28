import type {ClipRequest,ResultItem} from '../../../packages/shared/src/protocol.js';
export interface ResultsSink {
 gauntletFinished?:(score:number,lives:number)=>Promise<void>|void;
 items?:ResultItem[];subscribe?:(listener:(item:ResultItem)=>void)=>()=>void;forget?:(ids:Set<string>)=>void;
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

export class RealResultsSink implements ResultsSink {
 readonly items:ResultItem[]=[];private forgotten=new Set<string>();private nextId=1;private listeners=new Set<(item:ResultItem)=>void>();
 constructor(private helix:import('../../../packages/twitch/src/helix.js').HelixClient,private simulated=false){}
 subscribe(listener:(item:ResultItem)=>void):()=>void{this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
 private add(kind:ResultItem['kind'],text:string,authorId:string|null):void{if(authorId&&this.forgotten.has(authorId))return;const item={id:this.nextId++,kind,text,authorId,simulated:this.simulated};this.items.push(item);if(this.items.length>50)this.items.shift();for(const listener of this.listeners)listener(item);}
 async gauntletFinished(score:number,lives:number):Promise<void>{try{await this.helix.marker('Pitch Arcade: '+score+' wins, '+lives+' lives left.');}catch{/* Optional marker failures never interrupt play. */}}
 async requestClip(request:ClipRequest):Promise<void>{try{const url=await this.helix.createClip(request.title);this.add('clip',request.title+' '+url,request.authorId);await this.chat(request.title+' '+url,request.authorId);}catch{this.add('clip','Clip could not be created. The arcade keeps playing.',request.authorId);}}
 async chat(text:string,authorId:string|null):Promise<void>{if(authorId&&this.forgotten.has(authorId))return;try{await this.helix.sendChat(text);this.add('chat',text,authorId);}catch{this.add('chat','Chat could not be sent. The arcade keeps playing.',authorId);}}
 forget(ids:Set<string>):void{for(const id of ids)this.forgotten.add(id);for(let i=this.items.length-1;i>=0;i--)if(this.items[i]!.authorId&&ids.has(this.items[i]!.authorId!))this.items.splice(i,1);}
}
