try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT'){console.error('Could not load the local environment file.');process.exit(1);}}
const {authCli,parseAuthArgs}=await import('../dist/auth.mjs');
try{await authCli(parseAuthArgs(process.argv.slice(2)));}catch(error){console.error(error.message);process.exitCode=1;}
