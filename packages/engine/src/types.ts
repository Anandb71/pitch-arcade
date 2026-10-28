export type Control = 'move_lr' | 'move_4' | 'click' | 'mash';
export type Motion = 'fall' | 'rise' | 'sweep' | 'bounce' | 'chase' | 'flee' | 'still' | 'popup';
export type Role = 'hazard' | 'goal' | 'target' | 'decor';
export type Size = 's' | 'm' | 'l';
export type Mod = 'wind_left' | 'wind_right' | 'mirror' | 'spotlight' | 'floor_lava' | 'speedup';
export interface Spawner {
 emoji: string; role: Role; from: 'top' | 'bottom' | 'left' | 'right' | 'edges' | 'random' | 'center';
 every: number | 'once'; max: number; motion: Motion; speed: number; size: Size;
}
export type Win = {type:'survive'} | {type:'collect'; n:number; role?:'goal'} | {type:'reach';role?:'goal'} | {type:'hit';n:number;role?:'target'} | {type:'mash';n:number};
export interface GameSpec {
 v:1; title:string; verb:string; seconds:number; palette:string; pattern:string;
 player:{emoji:string;control:Control;speed:number;size:Size};
 spawners:Spawner[]; win:Win; lose:{type:'touch';role:Role} | {type:'timeout'};
 mods:Mod[]; sfx:'pop'|'boom'|'ding'|'none';
}
export interface Input { x?:number; y?:number; pointer?:{x:number;y:number}; click?:boolean; mash?:boolean }
export type Outcome = 'playing' | 'win' | 'lose';
export interface Entity {
 id:number; emoji:string; role:Role; x:number; y:number; vx:number; vy:number; radius:number;
 motion:Motion; speed:number; born:number; spawner:number;
}
