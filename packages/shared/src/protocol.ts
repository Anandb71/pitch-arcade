import type {GameSpec,Input} from '../../engine/src/types.js';
import type {Snapshot} from '../../engine/src/engine.js';
import type {Report} from '../../harness/src/report.js';
export interface Difficulty {humanishWinRate:number;idleWinRate:number;randomWinRate:number;challenge:number}
export interface ArcadeGame {
 id:number;pitchId:number|null;title:string;verb:string;authorId:string|null;authorLogin:string;classic:boolean;approvedAt:number;
 status:'built'|'approved'|'rejected';spec:GameSpec;report:Report;difficulty:Difficulty;receipt:unknown;
}
export interface RoundGame {id:number;title:string;verb:string;spec:GameSpec;authorId:string|null;authorLogin:string;classic:boolean}
export type Phase='idle'|'title'|'countdown'|'play'|'result'|'finished';
export type PlayOutcome='win'|'lose'|'skip';
export interface RoundResult {gameId:number;title:string;designer:string;outcome:PlayOutcome;round:number;ms:number;playerPoints:number;designerPoints:number;combo:number}
export interface GauntletState {
 id:number|null;revision:number;phase:Phase;phaseFrames:number;round:number;total:number;lives:number;score:number;
 points:number;combo:number;countdown:number;speedPercent:number;seed:number;autoplay:boolean;
 game:RoundGame|null;snapshot:Snapshot|null;pointer:{x:number;y:number}|null;outcomes:RoundResult[];
 lastOutcome:PlayOutcome|null;reason:'complete'|'out_of_lives'|'stopped'|null;
}
export interface ClipRequest {title:string;gameId:number;gauntletId:number;playId:number;authorId:string|null}
export interface ResultItem {id:number;kind:'clip'|'chat';text:string;authorId:string|null;simulated:boolean}
export interface PublicStep {pitchId:number;kind:string;label:string;simulated:boolean}
export interface PublicPitch {id:number;login:string;text:string;status:string;role:string}
export interface PublicBuild {id:number;pitch_id:number;model:string;status:string;receipt_json:string|null}
export interface Settings {autoApproveMods:boolean;autoApproveVips:boolean;denylist:string[]}
export interface Leader {login:string;beats:number;gamesApproved:number}
export interface ArcadeState {
 scoreboards:{designers:import('./scoring.js').ScoreEntry[];players:import('./scoring.js').ScoreEntry[]};enabled:boolean;mockTwitch:boolean;mockCodex:boolean;pitches:PublicPitch[];games:ArcadeGame[];steps:PublicStep[];
 acks:string[];builds:PublicBuild[];gauntlet:GauntletState;leaderboard:Leader[];resultTicker:ResultItem[];settings:Settings;
}
export type ServerEvent={type:'gauntlet';state:GauntletState}|{type:'arcade';state:ArcadeState}|{type:string;[key:string]:unknown};
export type PlayerEvent={type:'claim-player';control:'local'}|{type:'input';control:'local';input:Input};
