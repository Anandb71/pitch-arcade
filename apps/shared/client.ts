import type {ArcadeState,GauntletState} from '../../packages/shared/src/protocol.js';
import type {Input} from '../../packages/engine/src/types.js';
export class ArcadeClient {
 state:ArcadeState|undefined;gauntlet:GauntletState|undefined;connected=false;hasControl=false;
 private socket:WebSocket|undefined;private disposed=false;private retry=0;private refreshTimer=0;
 constructor(private onState:(state:ArcadeState)=>void,private onGame:(state:GauntletState)=>void=()=>{},private player=false){this.connect();void this.refresh();}
 private connect():void{
  if(this.disposed)return;
  const socket=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/events');this.socket=socket;
  socket.onopen=()=>{this.connected=true;if(this.player)socket.send(JSON.stringify({type:'claim-player',control:'local'}));};
  socket.onmessage=event=>{
   const value=JSON.parse(String(event.data)) as {type:string;state?:ArcadeState|GauntletState;granted?:boolean};
   if(value.type==='gauntlet'){this.gauntlet=value.state as GauntletState;this.onGame(this.gauntlet);}
   else if(value.type==='arcade')this.accept(value.state as ArcadeState);
   else if(value.type==='player-control')this.hasControl=!!value.granted;
   else this.scheduleRefresh();
  };
  socket.onclose=()=>{this.connected=false;this.hasControl=false;if(!this.disposed)this.retry=window.setTimeout(()=>{this.connect();void this.refresh();},800);};
 }
 private accept(state:ArcadeState):void{this.state=state;this.gauntlet=state.gauntlet;this.onState(state);this.onGame(state.gauntlet);}
 private scheduleRefresh():void{if(!this.refreshTimer)this.refreshTimer=window.setTimeout(()=>{this.refreshTimer=0;void this.refresh();},80);}
 async refresh():Promise<void>{try{const response=await fetch('/api/state');if(response.ok)this.accept(await response.json() as ArcadeState);}catch{/* Reconnect retries preserve the last valid screen. */}}
 input(input:Input):void{if(this.hasControl&&this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'input',control:'local',input}));}
 dispose():void{this.disposed=true;clearTimeout(this.retry);clearTimeout(this.refreshTimer);this.socket?.close();}
}
