import {expect,it} from 'vitest';
import {rehearsePayment} from '../scripts/lib/payment-rehearsal.js';

it('exercises official x402 client and HTTP adapter, persistent replay protection and withheld failed reports without mainnet access',async()=>{
 const r=await rehearsePayment();
 expect(r.mode).toBe('local simulation; no funds moved');
 expect(r.unpaidStatus).toBe(402);
 expect(r.paidStatus).toBe(200);
 expect(r.signatureVerified).toBe(true);
 expect(r.receiptDecoded).toBe(true);
 expect(r.invalidSignatureStatus).toBe(402);
 expect(r.restartReplayStatus).toBe(409);
 expect(r.failedSettlementStatus).not.toBe(200);
 expect(r.failedReportWithheld).toBe(true);
 expect(r.failedRetryStatus).toBe(409);
 expect(r.settlementAttempts).toBe(2);
 expect(r.externalRequests).toBe(0);
},20000);
