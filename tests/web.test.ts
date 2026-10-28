import {expect,test} from 'vitest';
import {createArcade} from '../apps/server/src/app.js';
test('play page serves only trusted Vite assets',async()=>{
 const arcade=await createArcade({dbPath:':memory:',mockTwitch:true,mockCodex:true,seedLibrary:false});
 try{
  const response=await arcade.app.inject('/play/');expect(response.statusCode).toBe(200);
  const script=response.body.match(/src="([^"]+\.js)"/)?.[1];expect(script).toBeTruthy();
  const asset=await arcade.app.inject(script!);expect(asset.statusCode).toBe(200);expect(asset.headers['content-type']).toContain('javascript');
  expect((await arcade.app.inject('/assets/not-allowed.json')).statusCode).toBe(404);
 }finally{await arcade.close();}
});
