import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,type Server} from 'node:http';
import {getRequestListener} from '@hono/node-server';
import {Hono} from 'hono';
import {x402Client} from '@x402/core/client';
import {HTTPFacilitatorClient} from '@x402/core/server';
import type {PaymentPayload,PaymentRequirements,PaymentRequired} from '@x402/core/types';
import {registerExactEvmScheme} from '@x402/evm/exact/client';
import {authorizationTypes} from '@x402/evm';
import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {verifyTypedData,type Hex} from 'viem';
import {createApp} from '../../src/app.js';
import {loadConfig} from '../../src/config.js';
import {Store} from '../../src/cache.js';
import {NETWORK,USDC} from '../../src/chain.js';
import {paymentIdentity} from '../../src/x402.js';
import type {Observation} from '../../src/providers/types.js';

const close=(server:Server)=>new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
async function listen(handler:Parameters<typeof getRequestListener>[0]){
 const server=createServer(getRequestListener(handler));
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const address=server.address();assert(address&&typeof address!=='string');
 return {server,url:`http://127.0.0.1:${address.port}`};
}

/** Only synthetic identities, fixture observations and loopback HTTP are used. */
export async function rehearsePayment(){
 const dir=mkdtempSync(join(tmpdir(),'preflight-payment-rehearsal-'));
 const originalFetch=globalThis.fetch;
 let externalRequests=0;
 globalThis.fetch=(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input:input.url);
  if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'){externalRequests++;throw Error('Rehearsal refuses non-loopback requests.');}
  return originalFetch(input,init);
 };
 const servers:Server[]=[];let store:Store|undefined;
 try{
  const payer=privateKeyToAccount(generatePrivateKey());
  const payTo=privateKeyToAccount(generatePrivateKey()).address;
  const syntheticHash=`0x${'a'.repeat(64)}` as Hex;
  let settlementAttempts=0,failSettlement=false,signatureVerified=false;
  const mock=new Hono();
  mock.use('*',async(c,next)=>{assert.equal(c.req.header('X-API-Key'),'rehearsal-only');await next();});
  mock.get('/supported',c=>c.json({kinds:[{x402Version:2,scheme:'exact',network:NETWORK}],extensions:[],signers:{[NETWORK]:[payTo]}}));
  mock.post('/verify',async c=>{
   const {paymentPayload:p,paymentRequirements:r}=await c.req.json<{paymentPayload:PaymentPayload;paymentRequirements:PaymentRequirements}>();
   const {authorization:a}=paymentIdentity(p);const now=BigInt(Math.floor(Date.now()/1000));
   const valid=await verifyTypedData({address:a.from as Hex,domain:{name:'USDC',version:'2',chainId:42220,verifyingContract:USDC},types:authorizationTypes,primaryType:'TransferWithAuthorization',message:{from:a.from as Hex,to:a.to as Hex,value:BigInt(a.value),validAfter:BigInt(a.validAfter),validBefore:BigInt(a.validBefore),nonce:a.nonce as Hex},signature:p.payload.signature as Hex}).catch(()=>false);
   signatureVerified=valid;
   return c.json({isValid:valid&&a.to.toLowerCase()===payTo.toLowerCase()&&a.value==='5000'&&r.amount==='5000'&&BigInt(a.validAfter)<=now&&BigInt(a.validBefore)>now,payer:a.from});
  });
  mock.post('/settle',c=>{
   settlementAttempts++;
   return c.json(failSettlement?{success:false,network:NETWORK,transaction:'',errorReason:'simulated_settlement_failure'}:{success:true,network:NETWORK,transaction:syntheticHash,payer:payer.address,amount:'5000'});
  });
  const facilitatorServer=await listen(mock.fetch);servers.push(facilitatorServer.server);
  const facilitator=new HTTPFacilitatorClient({url:facilitatorServer.url,timeoutMs:2000,createAuthHeaders:async()=>{const h={'X-API-Key':'rehearsal-only'};return {verify:h,settle:h,supported:h};}});
  const config=loadConfig({PUBLIC_BASE_URL:'https://preflight.example',AGENT_ADDRESS:payTo,ATTRIBUTION_TAG:'celo_0123456789ab',X402_API_KEY:'rehearsal-only',PAYMENTS_ENABLED:'true'});
  const observation:Observation={address:payer.address,isContract:false,txCount:1,txCountExact:true,firstActivity:{at:'2026-01-01T00:00:00Z',block:1},firstFunder:null,firstFunderComplete:false,historyComplete:false,recentActivity:[],recentComplete:false,provider:'local-fixture',observedAt:'2026-09-09T00:00:00Z',warnings:['Synthetic rehearsal observation; not chain evidence.']};
  const provider={inspect:async()=>observation,health:async()=>({fixture:'up'})};
  const startApp=async()=>{
   store=new Store(join(dir,'payments.sqlite'));
   const app=createApp({config,store,provider,facilitator,cutoffBlock:async()=>75974442,currentBlock:async()=>77000000n,skill:'# Local simulation only',clientIp:()=> '127.0.0.1'});
   const running=await listen(app.fetch);servers.push(running.server);return running;
  };
  let running=await startApp();
  const post=(header?:string)=>fetch(`${running.url}/v1/counterparty`,{method:'POST',headers:{'content-type':'application/json',...(header?{'payment-signature':header}:{})},body:JSON.stringify({address:payer.address})});
  const unpaid=await post();assert.equal(unpaid.status,402);
  const required=JSON.parse(Buffer.from(unpaid.headers.get('payment-required')!,'base64').toString()) as PaymentRequired;
  assert.equal(required.accepts[0]?.amount,'5000');assert.equal(required.accepts[0]?.asset,USDC);assert.equal(required.accepts[0]?.network,NETWORK);
  const buyer=new x402Client();registerExactEvmScheme(buyer,{signer:payer,networks:[NETWORK]});
  const payload=await buyer.createPaymentPayload(required);
  const damaged=structuredClone(payload);
  const signature=damaged.payload.signature as string;
  damaged.payload.signature=`0x${signature.slice(2,4)==='00'?'01':'00'}${signature.slice(4)}`;
  const invalid=await post(Buffer.from(JSON.stringify(damaged)).toString('base64'));
  assert.equal(invalid.status,402);assert.equal(settlementAttempts,0);
  const header=Buffer.from(JSON.stringify(payload)).toString('base64');
  const paid=await post(header);const report=await paid.json();assert.equal(paid.status,200);assert.equal(report.verdict,'ambiguous');
  const receipt=JSON.parse(Buffer.from(paid.headers.get('payment-response')!,'base64').toString());assert.equal(receipt.transaction,syntheticHash);assert.equal(receipt.success,true);assert(store!.stats().lastSettlement);
  await close(running.server);servers.splice(servers.indexOf(running.server),1);store!.close();store=undefined;
  running=await startApp();
  const replay=await post(header);assert.equal(replay.status,409);assert.equal(settlementAttempts,1);
  failSettlement=true;
  const freshRequired=JSON.parse(Buffer.from((await post()).headers.get('payment-required')!,'base64').toString()) as PaymentRequired;
  const failureHeader=Buffer.from(JSON.stringify(await buyer.createPaymentPayload(freshRequired))).toString('base64');
  const failed=await post(failureHeader);const failureBody=await failed.text();assert.notEqual(failed.status,200);assert(!failureBody.includes('verdict'));assert(!failureBody.includes('first_funder'));
  const failedRetry=await post(failureHeader);assert.equal(failedRetry.status,409);assert.equal(settlementAttempts,2);assert.equal(externalRequests,0);
  return {mode:'local simulation; no funds moved' as const,checkedAt:new Date().toISOString(),unpaidStatus:unpaid.status,paidStatus:paid.status,signatureVerified,receiptDecoded:true,invalidSignatureStatus:invalid.status,restartReplayStatus:replay.status,failedSettlementStatus:failed.status,failedReportWithheld:true,failedRetryStatus:failedRetry.status,settlementAttempts,externalRequests,priceUSDC:'0.005',limitations:['Facilitator settlement and wallet history are simulated.','Does not prove mainnet settlement, production activation or independent adoption.']};
 }finally{
  try{await Promise.all(servers.map(s=>close(s)));store?.close();rmSync(dir,{recursive:true,force:true});}
  finally{globalThis.fetch=originalFetch;}
 }
}
