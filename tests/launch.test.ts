import {spawnSync} from 'node:child_process';
import {expect,it} from 'vitest';
import {fromDataSuffix} from '@celo/attribution-tags';
import {USDC,USDC_FEE_CURRENCY} from '../src/chain.js';
const run=(env:Record<string,string | undefined>,args:string[]=[])=>spawnSync(process.execPath,['--import','tsx','scripts/register-identity.ts',...args],{encoding:'utf8',env:{PATH:process.env.PATH,...env},stdio:['ignore','pipe','pipe'],timeout:10000});
it('identity command defaults to an unsigned tagged USDC dry-run',()=>{
 const processResult=run({AGENT_URI:'https://example.com/agent.json',ATTRIBUTION_TAG:'celo_0123456789ab'});
 expect(processResult.status).toBe(0);
 const result=JSON.parse(processResult.stdout);
 expect(result.type).toBe('cip64');
 expect(result.mode).toContain('no transaction sent');expect(result.feeCurrency).toBe(USDC_FEE_CURRENCY);expect(fromDataSuffix(result.data)?.codes).toEqual(['celo_0123456789ab']);
},15000);
it('identity execute refuses missing tag and raw USDC feeCurrency before any RPC',()=>{
 for(const env of [
  {AGENT_URI:'https://example.com/agent.json'},
  {AGENT_URI:'https://example.com/agent.json',ATTRIBUTION_TAG:'celo_0123456789ab',FEE_CURRENCY:USDC},
 ]){
  const result=run(env,['--execute']);
  // A loader error, timeout or killed child cannot masquerade as a successful policy refusal.
  expect(result.status).toBe(1);expect(result.stderr).toContain('Identity operation stopped.');expect(result.stdout).not.toContain('Prepared identity transaction');
 }
},25000);
