import {prepareJob,removeJob} from './jobs.js';
import {resolveCodex,sandboxSettings,verifySandbox} from './sandbox.js';
const dir=prepareJob({id:0,login:'preflight',text:'a harmless sandbox check'});
try{
 const install=resolveCodex();
 await verifySandbox(install.binary,dir,sandboxSettings(install.runtimeRoots),AbortSignal.timeout(15000));
 console.log('Codex 0.165 sandbox verified. Secret reads, protected writes and command network access are blocked.');
}finally{removeJob(dir);}
