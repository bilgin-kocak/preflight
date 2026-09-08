import { z } from 'zod';
import { isAddress } from 'viem';
import { prepareMainnetWrite, USDC_FEE_CURRENCY } from './chain.js';
const address=z.string().refine(v=>isAddress(v,{strict:false}),'Expected an EVM address');
const schema=z.object({
  PORT:z.coerce.number().int().min(1).max(65535).default(3000),
  PUBLIC_BASE_URL:z.url().default('http://localhost:3000'),
  CELO_RPC_URL:z.url().default('https://forno.celo.org'),
  DATABASE_PATH:z.string().default('data/preflight.sqlite'),
  AGENT_ADDRESS:address.optional(), ATTRIBUTION_TAG:z.string().optional(), X402_API_KEY:z.string().min(1).optional(),
  ETHERSCAN_API_KEY:z.string().optional(), CELOSCAN_API_KEY:z.string().optional(),
  PAYMENTS_ENABLED:z.enum(['true','false']).default('false'),
  // Enable only behind Railway's edge, which supplies this header. Never trust arbitrary X-Forwarded-For.
  TRUST_RAILWAY_PROXY:z.enum(['true','false']).default('false'),
});
export function loadConfig(env:NodeJS.ProcessEnv=process.env) {
  const cleaned=Object.fromEntries(Object.entries(env).filter(([,v])=>v!==''));
  const c=schema.parse(cleaned);
  if(c.PAYMENTS_ENABLED==='true') {
    if(!c.AGENT_ADDRESS || /^0x0{40}$/i.test(c.AGENT_ADDRESS) || !c.X402_API_KEY || !c.ATTRIBUTION_TAG) throw new Error('Payments require the registered AGENT_ADDRESS, ATTRIBUTION_TAG and X402_API_KEY.');
    if(!c.PUBLIC_BASE_URL.startsWith('https://')) throw new Error('Live payments require an HTTPS PUBLIC_BASE_URL.');
    prepareMainnetWrite({tag:c.ATTRIBUTION_TAG,feeCurrency:USDC_FEE_CURRENCY,data:'0x'});
  }
  return c;
}
export type Config=ReturnType<typeof loadConfig>;
