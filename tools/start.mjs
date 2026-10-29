const video=process.argv.includes('--video');
try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw Error('Could not load the local environment file.');}
const configuredDb=process.env.ARCADE_DB_PATH;
if(process.argv.includes('--mock')||video){
 process.env.MOCK_TWITCH='1';process.env.MOCK_CODEX='1';process.env.OPENAI_API_KEY='';process.env.TWITCH_SIM='';
 process.env.ARCADE_DB_PATH=process.env.ARCADE_DB_PATH||'data/demo.sqlite';
}
if(process.argv.includes('--twitch-sim')){process.env.MOCK_TWITCH='1';process.env.MOCK_CODEX='1';process.env.OPENAI_API_KEY='';process.env.TWITCH_SIM='1';process.env.PITCH_COOLDOWN_MS='0';const {mkdirSync,mkdtempSync}=await import('node:fs');mkdirSync('data/twitch-sim-sessions',{recursive:true});process.env.ARCADE_DB_PATH=configuredDb||mkdtempSync('data/twitch-sim-sessions/session-')+'/arcade.sqlite';}
if(process.argv.includes('--auto')||video){
 const {mkdirSync,mkdtempSync}=await import('node:fs');mkdirSync('data/auto-sessions',{recursive:true});
 process.env.ARCADE_DB_PATH=configuredDb||mkdtempSync('data/auto-sessions/session-')+'/arcade.sqlite';
 process.env.MOCK_EVENTSUB_URL='';
 process.env.DEMO_AUTO='1';process.env.PITCH_COOLDOWN_MS='0';
 process.env.ARCADE_DB_PATH=process.env.ARCADE_DB_PATH||'data/demo-auto.sqlite';
}
if(video){process.env.DEMO_AUTO='';process.env.DEMO_VIDEO='1';process.env.DEMO_VIDEO_HOLD=process.argv.includes('--hold')?'1':'';process.env.DEMO_VIDEO_SEED=process.argv.find(arg=>arg.startsWith('--seed='))?.slice(7)||'8';process.env.MOCK_EVENTSUB_URL='';process.env.FACTORY_MAX_JOBS_PER_HOUR='100';}
await import('../dist/server.mjs');
