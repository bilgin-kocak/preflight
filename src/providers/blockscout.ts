import {z} from 'zod';
import {getJson,pacedFetch,type Fetcher} from './http.js';
import {activityTimes,history,normalizeHistory} from './history.js';
import type {Provider,Observation} from './types.js';
export class BlockscoutProvider implements Provider {
  name='blockscout';
  private fetcher:Fetcher;
  constructor(fetcher:Fetcher=fetch,private base='https://celo.blockscout.com') {this.fetcher=pacedFetch(fetcher);}
  async inspect(address:string,cutoffBlock:number):Promise<Observation> {
    const oldest=Promise.all(['txlist','tokentx','txlistinternal'].map(action=>history(`${this.base}/api`,address,action,{},this.fetcher)));
    const recent=Promise.all(['txlist','tokentx','txlistinternal'].map(action=>history(`${this.base}/api`,address,action,{},this.fetcher,cutoffBlock)));
    const [rawMeta,rawCounts,old,latest]=await Promise.all([
      getJson(`${this.base}/api/v2/addresses/${address}`,this.fetcher),getJson(`${this.base}/api/v2/addresses/${address}/counters`,this.fetcher),oldest,recent,
    ]);
    const meta=z.object({is_contract:z.boolean()}).parse(rawMeta);
    const counts=z.object({transactions_count:z.string().regex(/^\d+$/)}).parse(rawCounts);
    const normalized=normalizeHistory(address,old);
    return {address,isContract:meta.is_contract,txCount:Number(counts.transactions_count),txCountExact:true,...normalized,
      recentActivity:activityTimes(latest),recentComplete:latest.every(s=>s.complete),provider:this.name,observedAt:new Date().toISOString(),
      warnings:[...(!normalized.historyComplete?['Oldest history is capped or incompletely indexed; first funding is an observation, not a proven fact.']:[]),...(!latest.every(s=>s.complete)?['Recent distinct days are a lower bound.']:[])],
    };
  }
  async health() { try {await getJson(`${this.base}/api/v2/stats`,this.fetcher);return true;} catch{return false;} }
}
