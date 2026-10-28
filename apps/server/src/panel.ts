export function panel(mock:boolean):string{return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pitch Arcade factory</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#101019;color:#f6f5ff}
body{max-width:1100px;margin:40px auto;padding:0 24px}h1{font-size:42px;margin:0}.eyebrow{color:#a8ff60;font-weight:700;letter-spacing:3px}
section{background:#1c1c2c;border:1px solid #36364d;border-radius:16px;padding:24px;margin-top:22px}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}
input,select,textarea,button{font:inherit;border-radius:8px;padding:10px;border:1px solid #575775;background:#25253a;color:inherit}
textarea{display:block;box-sizing:border-box;width:100%;margin:14px 0;min-height:75px}button{background:#bcfa75;color:#131b09;cursor:pointer;font-weight:650}
button.secondary{background:#34344f;color:white}p,li,pre{line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}
.card{border-top:1px solid #41415a;padding:15px 0}.muted{color:#b7b7ce}#feedback{color:#a8ff60;min-height:24px}
@media(max-width:750px){.columns{grid-template-columns:1fr}body{margin:20px auto}}
</style></head><body>
<p class="eyebrow">PITCH ARCADE</p><h1>Your chat makes the games.</h1>
<p class="muted">Factory controls and game approvals. ${mock?'Simulated chat and factory receipts are clearly labeled.':'Connected chat uses verified EventSub messages.'}</p>
<section><div class="row"><strong id="status">Loading factory</strong><button id="toggle" class="secondary">Pause arcade</button></div>
${mock?`<h2>Try a chat pitch</h2><div class="row"><label>User <input id="login" value="priya" maxlength="25"></label>
<label>Role <select id="role"><option>viewer</option><option>sub</option><option>vip</option><option>mod</option><option>broadcaster</option></select></label></div>
<textarea id="pitch" maxlength="200">!pitch dodge falling tacos</textarea><button id="send">Send mock chat</button>
<p class="muted">Use !arcade off or !arcade on as a mod or broadcaster to control the arcade.</p>`:`<p>Chat arrives through EventSub. The mock chat endpoint is disabled.</p>`}
<p id="feedback" aria-live="polite"></p></section>
<div class="columns"><section><h2>Pitch queue</h2><div id="queue"></div></section>
<section><h2>Factory floor</h2><div id="steps"></div></section></div>
<section><h2>Ready for your approval</h2><div id="review"></div></section>
<section><h2>Approved library</h2><div id="library"></div></section>
<script>
const el=id=>document.getElementById(id);
const line=(parent,text,tag='p')=>{const node=document.createElement(tag);node.textContent=text;parent.appendChild(node);return node};
let enabled=true;
async function post(path,body){
 const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Arcade-Control':'local'},...(body?{body:JSON.stringify(body)}:{})});
 const value=await response.json();if(!response.ok)throw Error(value.error||'That action could not finish.');return value;
}
async function refresh(){
 const state=await (await fetch('/api/state')).json();enabled=state.enabled;
 el('status').textContent=enabled?'The arcade is on':'The arcade is paused';
 el('toggle').textContent=enabled?'Pause arcade':'Resume arcade';
 for(const id of ['queue','steps','review','library'])el(id).replaceChildren();
 if(!state.pitches.length)line(el('queue'),'The first pitch starts the factory.');
 for(const pitch of state.pitches.slice(-20).reverse())line(el('queue'),'#'+pitch.id+' by @'+pitch.login+': '+pitch.text+' ('+pitch.status+')');
 for(const step of state.steps.slice(-12).reverse())line(el('steps'),(step.simulated?'Simulated: ':'')+'#'+step.pitchId+' '+step.label);
 for(const game of state.games){
  if(game.status==='rejected')continue;
  const target=el(game.status==='built'?'review':'library'),card=line(target,'','div');card.className='card';
  line(card,game.title+' · '+game.verb,'strong');
  line(card,'Humanish wins '+Math.round(game.difficulty.humanishWinRate*100)+'% over 40 seeds.');
  if(game.status==='built'){
   for(const action of ['approve','reject']){const button=line(card,action==='approve'?'Approve game':'Reject game','button');
    button.onclick=async()=>{try{await post('/api/games/'+game.id+'/'+action);await refresh();}catch(error){el('feedback').textContent=error.message;}};}
  }
  const details=line(card,'','details');line(details,'View receipt','summary');line(details,JSON.stringify(game.receipt,null,2),'pre');
 }
}
el('toggle').onclick=async()=>{await post('/api/arcade',{enabled:!enabled});await refresh();};
if(el('send'))el('send').onclick=async()=>{
 try{const result=await post('/api/mock/chat',{login:el('login').value,role:el('role').value,text:el('pitch').value});
 el('feedback').textContent=result.message||({'COOLDOWN':'Give that designer a moment before another pitch.','SIMILAR':'A similar pitch is already in the factory.','QUEUE_FULL':'The factory is full. Try again shortly.','FILTERED':'That pitch did not pass the content check.','PAUSED':'The arcade is paused.'}[result.code]||result.code);await refresh();}
 catch(error){el('feedback').textContent=error.message;}
};
const socket=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/events');
socket.onmessage=()=>refresh().catch(()=>{});
setInterval(()=>refresh().catch(()=>{}),1500);
refresh().catch(()=>{el('feedback').textContent='The server is taking a moment.';});
</script></body></html>`;}
