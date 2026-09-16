import {afterEach,expect,it} from 'vitest';
import {createApp} from '../src/app.ts';
import {loadConfig} from '../src/config.ts';
import {Store} from '../src/cache.ts';
import {evaluateApi} from '../scripts/evaluate-api.mjs';
const baseUrl='https://preflight.example';
const address='0x1111111111111111111111111111111111111111';
const payTo='0x3333333333333333333333333333333333333333';
const stores=[];afterEach(()=>stores.splice(0).forEach(s=>s.close()));
function fixture({healthy=true,damageOffer=false}={}){
 const store=new Store(':memory:');stores.push(store);const calls=[];
 const config=loadConfig({PUBLIC_BASE_URL:baseUrl,AGENT_ADDRESS:payTo,ATTRIBUTION_TAG:'celo_0123456789ab',X402_API_KEY:'fixture',PAYMENTS_ENABLED:'true'});
 const app=createApp({config,store,clientIp:()=> '127.0.0.1',cutoffBlock:async()=>1,currentBlock:async()=>2n,skill:'# Preflight\nPOST /v1/preview/counterparty',provider:{health:async()=>({blockscout:healthy?'up':'down'}),inspect:async()=>({address,isContract:false,txCount:0,txCountExact:true,firstActivity:null,firstFunder:null,firstFunderComplete:false,historyComplete:false,recentActivity:[],recentComplete:false,provider:'fixture',observedAt:new Date().toISOString(),warnings:[]})},facilitator:{getSupported:async()=>({kinds:[{x402Version:2,scheme:'exact',network:'eip155:42220'}],extensions:[],signers:{}}),verify:async()=>{throw Error('No signed request should be sent');},settle:async()=>{throw Error('No settlement should be sent');}}});
 const fetchImpl=async(url,init)=>{
  calls.push({url,init});const r=await app.request(url,init);
  if(damageOffer&&new URL(url).pathname==='/v1/counterparty'&&r.status===402){
   const offer=JSON.parse(Buffer.from(r.headers.get('payment-required'),'base64').toString());offer.accepts[0].amount='5000000';
   const headers=new Headers(r.headers);headers.set('payment-required',Buffer.from(JSON.stringify(offer)).toString('base64'));
   return new Response(await r.text(),{status:r.status,headers});
  }
  return r;
 };
 return {fetchImpl,calls,store};
}
it('captures real application responses without signing, paying or treating incomplete evidence as failure',async()=>{
 const f=fixture();const result=await evaluateApi({baseUrl,address,fetchImpl:f.fetchImpl});
 expect(result.allChecksPassed).toBe(true);expect(result.checks).toHaveLength(8);
 expect(result.checks.find(c=>c.id==='preview').body.coverage.history_complete).toBe(false);
 expect(result.checks.find(c=>c.id==='invalid-address').body.error.issues[0].path).toBe('address');
 expect(result.checks.find(c=>c.id==='payment-offer').paymentRequired.accepts[0].amount).toBe('5000');
 expect(f.store.stats().lastSettlement).toBeNull();
 expect(f.calls).toHaveLength(8);
 for(const {url,init} of f.calls){expect(new URL(url).origin).toBe(baseUrl);expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');expect(new Headers(init.headers).has('payment-signature')).toBe(false);expect(new Headers(init.headers).has('authorization')).toBe(false);}
});
it('reports unavailable dependencies as failed checks while preserving the actual response evidence',async()=>{
 const f=fixture({healthy:false});const result=await evaluateApi({baseUrl,address,fetchImpl:f.fetchImpl});
 expect(result.allChecksPassed).toBe(false);expect(result.checks.find(c=>c.id==='health')).toMatchObject({passed:false,status:503,body:{status:'degraded'}});
});
it('fails when a 402 offers a different amount instead of accepting any payment challenge',async()=>{
 const f=fixture({damageOffer:true});const result=await evaluateApi({baseUrl,address,fetchImpl:f.fetchImpl});
 expect(result.allChecksPassed).toBe(false);expect(result.checks.find(c=>c.id==='payment-offer').passed).toBe(false);expect(f.store.stats().lastSettlement).toBeNull();
});
it('preserves a received HTTP response even when its malformed shape breaks validation',async()=>{
 const f=fixture();
 const fetchImpl=async(url,init)=>{
  const r=await f.fetchImpl(url,init);
  return r.status===400?Response.json({error:{code:'INVALID_REQUEST',issues:{}}},{status:400}):r;
 };
 const result=await evaluateApi({baseUrl,address,fetchImpl});
 expect(result.checks.find(c=>c.id==='invalid-address')).toMatchObject({passed:false,status:400,body:{error:{code:'INVALID_REQUEST',issues:{}}}});
});
it('rejects credential-bearing, redirected-path and insecure remote targets before any HTTP request',async()=>{
 for(const url of ['https://user:password@preflight.example','https://preflight.example/?key=secret','https://preflight.example/private','http://preflight.example']){
  const f=fixture();await expect(evaluateApi({baseUrl:url,address,fetchImpl:f.fetchImpl})).rejects.toThrow();expect(f.calls).toHaveLength(0);
 }
});
