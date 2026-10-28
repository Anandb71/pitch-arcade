import type {Input} from '../../engine/src/types.js';
const clamp=(n:number,max:number)=>Math.max(0,Math.min(max,n));
export function logicalPointer(x:number,y:number,rect:{left:number;top:number;width:number;height:number}):{x:number;y:number}{
 return {x:clamp((x-rect.left)*960/rect.width,960),y:clamp((y-rect.top)*540/rect.height,540)};
}
export function skipGesture(previous:number,now:number,shift:boolean):boolean{return shift||now-previous<300;}
export class InputState {
 private keys=new Set<string>();private aim={x:480,y:270};private clicking=false;
 key(code:string,down:boolean):void{if(down)this.keys.add(code);else this.keys.delete(code);}
 pointer(point:{x:number;y:number},down?:boolean):void{this.aim=point;if(down!==undefined)this.clicking=down;}
 clear():void{this.keys.clear();this.clicking=false;}
 read():Input{
  const held=(...codes:string[])=>codes.some(code=>this.keys.has(code));
  return {x:Number(held('ArrowRight','KeyD'))-Number(held('ArrowLeft','KeyA')),y:Number(held('ArrowDown','KeyS'))-Number(held('ArrowUp','KeyW')),mash:held('Space')||this.clicking,click:this.clicking||held('Space'),pointer:{...this.aim}};
 }
}
export function bindInput(canvas:HTMLCanvasElement,onSkip:()=>void=()=>{}):{state:InputState;dispose:()=>void}{
 const state=new InputState(),controller=new AbortController(),signal=controller.signal;let previous=-Infinity;
 const key=(event:KeyboardEvent,down:boolean)=>{
  if(event.target instanceof HTMLElement&&['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code))event.preventDefault();
  if(down&&event.code==='KeyS'&&!event.repeat){const now=performance.now();if(skipGesture(previous,now,event.shiftKey))onSkip();previous=now;}
  state.key(event.code,down);
 };
 window.addEventListener('keydown',e=>key(e,true),{signal});window.addEventListener('keyup',e=>key(e,false),{signal});
 window.addEventListener('blur',()=>state.clear(),{signal});
 const point=(event:PointerEvent,down?:boolean)=>state.pointer(logicalPointer(event.clientX,event.clientY,canvas.getBoundingClientRect()),down);
 canvas.addEventListener('pointermove',e=>point(e),{signal});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);point(e,true);},{signal});
 canvas.addEventListener('pointerup',e=>point(e,false),{signal});
 canvas.addEventListener('pointercancel',()=>state.clear(),{signal});
 return {state,dispose:()=>{controller.abort();state.clear();}};
}
