import type {Settings} from '../../../packages/shared/src/protocol.js';
import {defaultDenylist} from './moderation.js';
import {Repository} from './storage.js';
export class SettingsStore {
 constructor(private store:Repository){}
 read():Settings{
  try{
   const row=this.store.db.get<{value:string}>("SELECT value FROM settings WHERE key='controls'");
   if(row)return JSON.parse(row.value) as Settings;
  }catch{}
  return {autoApproveMods:false,autoApproveVips:false,denylist:[...defaultDenylist]};
 }
 save(value:Settings):Settings{
  if(typeof value.autoApproveMods!=='boolean'||typeof value.autoApproveVips!=='boolean'||!Array.isArray(value.denylist)||value.denylist.length>50||value.denylist.some(word=>typeof word!=='string'||!word.trim()||word.length>40||/[\r\n\x00-\x1f]/.test(word)))throw Error('INVALID_SETTINGS');
  const clean={autoApproveMods:value.autoApproveMods,autoApproveVips:value.autoApproveVips,denylist:[...new Set(value.denylist.map(word=>word.normalize('NFKC').trim().toLowerCase()))]};
  this.store.db.run("INSERT INTO settings(key,value) VALUES('controls',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(clean));
  this.store.event('controls.updated',{autoApproveMods:clean.autoApproveMods,autoApproveVips:clean.autoApproveVips,denylistCount:clean.denylist.length});
  return clean;
 }
}
