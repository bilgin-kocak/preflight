import {Store} from '../cache.js';
import {CUTOFF,readClient} from '../chain.js';
import type {Observation,Provider} from './types.js';
export class Providers {
  private inFlight=new Map<string,Promise<Observation>>();
  constructor(private primary:Provider,private store:Store,private fallback?:Provider){}
  async inspect(address:string,cutoffBlock:number) {
    const key=`observation:${address.toLowerCase()}:${cutoffBlock}`;
    const cached=this.store.get<Observation>(key);if(cached)return cached;
    const running=this.inFlight.get(key);if(running)return running;
    const work=(async()=>{
      let result:Observation;
      try{result=await this.primary.inspect(address,cutoffBlock);}catch{if(!this.fallback)throw new Error('Explorer unavailable');result=await this.fallback.inspect(address,cutoffBlock);}
      this.store.put(key,result,3600000);
      // Never persist incomplete evidence as an immutable fact.
      if(result.historyComplete && result.firstActivity && result.firstFunderComplete && result.firstFunder) this.store.put(`facts:${address.toLowerCase()}`,{firstActivity:result.firstActivity,firstFunder:result.firstFunder},null);
      return result;
    })();
    this.inFlight.set(key,work);try{return await work;}finally{this.inFlight.delete(key);}
  }
  async health() {
    const results=await Promise.all([this.primary.health(),this.fallback?.health()]);
    return {[this.primary.name]:results[0]?'up':'down',...(this.fallback?{[this.fallback.name]:results[1]?'up':'down'}:{})};
  }
}
// Return the first block at/after the requested timestamp. Cache only successful resolutions.
export async function resolveCutoff(store:Store,rpc:ReturnType<typeof readClient>,cutoff=CUTOFF) {
  const key=`cutoff:${cutoff}`;const cached=store.get<number>(key);if(cached!==null)return cached;
  const target=BigInt(Math.floor(Date.parse(cutoff)/1000));
  let hi=await rpc.getBlockNumber();
  if((await rpc.getBlock({blockNumber:hi})).timestamp<target)throw new Error('Cutoff is in the future');
  let lo=0n;
  // Verified default is used only as a probe, not trusted without checking both boundary timestamps.
  if(cutoff===CUTOFF){
    const [before,at]=await Promise.all([rpc.getBlock({blockNumber:75974441n}),rpc.getBlock({blockNumber:75974442n})]);
    if(before.timestamp<target && at.timestamp>=target){store.put(key,75974442,null);return 75974442;}
  }
  while(lo<hi){const mid=(lo+hi)/2n;const block=await rpc.getBlock({blockNumber:mid});if(block.timestamp<target)lo=mid+1n;else hi=mid;}
  store.put(key,Number(lo),null);return Number(lo);
}
