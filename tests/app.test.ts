import {afterEach,describe,expect,it,vi} from 'vitest';
import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';
import {verifyTypedData,type Hex} from 'viem';
import {authorizationTypes} from '@x402/evm';
import type {FacilitatorClient} from '@x402/core/server';
import {createApp} from '../src/app.js';
import {loadConfig} from '../src/config.js';
import {Store} from '../src/cache.js';
import {NETWORK,USDC} from '../src/chain.js';
import type {Observation} from '../src/providers/types.js';
const account=privateKeyToAccount(generatePrivateKey());
const payTo='0x3333333333333333333333333333333333333333';
const observation:Observation={address:account.address,isContract:false,txCount:1,txCountExact:true,firstActivity:{at:'2026-01-01T00:00:00Z',block:1},firstFunder:{address:'0x2222222222222222222222222222222222222222',token:'CELO',amount:'1',at:'2026-01-01T00:00:00Z'},firstFunderComplete:true,historyComplete:true,recentActivity:[],recentComplete:true,provider:'fixture',observedAt:'2026-09-08T00:00:00Z',warnings:[]};
const stores:Store[]=[];afterEach(()=>stores.splice(0).forEach(s=>s.close()));
function setup(enabled=true) {
 const store=new Store(':memory:');stores.push(store);
 const provider={inspect:vi.fn(async()=>observation),health:async()=>({blockscout:'up'})};
 const facilitator:FacilitatorClient={
  getSupported:async()=>({kinds:[{x402Version:2,scheme:'exact',network:NETWORK}],extensions:[],signers:{[NETWORK]:[payTo]}}),
  verify:vi.fn(async(p,r)=>{
   const auth=p.payload.authorization as {from:Hex;to:Hex;value:string;validAfter:string;validBefore:string;nonce:Hex};
   const valid=await verifyTypedData({address:auth.from,domain:{name:'USDC',version:'2',chainId:42220,verifyingContract:USDC},types:authorizationTypes,primaryType:'TransferWithAuthorization',message:{...auth,value:BigInt(auth.value),validAfter:BigInt(auth.validAfter),validBefore:BigInt(auth.validBefore)},signature:p.payload.signature as Hex});
   return {isValid:valid && auth.to===r.payTo && auth.value===r.amount,payer:auth.from};
  }),
  settle:vi.fn(async()=>({success:true,network:NETWORK,payer:account.address,transaction:`0x${'a'.repeat(64)}`})),
 };
 const config=loadConfig({PUBLIC_BASE_URL:'https://preflight.example',AGENT_ADDRESS:payTo,ATTRIBUTION_TAG:'celo_0123456789ab',X402_API_KEY:'test-key',PAYMENTS_ENABLED:enabled?'true':'false'});
 const app=createApp({config,store,provider,facilitator,cutoffBlock:async()=>75974442,currentBlock:async()=>77000000n,clientIp:()=> '127.0.0.1',skill:'# Preflight\nDay 1'});
 const request=(path:string,body:unknown={address:account.address},headers:Record<string,string>={})=>app.request(path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
 async function payment() {
  const response=await request('/v1/counterparty');
  const required=JSON.parse(Buffer.from(response.headers.get('payment-required')!,'base64').toString());
  const auth={from:account.address,to:payTo as Hex,value:'5000',validAfter:'0',validBefore:String(Math.floor(Date.now()/1000)+300),nonce:`0x${generatePrivateKey().slice(2)}` as Hex};
  const signature=await account.signTypedData({domain:{name:'USDC',version:'2',chainId:42220,verifyingContract:USDC},types:authorizationTypes,primaryType:'TransferWithAuthorization',message:{...auth,value:5000n,validAfter:0n,validBefore:BigInt(auth.validBefore)}});
  return Buffer.from(JSON.stringify({x402Version:2,resource:required.resource,accepted:required.accepts[0],payload:{signature,authorization:auth}})).toString('base64');
 }
 return {app,request,payment,store,provider,facilitator};
}
describe('Day 1 HTTP API',()=>{
 it('serves an honest ERC-8004 registration document without invented identities',async()=>{
  const {app}=setup(false);const r=await app.request('/.well-known/agent.json');expect(r.status).toBe(200);const j=await r.json();expect(j.type).toBe('https://eips.ethereum.org/EIPS/eip-8004#registration-v1');expect(j.registrations).toEqual([]);expect(j.x402Support).toBe(false);
 });
 it('validates before payment and emits actionable errors',async()=>{
  const {request,facilitator}=setup(); const r=await request('/v1/counterparty',{address:'oops'});expect(r.status).toBe(400);expect((await r.json()).error.hint).toBeTruthy();expect(facilitator.verify).not.toHaveBeenCalled();
 });
 it('serves discovery and free preview without paid conclusions',async()=>{
  const {app,request}=setup();expect((await app.request('/health')).status).toBe(200);expect(await(await app.request('/skill.md')).text()).toContain('Preflight');
  const r=await request('/v1/preview/counterparty');expect(r.status).toBe(200);expect(await r.text()).not.toMatch(/first_funder|verdict|reasons/);
 });
 it('enforces IP quota despite spoofed forwarded headers',async()=>{
  const {request}=setup();for(let i=0;i<20;i++)expect((await request('/v1/preview/counterparty')).status).toBe(200);
  const r=await request('/v1/preview/counterparty',undefined,{'x-forwarded-for':'8.8.8.8'});expect(r.status).toBe(429);expect(r.headers.get('retry-after')).toBeTruthy();
 });
 it('advertises USDC at 5000 units via x402 v2 without querying explorer',async()=>{
  const {request,provider}=setup();const r=await request('/v1/counterparty');expect(r.status).toBe(402);
  const challenge=JSON.parse(Buffer.from(r.headers.get('payment-required')!,'base64').toString());expect(challenge.resource.url).toBe('https://preflight.example/v1/counterparty');
  const p=JSON.parse(Buffer.from(r.headers.get('payment-required')!,'base64').toString());expect(p.x402Version).toBe(2);expect(p.accepts[0]).toMatchObject({amount:'5000',network:NETWORK,asset:USDC});expect(provider.inspect).not.toHaveBeenCalled();expect((await r.json()).error.hint).toBeTruthy();
 });
 it('returns report and logs receipt only after successful settlement; refuses replay',async()=>{
  const s=setup();const header=await s.payment();const r=await s.request('/v1/counterparty',undefined,{'payment-signature':header});expect(r.status).toBe(200);expect((await r.json()).verdict).toBe('ambiguous');expect(r.headers.get('payment-response')).toBeTruthy();expect(s.store.stats().lastSettlement).not.toBeNull();
  const replay=await s.request('/v1/counterparty',undefined,{'payment-signature':header});expect(replay.status).toBe(409);expect(s.facilitator.settle).toHaveBeenCalledTimes(1);
 });
 it('concurrent copies of one authorization settle and serve only once',async()=>{
  const s=setup();const header=await s.payment();const rs=await Promise.all([s.request('/v1/counterparty',undefined,{'payment-signature':header}),s.request('/v1/counterparty',undefined,{'payment-signature':header})]);expect(rs.filter(r=>r.status===200)).toHaveLength(1);expect(s.facilitator.settle).toHaveBeenCalledTimes(1);
 });
 it('does not settle or leak reports when explorer fails',async()=>{
  const s=setup();const header=await s.payment();s.provider.inspect.mockRejectedValue(new Error('upstream key=secret'));
  const r=await s.request('/v1/counterparty',undefined,{'payment-signature':header});expect(r.status).toBe(503);expect(s.facilitator.settle).not.toHaveBeenCalled();expect(await r.text()).not.toContain('secret');
 });
 it('does not serve on failed settlement and blocks retries after uncertain sends',async()=>{
  const s=setup();const header=await s.payment();vi.mocked(s.facilitator.settle).mockResolvedValue({success:false,network:NETWORK,transaction:'',errorReason:'failed'});
  const r=await s.request('/v1/counterparty',undefined,{'payment-signature':header});expect(r.status).not.toBe(200);expect(await r.text()).not.toContain('first_funder');expect(s.store.stats().lastSettlement).toBeNull();
  expect((await s.request('/v1/counterparty',undefined,{'payment-signature':header})).status).toBe(409);
 });
 it('preview-only mode cannot accept payments or advertise a fictitious payTo',async()=>{
  const {request}=setup(false);expect((await request('/v1/counterparty')).status).toBe(503);
 });
});
