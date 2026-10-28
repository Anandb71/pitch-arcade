try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw Error('Could not load the local environment file.');}
const configuredDb=process.env.ARCADE_DB_PATH;
if(process.argv.includes('--mock')){
 process.env.MOCK_TWITCH='1';process.env.MOCK_CODEX='1';process.env.OPENAI_API_KEY='';process.env.TWITCH_SIM='';
 process.env.ARCADE_DB_PATH=process.env.ARCADE_DB_PATH||'data/demo.sqlite';
}
if(process.argv.includes('--twitch-sim')){process.env.MOCK_TWITCH='1';process.env.MOCK_CODEX='1';process.env.OPENAI_API_KEY='';process.env.TWITCH_SIM='1';process.env.PITCH_COOLDOWN_MS='0';const {mkdirSync,mkdtempSync}=await import('node:fs');mkdirSync('data/twitch-sim-sessions',{recursive:true});process.env.ARCADE_DB_PATH=configuredDb||mkdtempSync('data/twitch-sim-sessions/session-')+'/arcade.sqlite';}
if(process.argv.includes('--auto')){
 const {mkdirSync,mkdtempSync}=await import('node:fs');mkdirSync('data/auto-sessions',{recursive:true});
 process.env.ARCADE_DB_PATH=configuredDb||mkdtempSync('data/auto-sessions/session-')+'/arcade.sqlite';
 process.env.MOCK_EVENTSUB_URL='';
 process.env.DEMO_AUTO='1';process.env.PITCH_COOLDOWN_MS='0';
 process.env.ARCADE_DB_PATH=process.env.ARCADE_DB_PATH||'data/demo-auto.sqlite';
}
await import('../dist/server.mjs');
