/** mulberry32: state is a single unsigned 32 bit word. */
export function mulberry32(seed:number):()=>number {
 let state=seed>>>0;
 return ()=>{
  state=(state+0x6D2B79F5)>>>0;
  let t=Math.imul(state^(state>>>15),1|state);
  t^=t+Math.imul(t^(t>>>7),61|t);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
