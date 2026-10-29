export function node<K extends keyof HTMLElementTagNameMap>(tag:K,className='',text=''):HTMLElementTagNameMap[K]{
 const el=document.createElement(tag);el.className=className;el.textContent=text;return el;
}
export function mount():HTMLElement{const el=document.getElementById('app');if(!el)throw Error('App root is missing.');return el;}
export function brand():HTMLElement{const root=node('a','brand');root.href='/dashboard/';root.append(node('span','brand-mark','p'),node('span','','pitch arcade'));return root;}
export function topbar(active:string):HTMLElement{
 const header=node('header','topbar'),nav=node('nav');
 for(const [title,path] of [['Control room','/dashboard/'],['Play window','/play/'],['Mock chat','/chat/']]){
  const link=node('a',title===active?'active':'',title);link.href=path!;nav.append(link);
 }
 header.append(brand(),nav);return header;
}
export async function post<T=unknown>(path:string,body?:unknown):Promise<T>{
 const response=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Arcade-Control':'local'},body:JSON.stringify(body??{})});
 const value=await response.json() as T&{error?:string};if(!response.ok)throw Error(value.error??'That action could not finish.');return value;
}
