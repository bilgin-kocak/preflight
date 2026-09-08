import {z} from 'zod';
import {getJson,pacedFetch,type Fetcher} from './http.js';
import {activityTimes,history,normalizeHistory} from './history.js';
import {v2History} from './blockscout-v2.js';
import type {Provider,Observation,History} from './types.js';
export class BlockscoutProvider implements Provider {
  name='blockscout';
  private fetcher:Fetcher;
  private legacyRetryAt=0;
  constructor(fetcher:Fetcher=fetch,private base='https://celo.blockscout.com') {this.fetcher=pacedFetch(fetcher);}
  async inspect(address:string,cutoffBlock:number):Promise<Observation> {
    let old:History[],latest:History[],degraded=false;
    const metadata=Promise.all([
      getJson(`${this.base}/api/v2/addresses/${address}`,this.fetcher),getJson(`${this.base}/api/v2/addresses/${address}/counters`,this.fetcher),
    ]);
    // Attach handlers immediately: a failed history lookup must not leave metadata rejection unhandled.
    const metaResult=metadata.then(value=>({value,error:false as const}),()=>({error:true as const}));
    try{
      if(Date.now()<this.legacyRetryAt)throw new Error('Legacy history temporarily unavailable');
      const reads=await Promise.allSettled(['txlist','tokentx','txlistinternal'].flatMap(action=>[
        history(`${this.base}/api`,address,action,{},this.fetcher),history(`${this.base}/api`,address,action,{},this.fetcher,cutoffBlock),
      ]));
      if(reads.some(r=>r.status==='rejected'))throw new Error('Legacy history unavailable');
      const values=reads.map(r=>(r as PromiseFulfilledResult<History>).value);
      old=[values[0]!,values[2]!,values[4]!];latest=[values[1]!,values[3]!,values[5]!];
    }catch{
      this.legacyRetryAt=Date.now()+60000;degraded=true;
      const streams=await Promise.all(['transactions','token-transfers','internal-transactions'].map(kind=>v2History(this.base,address,kind as 'transactions'|'token-transfers'|'internal-transactions',this.fetcher)));
      // v2 has no legacy status=2 indexing warning. It can establish observed activity,
      // but absence/first-ever funding must stay uncertain while full-history verification is unavailable.
      old=streams.map(s=>({...s,complete:false}));latest=old;
    }
    const meta=await metaResult;if(meta.error)throw new Error('Explorer metadata unavailable');
    const [rawMeta,rawCounts]=meta.value;
    const parsed=z.object({is_contract:z.boolean()}).parse(rawMeta);
    const counts=z.object({transactions_count:z.string().regex(/^\d+$/)}).parse(rawCounts);
    const normalized=normalizeHistory(address,old);
    return {address,isContract:parsed.is_contract,txCount:Number(counts.transactions_count),txCountExact:true,...normalized,
      recentActivity:activityTimes(latest),recentComplete:latest.every(s=>s.complete),provider:this.name,observedAt:new Date().toISOString(),
      warnings:[...(degraded?['Legacy history unavailable; using bounded v2 observations with incomplete first-funder coverage.']:[]),...(!normalized.historyComplete?['Oldest history is capped or incompletely indexed; first funding is an observation, not a proven fact.']:[]),...(!latest.every(s=>s.complete)?['Recent distinct days are a lower bound.']:[])],
    };
  }
  async health() { try {await getJson(`${this.base}/api/v2/stats`,this.fetcher);return true;} catch{return false;} }
}
