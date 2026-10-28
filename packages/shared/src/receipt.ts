export function receiptSummary(value:unknown):string{
 const r=value&&typeof value==='object'?value as Record<string,unknown>:{};
 if(r.source==='mock-codex')return 'Mock replay · '+(typeof r.durationMs==='number'?(r.durationMs/1000).toFixed(1):'?')+' s · '+(r.playtests??0)+' playtest'+(r.playtests===1?'':'s');
 if(r.source==='codex-cli'&&r.status==='completed'&&typeof r.durationMs==='number'&&typeof r.playtests==='number')return 'Built by Codex in '+Math.round(r.durationMs/1000)+' s, '+r.playtests+' playtest'+(r.playtests===1?'':'s');
 if(typeof r.source==='string'&&r.source.startsWith('seed library written'))return 'Seed library · validated across 40 seeds';
 return 'Receipt pending';
}
