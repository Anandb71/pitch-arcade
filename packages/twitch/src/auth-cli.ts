import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {authorizationUrl,loadTokens,saveTokens,tokenPath,TokenManager,type Account,type Tokens} from './oauth.js';
export async function authCli(check=false):Promise<void>{
 const clientId=process.env.TWITCH_CLIENT_ID,clientSecret=process.env.TWITCH_CLIENT_SECRET;
 if(!clientId||!clientSecret)throw Error('Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env first.');
 const path=tokenPath();let tokens:Tokens={};try{tokens=loadTokens(path);}catch{if(check)throw Error('No private Twitch token file found. Run npm run auth.');}
 const manager=new TokenManager({clientId,clientSecret,tokens,save:value=>saveTokens(path,value)});
 if(check){for(const role of ['broadcaster','bot'] as const){await manager.validate(role);console.log(role+' scopes: '+manager.account(role).scopes.join(', '));}return;}
 const redirect='http://localhost:8787/callback';console.log('Register this redirect URL in your Twitch app: '+redirect);
 for(const role of ['broadcaster','bot'] as const){
  const login=process.env[role==='bot'?'TWITCH_BOT_LOGIN':'TWITCH_BROADCASTER_LOGIN'];if(!login)throw Error('Set both Twitch login names in .env.');
  await authorize(role,login,redirect,clientId,manager);
 }
 console.log('Both accounts are connected. Tokens were saved privately outside the project.');
}
async function authorize(role:Account,login:string,redirect:string,client:string,manager:TokenManager):Promise<void>{
 const state=randomBytes(32).toString('hex');
 await new Promise<void>((resolve,reject)=>{
  let busy=false;const server=createServer((req,res)=>{
   const url=new URL(req.url??'/','http://localhost:8787');res.setHeader('Content-Type','text/plain');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
   const received=url.searchParams.get('state')??'';
   if(req.headers.host!=='localhost:8787'||url.pathname!=='/callback'||!/^[a-f0-9]{64}$/.test(received)||!timingSafeEqual(Buffer.from(received),Buffer.from(state))||busy){res.writeHead(400);res.end('Authorization could not be verified. Use the printed URL.');return;}
   busy=true;const code=url.searchParams.get('code');
   if(!code){res.end('Twitch authorization was declined.');done(Error('Authorization was declined.'));return;}
   void manager.exchange(role,code,redirect,login).then(()=>{res.end('Connected. You can close this tab.');done();},()=>{res.end('Account did not match. Check your Twitch login and try again.');done(Error('Twitch account did not match the configured login.'));});
  });
  const timer=setTimeout(()=>done(Error('Authorization timed out. Run npm run auth again.')),300000);
  const done=(error?:Error)=>{clearTimeout(timer);server.close();error?reject(error):resolve();};
  server.once('error',()=>done(Error('Port 8787 is busy. Close the other authorization window.')));
  server.listen(8787,'localhost',()=>{console.log('Sign in as '+login+' for the '+role+' account, then open:');console.log(authorizationUrl(client,redirect,state,role,process.env.TWITCH_STRETCH==='1'));});
 });
}
