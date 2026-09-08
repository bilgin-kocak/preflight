import {HTTPFacilitatorClient,type FacilitatorClient,type RoutesConfig} from '@x402/core/server';
import type {PaymentPayload,PaymentRequirements} from '@x402/core/types';
import {paymentMiddleware,x402ResourceServer} from '@x402/hono';
import {ExactEvmScheme} from '@x402/evm/exact/server';
import {z} from 'zod';
import {Store} from './cache.js';
import {NETWORK,USDC} from './chain.js';
import type {Config} from './config.js';
const addr=z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const authorizationSchema=z.object({from:addr,to:addr,value:z.string().regex(/^\d+$/),nonce:z.string().regex(/^0x[0-9a-fA-F]{64}$/),validAfter:z.string().regex(/^\d+$/),validBefore:z.string().regex(/^\d+$/)});
export function paymentIdentity(payload:PaymentPayload) {
  if(payload.x402Version!==2 || payload.accepted.network!==NETWORK || payload.accepted.scheme!=='exact' || payload.accepted.asset.toLowerCase()!==USDC.toLowerCase()) throw new Error('Unsupported payment');
  const a=authorizationSchema.parse(payload.payload.authorization);
  return {authorization:a,key:`${NETWORK}:${USDC.toLowerCase()}:${a.from.toLowerCase()}:${a.nonce.toLowerCase()}`};
}
export function decodePayment(header:string) {
  if(header.length>16384 || !/^[A-Za-z0-9+/]+={0,2}$/.test(header))throw new Error('Malformed payment header');
  const parsed=JSON.parse(Buffer.from(header,'base64').toString()) as PaymentPayload;
  paymentIdentity(parsed);return parsed;
}
function matches(p:PaymentPayload,r:PaymentRequirements) {
  const {authorization:a}=paymentIdentity(p);
  return r.network===NETWORK && r.asset.toLowerCase()===USDC.toLowerCase() && r.amount==='5000' && a.to.toLowerCase()===r.payTo.toLowerCase() && a.value===r.amount;
}
export function durableFacilitator(delegate:FacilitatorClient,store:Store):FacilitatorClient {
  return {
    getSupported:()=>delegate.getSupported(),
    async verify(p,r) {
      try {
        const {key,authorization:a}=paymentIdentity(p);
        if(!matches(p,r)||store.payment(key))return {isValid:false,invalidReason:'invalid_or_reused_authorization'};
        const result=await delegate.verify(p,r);
        if(result.payer && result.payer.toLowerCase()!==a.from.toLowerCase())return {isValid:false,invalidReason:'payer_mismatch'};
        return result;
      }catch {return {isValid:false,invalidReason:'payment_verification_unavailable'};}
    },
    async settle(p,r) {
      const {key,authorization:a}=paymentIdentity(p);
      if(!matches(p,r) || !store.reservePayment(key,a.from,r.amount,r.asset,'/v1/counterparty'))return {success:false,network:NETWORK,transaction:'',errorReason:'payment_reused'};
      // Pending rows survive timeout, crash and restart. Never auto-retry a possibly broadcast payment.
      try {
        const result=await delegate.settle(p,r);
        if(result.success && result.network===NETWORK && /^0x[0-9a-fA-F]{64}$/.test(result.transaction) && (!result.payer || result.payer.toLowerCase()===a.from.toLowerCase()) && (!result.amount || result.amount===r.amount)) {
          store.settlePayment(key,result.transaction);return result;
        }
        return {success:false,network:NETWORK,transaction:'',errorReason:'settlement_unconfirmed'};
      }catch {return {success:false,network:NETWORK,transaction:'',errorReason:'settlement_unknown'};}
    },
  };
}
export function paymentGate(config:Config,store:Store,facilitator?:FacilitatorClient) {
  const delegate=facilitator??new HTTPFacilitatorClient({url:'https://api.x402.celo.org',timeoutMs:15000,createAuthHeaders:async()=>{
    const h={'X-API-Key':config.X402_API_KEY!};return {verify:h,settle:h,supported:h};
  }});
  const server=new x402ResourceServer(durableFacilitator(delegate,store)).register(NETWORK,new ExactEvmScheme());
  const routes:RoutesConfig={'POST /v1/counterparty':{accepts:{scheme:'exact',network:NETWORK,payTo:config.AGENT_ADDRESS!,price:{amount:'5000',asset:USDC,extra:{name:'USDC',version:'2'}},maxTimeoutSeconds:300},description:'Celo counterparty preflight signals',mimeType:'application/json'}};
  return paymentMiddleware(routes,server);
}
