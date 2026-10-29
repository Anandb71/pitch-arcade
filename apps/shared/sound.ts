import {SynthSfx} from '../../packages/render/src/audio.js';
import {node} from './dom.js';
export function soundControls(defaultOn:boolean):{audio:SynthSfx;element:HTMLElement}{
 const audio=new SynthSfx(),query=new URLSearchParams(location.search).get('sound');audio.enabled=query===null?defaultOn:query==='1';
 const element=node('div','sound-controls'),mute=node('button','secondary',audio.enabled?'Sound on':'Sound off'),label=node('label','volume-label','VOL'),volume=node('input');volume.type='range';volume.min='0';volume.max='100';volume.value='35';volume.setAttribute('aria-label','Sound volume');label.append(volume);element.append(mute,label);
 const update=()=>{mute.textContent=audio.enabled?'Sound on':'Sound off';mute.setAttribute('aria-pressed',String(audio.enabled));};update();
 mute.onclick=()=>{if(audio.enabled)audio.enabled=false;else void audio.enable().catch(()=>{audio.enabled=false;update();});update();};
 volume.oninput=()=>audio.setVolume(Number(volume.value)/100);
 const unlock=()=>{if(audio.enabled)void audio.enable().catch(()=>{});};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
 if(audio.enabled)unlock();
 window.addEventListener('pagehide',()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);void audio.dispose();},{once:true});
 return {audio,element};
}
