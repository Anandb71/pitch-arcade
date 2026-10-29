import type {Repository} from './storage.js';
import {rankScores,type ScoreEntry} from '../../../packages/shared/src/scoring.js';
export function scoreboard(store:Repository):{designers:ScoreEntry[];players:ScoreEntry[]}{
 const designers=store.db.all<ScoreEntry>(`SELECT u.login,sum(COALESCE(s.designer_points,CASE WHEN p.outcome='lose' THEN 100 ELSE 0 END)) AS score FROM plays p JOIN games g ON g.id=p.game_id JOIN users u ON u.twitch_id=g.author_id LEFT JOIN round_scores s ON s.play_id=p.id GROUP BY u.twitch_id HAVING score>0`);
 const runs=store.db.all<{login:string;score:number;simulated:number}>(`SELECT COALESCE(a.login,'streamer') AS login,COALESCE(a.simulated,0) AS simulated,sum(COALESCE(s.player_points,CASE WHEN p.outcome='win' THEN 100 ELSE 0 END)) AS score FROM gauntlets g JOIN plays p ON p.gauntlet_id=g.id LEFT JOIN gauntlet_players a ON a.gauntlet_id=g.id LEFT JOIN round_scores s ON s.play_id=p.id WHERE g.ended_at IS NOT NULL GROUP BY g.id HAVING score>0`);
 const highs=new Map<string,ScoreEntry>();for(const run of runs){const key=run.login+':'+run.simulated;if(!highs.has(key)||highs.get(key)!.score<run.score)highs.set(key,{login:run.login,score:run.score,simulated:!!run.simulated});}
 return {designers:rankScores(designers),players:rankScores([...highs.values()])};
}
