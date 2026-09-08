import {formatUnits,isAddress} from 'viem';
import {z} from 'zod';
import type {ExplorerRow,History} from './types.js';
import {getJson,type Fetcher} from './http.js';
const rowSchema=z.object({timeStamp:z.string().regex(/^\d+$/),blockNumber:z.string().regex(/^\d+$/),from:z.string(),to:z.string(),value:z.string().regex(/^\d+$/)}).catchall(z.string());
export function parseExplorerList(value:unknown):History {
  const envelope=z.object({status:z.string(),message:z.string(),result:z.unknown()}).parse(value);
  if(envelope.status==='0' && /no (transactions|records|token transfers) found/i.test(envelope.message) && Array.isArray(envelope.result) && envelope.result.length===0) return {rows:[],complete:true};
  if(!['1','2'].includes(envelope.status) || !Array.isArray(envelope.result)) throw new Error('Explorer history unavailable');
  return {rows:envelope.result.map(r=>rowSchema.parse(r)),complete:envelope.status==='1'};
}
export async function history(base:string,address:string,action:string,extra:Record<string,string>={},fetcher:Fetcher=fetch,startblock=0):Promise<History> {
  const rows:ExplorerRow[]=[]; let complete=true;
  for(let page=1;page<=5;page++) {
    const url=new URL(base);
    url.search=new URLSearchParams({...extra,module:'account',action,address,startblock:String(startblock),endblock:'999999999',sort:'asc',page:String(page),offset:'100'}).toString();
    const batch=parseExplorerList(await getJson(url.toString(),fetcher));
    rows.push(...batch.rows.slice(0,100));complete &&= batch.complete;
    if(batch.rows.length<100) return {rows,complete};
  }
  return {rows,complete:false};
}
const successful=(r:ExplorerRow)=>r.isError!=='1' && r.txreceipt_status!=='0';
const time=(r:ExplorerRow)=>new Date(Number(r.timeStamp)*1000).toISOString();
export function normalizeHistory(address:string,streams:History[]) {
  const rows=streams.flatMap(s=>s.rows).filter(successful).sort((a,b)=>Number(a.timeStamp)-Number(b.timeStamp)||Number(a.blockNumber)-Number(b.blockNumber)||Number(a.transactionIndex??0)-Number(b.transactionIndex??0));
  const earliest=rows[0];
  const funded=rows.find(r=>r.to?.toLowerCase()===address.toLowerCase() && r.from?.toLowerCase()!==address.toLowerCase() && !/^0x0{40}$/i.test(r.from??'') && isAddress(r.from??'',{strict:false}) && BigInt(r.value??'0')>0n);
  const complete=streams.every(s=>s.complete);
  const decimals=Number(funded?.tokenDecimal??18);
  return {
    firstActivity:earliest?{at:time(earliest),block:Number(earliest.blockNumber)}:null,
    firstFunder:funded && Number.isInteger(decimals) && decimals>=0 && decimals<=255 ? {address:funded.from!,token:funded.tokenSymbol??'CELO',amount:formatUnits(BigInt(funded.value!),decimals),at:time(funded)}:null,
    firstFunderComplete:complete,historyComplete:complete,
  };
}
export function activityTimes(streams:History[]) {
  return streams.flatMap(s=>s.rows).filter(successful).map(time);
}
