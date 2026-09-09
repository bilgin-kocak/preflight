import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeFunctionData} from 'viem';
import {fromDataSuffix} from '@celo/attribution-tags';
import {expect,it,vi} from 'vitest';
import {reviewFundingPlan,validateFundingRequest,recordedFundingStep,ERC20_ABI,ESCROW_ABI,ESCROW,DEPOSIT} from '../scripts/lib/review-funding.js';
const tag='celo_80fe04c6accd';
const plan=()=>reviewFundingPlan('k17ck4pafdpv9zts8svazajt6s8e3ncq',tag);
it('authorizes only the exact review deposit and binds funding to the intended project with both tags',()=>{
 const p=plan();
 expect(decodeFunctionData({abi:ERC20_ABI,data:p.approve.data})).toMatchObject({functionName:'approve',args:[ESCROW,1100000n]});
 expect(decodeFunctionData({abi:ESCROW_ABI,data:p.fund.data})).toMatchObject({functionName:'createProject',args:[p.projectKey,10n]});
 for(const r of [p.approve,p.fund])expect(fromDataSuffix(r.data)?.codes).toEqual([tag]);
 expect(DEPOSIT).toBe(1100000n);
 expect(()=>reviewFundingPlan('',tag)).toThrow();expect(()=>reviewFundingPlan('project','')).toThrow();
});
it('refuses altered destinations, amounts, tags, currency, chain, type and excessive gas before signing',()=>{
 const expected=plan().fund;const valid={...expected,chainId:42220,gas:300000n,maxFeePerGas:20000000000n};
 expect(()=>validateFundingRequest(valid,expected)).not.toThrow();
 for(const patch of [{to:ESCROW.slice(0,-1)+'0'},{data:'0x'},{feeCurrency:undefined},{chainId:1},{type:'eip1559'},{value:1n},{gas:10000000n},{gas:0n}])expect(()=>validateFundingRequest({...valid,...patch},expected)).toThrow();
});
it('records the signed hash before sending and never sends a second transaction after uncertain broadcast',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'preflight-funding-'));const path=join(dir,'step.json');const request=plan().fund;
 const hash=('0x'+'ab'.repeat(32)) as `0x${string}`;
 const prepare=vi.fn(async()=>({...request,chainId:42220,gas:300000n,maxFeePerGas:20000000000n}));
 const sign=vi.fn(async()=>({hash,serialized:'0x7b' as `0x${string}`}));
 const broadcast=vi.fn(async()=>{expect(JSON.parse(readFileSync(path,'utf8')).hash).toBe(hash);throw Error('uncertain RPC');});
 const verify=vi.fn(async():Promise<void>=>{throw Error('receipt unavailable');});
 try{
  await expect(recordedFundingStep({path,request,prepare,sign,broadcast,verify})).rejects.toThrow('uncertain RPC');
  await expect(recordedFundingStep({path,request,prepare,sign,broadcast,verify})).rejects.toThrow('receipt unavailable');
  expect(sign).toHaveBeenCalledTimes(1);expect(broadcast).toHaveBeenCalledTimes(1);
  verify.mockImplementation(async()=>{});
  expect(await recordedFundingStep({path,request,prepare,sign,broadcast,verify})).toBe(hash);
  expect(broadcast).toHaveBeenCalledTimes(1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
