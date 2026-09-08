import {history,normalizeHistory,activityTimes} from './history.js';
import {readClient} from '../chain.js';
import type {Provider,Observation} from './types.js';
import {pacedFetch} from './http.js';
import type {Address} from 'viem';
export class CeloscanProvider implements Provider {
  name='celoscan';
  private fetcher=pacedFetch();
  constructor(private key:string,private rpc=readClient()){}
  async inspect(address:string,cutoffBlock:number):Promise<Observation> {
    const get=(start=0)=>Promise.all(['txlist','tokentx','txlistinternal'].map(action=>history('https://api.etherscan.io/v2/api',address,action,{chainid:'42220',apikey:this.key},this.fetcher,start)));
    const [old,recent,code]=await Promise.all([get(),get(cutoffBlock),this.rpc.getCode({address:address as Address})]);
    const normalized=normalizeHistory(address,old);
    return {address,isContract:!!code && code!=='0x',txCount:old[0]!.rows.length,txCountExact:old[0]!.complete,...normalized,recentActivity:activityTimes(recent),recentComplete:recent.every(s=>s.complete),provider:this.name,observedAt:new Date().toISOString(),warnings:normalized.historyComplete?[]:['Explorer history capped or incomplete.']};
  }
  async health() {try {await history('https://api.etherscan.io/v2/api','0x0000000000000000000000000000000000000000','txlist',{chainid:'42220',apikey:this.key},this.fetcher);return true;} catch{return false;} }
}
