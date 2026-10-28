import {spawnSync} from 'node:child_process';
try{process.loadEnvFile('.env');}catch{}
const {loadTokens,tokenPath}=await import('../dist/oauth.mjs');
const [major,minor]=process.versions.node.split('.').map(Number);let failed=false;
function check(ok,label){console.log((ok?'✓ ':'✗ ')+label);if(!ok)failed=true;}
check(major>22||(major===22&&minor>=11),'Node 22.11 or newer');
for(const key of ['TWITCH_CLIENT_ID','TWITCH_CLIENT_SECRET','TWITCH_BROADCASTER_LOGIN','TWITCH_BOT_LOGIN'])check(!!process.env[key],key+' is configured');
try{const tokens=loadTokens(tokenPath());check(!!tokens.bot&&!!tokens.broadcaster,'Private token file contains both accounts');}catch{check(false,'Private token file is ready. Run npm run auth if needed.');}
try{const response=await fetch('https://id.twitch.tv/oauth2/validate',{signal:AbortSignal.timeout(5000)});check(response.status===401,'Twitch ID endpoint is reachable');}catch{check(false,'Twitch ID endpoint is reachable');}
check(spawnSync('codex',['--version'],{stdio:'ignore'}).status===0,'Codex CLI is installed');
console.log('Mock play needs no credentials. Use npm run demo.');if(failed)process.exitCode=1;
