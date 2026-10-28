try{process.loadEnvFile('.env');}catch(error){if(error.code!=='ENOENT')throw error;}
const {authCli}=await import('../dist/auth.mjs');
try{await authCli(process.argv.includes('--check'));}catch(error){console.error(error.message);process.exitCode=1;}
