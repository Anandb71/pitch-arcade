try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw Error('Could not load the local environment file.');}
if(process.argv.includes('--mock')){
 process.env.MOCK_TWITCH='1';process.env.MOCK_CODEX='1';process.env.OPENAI_API_KEY='';
 process.env.ARCADE_DB_PATH=process.env.ARCADE_DB_PATH||'data/demo.sqlite';
}
await import('../dist/server.mjs');
