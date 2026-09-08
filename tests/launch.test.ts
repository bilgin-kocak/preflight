import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';
import {fromDataSuffix} from '@celo/attribution-tags';
import {USDC,USDC_FEE_CURRENCY} from '../src/chain.js';
const run=(env:Record<string,string>,args:string[]=[])=>execFileSync(process.execPath,['--import','tsx','scripts/register-identity.ts',...args],{encoding:'utf8',env:{PATH:process.env.PATH,...env},stdio:['ignore','pipe','pipe']});
it('identity command defaults to an unsigned tagged USDC dry-run',()=>{
 const result=JSON.parse(run({AGENT_URI:'https://example.com/agent.json',ATTRIBUTION_TAG:'celo_0123456789ab'}));
 expect(result.mode).toContain('no transaction sent');expect(result.feeCurrency).toBe(USDC_FEE_CURRENCY);expect(fromDataSuffix(result.data)?.codes).toEqual(['celo_0123456789ab']);
});
it('identity execute refuses missing tag and raw USDC feeCurrency before any RPC',()=>{
 expect(()=>run({AGENT_URI:'https://example.com/agent.json'},['--execute'])).toThrow();
 expect(()=>run({AGENT_URI:'https://example.com/agent.json',ATTRIBUTION_TAG:'celo_0123456789ab',FEE_CURRENCY:USDC},['--execute'])).toThrow();
});
