import {Hono,type Context} from 'hono';
import {bodyLimit} from 'hono/body-limit';
import {getConnInfo} from '@hono/node-server/conninfo';
import {isIP} from 'node:net';
import {createHash} from 'node:crypto';
import {isAddress} from 'viem';
import {z} from 'zod';
import type {FacilitatorClient} from '@x402/core/server';
import type {Store} from './cache.js';
import type {Config} from './config.js';
import type {Observation} from './providers/types.js';
import {evaluate,preview,type CheckInput} from './checks/counterparty.js';
import {CUTOFF,NETWORK,IDENTITY_REGISTRY} from './chain.js';
import {decodePayment,paymentGate,paymentIdentity} from './x402.js';
const addr=z.string().refine(v=>isAddress(v,{strict:false}) && !/^0x0{40}$/i.test(v),'Expected a nonzero Celo address');
const requestSchema=z.object({address:addr,project_wallets:z.array(addr).max(100).optional(),dominant_funders:z.array(addr).max(100).optional(),cutoff:z.iso.datetime({offset:true}).refine(t=>Date.parse(t)>=Date.parse('2020-04-22T00:00:00Z') && Date.parse(t)<=Date.now(),'Cutoff must be in Celo history, not the future').optional()}).strict();
type Env={Variables:{input:CheckInput}};
type Dependencies={config:Config;store:Store;provider:{inspect(address:string,cutoffBlock:number):Promise<Observation>;health():Promise<Record<string,string>>};facilitator?:FacilitatorClient;cutoffBlock:(cutoff:string)=>Promise<number>;currentBlock:()=>Promise<bigint>;clientIp?:(c:Context)=>string;skill:string};
const error=(code:string,message:string,hint:string)=>({error:{code,message,hint}});
export function createApp(d:Dependencies) {
  const app=new Hono<Env>();
  const paid=d.config.PAYMENTS_ENABLED==='true';
  app.use('*',async(c,next)=>{
    c.header('Cache-Control','no-store');c.header('X-Content-Type-Options','nosniff');
    await next();
    // Keep x402 protocol headers intact while normalizing its library error bodies.
    if(c.res.status>=400){
      const status=c.res.status;let body:unknown;
      try{body=await c.res.clone().json();}catch{body=null;}
      if(!body || typeof body!=='object' || !('error' in body) || typeof body.error!=='object' || !body.error || !('hint' in body.error)) {
        const normalized=status===402?error('PAYMENT_REQUIRED','A valid settled USDC payment is required.','Read PAYMENT-REQUIRED and resend with PAYMENT-SIGNATURE. After a settlement attempt, check its receipt before creating a new authorization.'):error('REQUEST_FAILED','The request could not be completed.','Check /health and /skill.md. Retry only after checking any payment receipt.');
        const headers=new Headers(c.res.headers);headers.delete('content-length');headers.set('content-type','application/json');
        c.res=new Response(JSON.stringify(normalized),{status,headers});
      }
    }
  });
  app.use('*',bodyLimit({maxSize:16384,onError:c=>c.json(error('BODY_TOO_LARGE','Request body exceeds 16 KiB.','Send one address and at most 100 context addresses per list.'),413)}));
  app.onError((_e,c)=>c.json(error('SERVICE_UNAVAILABLE','A dependency is unavailable.','Check /health, then retry later. No paid report is returned without confirmed settlement.'),503));
  app.notFound(c=>c.json(error('NOT_FOUND','This Day 1 endpoint does not exist.','Use GET /skill.md for the supported endpoint list.'),404));
  app.get('/',c=>c.json({name:'Preflight',version:'0.1.0',description:'Celo counterparty preflight signals',skill:'/skill.md',preview:'/v1/preview/counterparty',paid:'/v1/counterparty',payments_enabled:paid}));
  for(const route of ['/health','/v1/health'])app.get(route,async c=>{
    const cached=d.store.get<Record<string,unknown>>('health');if(cached)return c.json(cached,cached.status==='ok'?200:503);
    const [providers,block]=await Promise.allSettled([d.provider.health(),d.currentBlock()]);
    const statuses=providers.status==='fulfilled'?providers.value:{explorer:'down'};
    const ok=Object.values(statuses).includes('up')&&block.status==='fulfilled';
    const body={status:ok?'ok':'degraded',version:'0.1.0',network:NETWORK,providers:statuses,current_block:block.status==='fulfilled'?Number(block.value):null,cache_size:d.store.stats().cacheSize,last_settlement_at:d.store.stats().lastSettlement,payments_enabled:paid,cutoff:CUTOFF};
    d.store.put('health',body,15000);return c.json(body,ok?200:503);
  });
  for(const route of ['/skill.md','/v1/skill.md'])app.get(route,c=>c.text(d.skill.replaceAll('{{BASE_URL}}',d.config.PUBLIC_BASE_URL.replace(/\/$/,''))));
  app.get('/.well-known/agent.json',c=>c.json({
    type:'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',name:'Preflight',
    description:'Celo counterparty preflight signals. Free preview and optional 0.005 USDC checks. Heuristics, not an audit.',
    services:[{name:'web',endpoint:d.config.PUBLIC_BASE_URL},{name:'skill',endpoint:`${d.config.PUBLIC_BASE_URL}/skill.md`},{name:'HTTP',endpoint:`${d.config.PUBLIC_BASE_URL}/v1/preview/counterparty`}],
    x402Support:paid,active:true,registrations:d.config.ERC8004_AGENT_ID?[{agentId:d.config.ERC8004_AGENT_ID,agentRegistry:`${NETWORK}:${IDENTITY_REGISTRY}`}]:[],supportedTrust:[],
    ...(d.config.AGENT_ADDRESS?{payTo:d.config.AGENT_ADDRESS}:{}),registration_pending:!d.config.ERC8004_AGENT_ID,
  }));
  const validate=async(c:Context<Env>,next:()=>Promise<void>)=>{
    let json:unknown;try{json=await c.req.json();}catch{return c.json(error('INVALID_JSON','Expected a JSON request body.','Use Content-Type: application/json and a JSON object with address.'),400);}
    const parsed=requestSchema.safeParse(json);if(!parsed.success)return c.json(error('INVALID_REQUEST','Invalid address, cutoff or context fields.','Send a nonzero 0x address; optional project_wallets/dominant_funders arrays (max 100 each) and a past ISO-8601 cutoff.'),400);
    c.set('input',parsed.data);await next();
  };
  app.post('/v1/preview/counterparty',validate,async c=>{
    let ip=d.clientIp?.(c);
    if(!ip && d.config.TRUST_RAILWAY_PROXY==='true'){
      const edge=c.req.header('x-real-ip');if(edge && isIP(edge))ip=edge;
    }
    if(!ip){try{ip=getConnInfo(c).remote.address;}catch{ip='unknown';}}
    const quotaKey=createHash('sha256').update(ip??'unknown').digest('hex');
    if(!d.store.takeQuota(quotaKey)){
      c.header('Retry-After',String(Math.ceil((Date.parse(new Date(Date.now()+86400000).toISOString().slice(0,10)+'T00:00:00Z')-Date.now())/1000)));
      return c.json(error('RATE_LIMITED','Free preview limit is 20 requests per IP per UTC day.','Wait until midnight UTC or use the paid endpoint when enabled.'),429);
    }
    const input=c.get('input');const block=await d.cutoffBlock(input.cutoff??CUTOFF);
    return c.json(preview(evaluate(await d.provider.inspect(input.address,block),input)));
  });
  app.post('/v1/counterparty',validate,async(c,next)=>{
    if(!paid)return c.json(error('PAYMENTS_UNAVAILABLE','Paid checks are not activated yet.','Use /v1/preview/counterparty; activation needs a registered payTo and facilitator key.'),503);
    const header=c.req.header('payment-signature');
    if(header){
      try{
        const identity=paymentIdentity(decodePayment(header));
        if(d.store.payment(identity.key))return c.json(error('PAYMENT_REPLAY','This authorization has already been attempted.','Do not pay again blindly. Check your USDC authorization and settlement transaction; use a fresh authorization for a new request only after reconciliation.'),409);
      }catch{return c.json(error('INVALID_PAYMENT','Malformed or unsupported x402 v2 payment.','Use the PAYMENT-REQUIRED header and a USDC EIP-3009 PAYMENT-SIGNATURE.'),400);}
    }
    await next();
  },...(paid?[paymentGate(d.config,d.store,d.facilitator)]:[]),async c=>{
    const input=c.get('input');const block=await d.cutoffBlock(input.cutoff??CUTOFF);
    return c.json(evaluate(await d.provider.inspect(input.address,block),input));
  });
  return app;
}
