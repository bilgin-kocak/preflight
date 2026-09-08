import { describe, expect, it } from 'vitest';
import { fromDataSuffix } from '@celo/attribution-tags';
import { prepareMainnetWrite, USDC, USDC_FEE_CURRENCY } from '../src/chain.js';
import { Store } from '../src/cache.js';
const tag = 'celo_0123456789ab';
describe('mainnet write policy', () => {
  it('rejects missing/unissued tag and any currency other than the USDC adapter', () => {
    for (const bad of ['', '0x', 'my_app']) expect(() => prepareMainnetWrite({tag:bad, feeCurrency:USDC_FEE_CURRENCY, data:'0x1234'})).toThrow();
    for (const bad of [undefined, USDC]) expect(() => prepareMainnetWrite({tag, feeCurrency:bad, data:'0x1234'})).toThrow(/USDC/);
  });
  it('preserves calldata and appends a decodable nonempty assigned tag', () => {
    const tx = prepareMainnetWrite({tag, feeCurrency:USDC_FEE_CURRENCY, data:'0x1234'});
    expect(tx.data.startsWith('0x1234')).toBe(true);
    expect(fromDataSuffix(tx.data)?.codes).toEqual([tag]);
    expect(tx.feeCurrency).toBe(USDC_FEE_CURRENCY);
  });
});
describe('durable state', () => {
  it('expires cache values but retains immutable facts', () => {
    const s=new Store(':memory:'); s.put('short',{a:1},100,1000); s.put('fact',42,null,1000);
    expect(s.get('short',1099)).toEqual({a:1}); expect(s.get('short',1100)).toBeNull(); expect(s.get('fact',99999)).toBe(42); s.close();
  });
  it('atomically limits preview to 20 requests per UTC day', () => {
    const s=new Store(':memory:');
    for(let i=0;i<20;i++) expect(s.takeQuota('ip',20,1788825600000)).toBe(true);
    expect(s.takeQuota('ip',20,1788825600000)).toBe(false);
    expect(s.takeQuota('other',20,1788825600000)).toBe(true);
    expect(s.takeQuota('ip',20,1788912000000)).toBe(true); s.close();
  });
  it('reserves a nonce once and never releases uncertain settlement attempts', () => {
    const s=new Store(':memory:'); expect(s.reservePayment('key','payer','5000','asset','/v1/counterparty')).toBe(true);
    expect(s.reservePayment('key','payer','5000','asset','/v1/counterparty')).toBe(false);
    s.settlePayment('key','0xhash'); expect(s.payment('key')?.state).toBe('settled');
    expect(s.stats().lastSettlement).not.toBeNull(); s.close();
  });
});
