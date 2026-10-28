try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw Error('Could not load the local environment file.');}
await import('../dist/forget.mjs');
