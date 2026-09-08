import {expect,it} from 'vitest';
import {BlockscoutProvider} from '../src/providers/blockscout.js';
it('falls back to v2 observations without claiming complete first-funder evidence',async()=>{
 const address='0x1111111111111111111111111111111111111111';
 const fetcher:typeof fetch=async(input)=>{
  const u=new URL(String(input));
  if(u.pathname==='/api')return new Response('{}',{status:503});
  if(u.pathname.endsWith('/counters'))return Response.json({transactions_count:'1'});
  if(u.pathname.endsWith('/transactions'))return Response.json({items:[{timestamp:'2024-01-01T00:00:00Z',block_number:1,from:{hash:'0x2222222222222222222222222222222222222222'},to:{hash:address},value:'1000000000000000000',status:'ok',hash:'0xabc',position:2}],next_page_params:null});
  if(u.pathname.endsWith('/token-transfers')||u.pathname.endsWith('/internal-transactions'))return Response.json({items:[],next_page_params:null});
  return Response.json({is_contract:false});
 };
 const r=await new BlockscoutProvider(fetcher).inspect(address,75974442);
 expect(r.firstActivity?.at).toBe('2024-01-01T00:00:00.000Z');expect(r.firstFunder?.amount).toBe('1');expect(r.firstFunderComplete).toBe(false);expect(r.historyComplete).toBe(false);expect(r.warnings.join(' ')).toContain('v2');
},10000);
