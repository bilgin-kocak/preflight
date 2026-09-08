export type Fetcher=typeof fetch;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
export function pacedFetch(fetcher:Fetcher=fetch,interval=250):Fetcher {
  let nextStart=0;
  return async(input,init)=>{
    const now=Date.now(),start=Math.max(now,nextStart);
    if(start-now>5000)throw new Error('Explorer request queue is full');
    nextStart=start+interval;
    if(start>now)await wait(start-now);
    init?.signal?.throwIfAborted();
    return fetcher(input,init);
  };
}
export async function getJson(url:string,fetcher:Fetcher=fetch):Promise<unknown> {
  for(let attempt=0;attempt<2;attempt++){
    const response=await fetcher(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
    if(response.status===429 && attempt===0){
      const seconds=Number(response.headers.get('retry-after')??1);
      await response.body?.cancel();
      await wait(Number.isFinite(seconds)?Math.min(2000,Math.max(250,seconds*1000)):1000);
      continue;
    }
    if(!response.ok)throw new Error(`Explorer returned HTTP ${response.status}`);
    return response.json();
  }
  throw new Error('Explorer read failed');
}
