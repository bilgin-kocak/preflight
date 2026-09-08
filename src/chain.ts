import { fromDataSuffix, toDataSuffix } from '@celo/attribution-tags';
import { createPublicClient, http, type Hex } from 'viem';
import { celo } from 'viem/chains';

// Addresses confirmed on Blockscout; source URLs and adapter semantics in CONFIG.md.
export const USDC = '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' as const;
export const USDC_FEE_CURRENCY = '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B' as const;
export const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const;
export const NETWORK = 'eip155:42220' as const;
export const CUTOFF = '2026-08-28T00:00:00Z';

export function prepareMainnetWrite(input: {tag: string; feeCurrency?: string; data: Hex}) {
  if (!/^celo_[0-9a-f]{12}$/.test(input.tag)) throw new Error('An assigned hackathon attribution tag is required.');
  if (input.feeCurrency?.toLowerCase() !== USDC_FEE_CURRENCY.toLowerCase()) throw new Error('USDC feeCurrency must be the verified Celo USDC adapter.');
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(input.data)) throw new Error('Invalid transaction calldata.');
  const suffix = toDataSuffix([input.tag]);
  if (suffix === '0x' || !fromDataSuffix(suffix)?.codes.includes(input.tag)) throw new Error('Attribution suffix self-test failed.');
  const data = `${input.data}${suffix.slice(2)}` as Hex;
  return {data, feeCurrency: USDC_FEE_CURRENCY};
}

export function readClient(rpcUrl = 'https://forno.celo.org') {
  return createPublicClient({chain:celo, transport:http(rpcUrl,{timeout:8000,retryCount:1})});
}
