import {createServer} from 'node:http';
export async function startFakeHelix(){
 const calls:{path:string;body:Record<string,unknown>}[]=[];let clips=0;const clipTitles=new Map<string,string>();
 const server=createServer(async(req,res)=>{try{
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192){res.writeHead(413);res.end();return;}}
  const body=raw?JSON.parse(raw) as Record<string,unknown>:{};const url=new URL(req.url!,'http://localhost');calls.push({path:url.pathname,body});res.setHeader('Content-Type','application/json');res.setHeader('Ratelimit-Remaining','100');
  if(url.pathname==='/clips'&&req.method==='POST'){const id='Simulated'+(++clips);clipTitles.set(id,url.searchParams.get('title')??'');res.end(JSON.stringify({data:[{id}]}));}
  else if(url.pathname==='/clips'){const id=url.searchParams.get('id');res.end(JSON.stringify({data:id&&clipTitles.has(id)?[{id,url:'https://clips.twitch.tv/'+id,title:clipTitles.get(id)}]:[]}));}
  else if(url.pathname==='/chat/messages')res.end(JSON.stringify({data:[{is_sent:true,message_id:'simulated-'+calls.length}]}));
  else if(url.pathname==='/eventsub/subscriptions')res.end(JSON.stringify({data:[{id:'simulated-subscription',status:'enabled'}]}));
  else{res.writeHead(404);res.end('{}');}
 }catch{res.writeHead(400);res.end('{}');}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('Fake Helix could not bind.');
 return {url:'http://127.0.0.1:'+address.port,calls,close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}};
}
