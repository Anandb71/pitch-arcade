export interface ModerationDecision {allowed:boolean;source:string}
export interface Moderator {check:(text:string)=>Promise<ModerationDecision>}
export const defaultDenylist=['nazi','kill yourself','rape'];
export const unsafeInstructions=/ignore (?:all |your |previous )?instructions|print (?:your |the )?(?:api key|secret|token)|<script|https?:\/\/|\b(?:api[_ ]?key|access[_ ]?token)\b/i;
export class LocalModerator implements Moderator {
 async check(text:string):Promise<ModerationDecision>{
  return {allowed:!unsafeInstructions.test(text),source:'local heuristic'};
 }
}
export class OpenAIModerator implements Moderator {
 constructor(private key:string,private request:typeof fetch=fetch){}
 async check(text:string):Promise<ModerationDecision>{
  const response=await this.request('https://api.openai.com/v1/moderations',{
   method:'POST',headers:{Authorization:'Bearer '+this.key,'Content-Type':'application/json'},
   body:JSON.stringify({model:'omni-moderation-latest',input:text}),signal:AbortSignal.timeout(5000)
  });
  if(!response.ok)throw Error('Moderation unavailable.');
  const body=await response.json() as {results?:{flagged?:unknown}[]};
  const flagged=body.results?.[0]?.flagged;
  if(typeof flagged!=='boolean')throw Error('Moderation unavailable.');
  return {allowed:!flagged,source:'OpenAI moderation'};
 }
}
export function moderatorFromEnv(env:NodeJS.ProcessEnv=process.env):Moderator {
 return env.OPENAI_API_KEY?new OpenAIModerator(env.OPENAI_API_KEY):new LocalModerator();
}
