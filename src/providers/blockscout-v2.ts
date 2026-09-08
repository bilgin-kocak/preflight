import {z} from 'zod';
import {getJson,type Fetcher} from './http.js';
import type {ExplorerRow,History} from './types.js';
const endpointAddress=z.object({hash:z.string()}).nullable().optional();
const itemSchema=z.object({
 timestamp:z.string().nullable(),block_number:z.number(),from:endpointAddress,to:endpointAddress,
 value:z.string().nullable().optional(),hash:z.string().optional(),transaction_hash:z.string().optional(),
 position:z.number().optional(),transaction_index:z.number().optional(),status:z.string().nullable().optional(),success:z.boolean().optional(),
 token:z.object({symbol:z.string().nullable(),decimals:z.string().nullable()}).nullable().optional(),
 total:z.object({value:z.string().optional()}).nullable().optional(),
}).passthrough();
const pageSchema=z.object({items:z.array(itemSchema),next_page_params:z.record(z.string(),z.union([z.string(),z.number(),z.boolean()])).nullable()});
export async function v2History(base:string,address:string,kind:'transactions'|'token-transfers'|'internal-transactions',fetcher:Fetcher):Promise<History>{
 const rows:ExplorerRow[]=[];let cursor:Record<string,string>={};
 for(let page=0;page<10;page++){
  const url=new URL(`${base}/api/v2/addresses/${address}/${kind}`);url.search=new URLSearchParams(cursor).toString();
  const data=pageSchema.parse(await getJson(url.toString(),fetcher));
  for(const item of data.items){
   if(!item.timestamp || (kind==='token-transfers' && !item.total?.value))continue;
   const timestamp=Date.parse(item.timestamp);if(!Number.isFinite(timestamp))throw new Error('Invalid explorer timestamp');
   const row:ExplorerRow={timeStamp:String(Math.floor(timestamp/1000)),blockNumber:String(item.block_number),from:item.from?.hash??'',to:item.to?.hash??'',value:kind==='token-transfers'?item.total!.value!:item.value??'0',hash:item.hash??item.transaction_hash??'',isError:item.status==='error'||item.success===false?'1':'0'};
   const index=item.position??item.transaction_index;if(index!==undefined)row.transactionIndex=String(index);
   if(item.token?.symbol)row.tokenSymbol=item.token.symbol;
   if(item.token?.decimals)row.tokenDecimal=item.token.decimals;
   rows.push(row);if(rows.length===500)return {rows,complete:false};
  }
  if(!data.next_page_params)return {rows,complete:true};
  cursor=Object.fromEntries(Object.entries(data.next_page_params).map(([k,v])=>[k,String(v)]));
 }
 return {rows,complete:false};
}
