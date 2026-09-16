import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const DEFAULT_BASE='https://preflight-production-9071.up.railway.app';
const DEFAULT_ADDRESS='0x23Ca5C88009B94aA554dC37beE88517C92f7c07a';
const USDC='0xceba9300f2b948710d2653dd7b07f33a8b32118c';
const sameAddress=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const validAddress=a=>typeof a==='string'&&/^0x[\da-f]{40}$/i.test(a)&&!/^0x0{40}$/i.test(a);

/** Unsigned HTTP evaluation only: no wallet, credential, RPC or payment client. */
export async function evaluateApi({baseUrl=DEFAULT_BASE,address=DEFAULT_ADDRESS,fetchImpl=fetch,timeoutMs=60000}={}) {
 const base=new URL(baseUrl);
 const loopback=['localhost','127.0.0.1','[::1]'].includes(base.hostname);
 if((base.protocol!=='https:'&&!(base.protocol==='http:'&&loopback))||base.username||base.password||base.search||base.hash||base.pathname!=='/')throw Error('Use an HTTPS origin without credentials, query or path; local HTTP is allowed only for loopback.');
 if(!validAddress(address))throw Error('Use a nonzero public Celo address.');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw Error('Timeout must be between 1 and 60000 ms.');
 const startedAt=new Date().toISOString(),checks=[];
 async function check(id,path,expectedStatus,verify,requestBody) {
  const url=base.origin+path,method=requestBody===undefined?'GET':'POST',started=performance.now();
  const record={id,url,method,...(requestBody===undefined?{}:{requestBody}),expectedStatus};
  try {
   const r=await fetchImpl(url,{method,redirect:'error',credentials:'omit',signal:AbortSignal.timeout(timeoutMs),headers:requestBody===undefined?{}:{'content-type':'application/json'},...(requestBody===undefined?{}:{body:JSON.stringify(requestBody)})});
   const raw=await r.text();let body;
   try {body=JSON.parse(raw);}catch {body=raw;}
   let paymentRequired;
   const required=r.headers.get('payment-required');
   if(required){try{paymentRequired=JSON.parse(Buffer.from(required,'base64').toString());}catch{paymentRequired=null;}}
   let passed=false,validationError;
   try {passed=r.status===expectedStatus&&Boolean(verify(body,paymentRequired));}
   catch {validationError='Received response does not match the expected shape.';}
   // Capture only relevant public protocol headers, never cookies or authorization.
   const headers=Object.fromEntries(['content-type','retry-after'].flatMap(k=>r.headers.has(k)?[[k,r.headers.get(k)]]:[]));
   checks.push({...record,status:r.status,passed,durationMs:Math.round(performance.now()-started),headers,body,...(required?{paymentRequired}:{}),...(validationError?{validationError}:{})});
   return body;
  }catch{
   checks.push({...record,status:null,passed:false,durationMs:Math.round(performance.now()-started),error:'Request failed, timed out, or could not be inspected. No retry or payment was sent.'});
  }
 }
 await check('discovery','/',200,b=>b?.name==='Preflight'&&b?.preview==='/v1/preview/counterparty');
 await check('health','/health',200,b=>b?.status==='ok'&&b?.network==='eip155:42220'&&b?.payments_enabled===true);
 await check('instructions','/skill.md',200,b=>typeof b==='string'&&b.includes('/v1/preview/counterparty'));
 const identity=await check('identity','/.well-known/agent.json',200,b=>b?.type==='https://eips.ethereum.org/EIPS/eip-8004#registration-v1'&&b?.x402Support===true&&validAddress(b?.payTo));
 await check('preview','/v1/preview/counterparty',200,b=>sameAddress(b?.address,address)&&typeof b?.coverage?.history_complete==='boolean'&&typeof b?.coverage?.recent_days_complete==='boolean'&&typeof b?.coverage?.tx_count_exact==='boolean'&&Number.isFinite(Date.parse(b?.observed_at))&&typeof b?.limitation==='string'&&!('verdict' in b)&&!('first_funder' in b),{address});
 await check('invalid-address','/v1/preview/counterparty',400,b=>b?.error?.code==='INVALID_REQUEST'&&b?.error?.issues?.some(i=>i.path==='address'),{address:'invalid'});
 await check('invalid-context','/v1/counterparty',400,b=>b?.error?.code==='INVALID_REQUEST'&&b?.error?.issues?.some(i=>i.path==='project_wallets.0'),{address,project_wallets:['invalid']});
 await check('payment-offer','/v1/counterparty',402,(_b,p)=>p?.x402Version===2&&p?.resource?.url===base.origin+'/v1/counterparty'&&p?.accepts?.length===1&&p.accepts[0].network==='eip155:42220'&&p.accepts[0].scheme==='exact'&&p.accepts[0].amount==='5000'&&sameAddress(p.accepts[0].asset,USDC)&&sameAddress(p.accepts[0].payTo,identity?.payTo)&&p.accepts[0].extra?.name==='USDC'&&p.accepts[0].extra?.version==='2',{address});
 return {schemaVersion:1,mode:'unsigned API evaluation; no payment attempted',startedAt,completedAt:new Date().toISOString(),baseUrl:base.origin,address,allChecksPassed:checks.every(c=>c.passed),checks,limitations:['Checks verify the HTTP contract, not wallet independence, eligibility or product usefulness.','Incomplete coverage is valid evidence, not a failed check. Read the report and form your own assessment.','HTTP 402 verifies a payment offer only; this run does not purchase or verify a paid report.','This output contains no rating or generated review. Include observed evidence and your own candid findings.']};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  if(process.argv.length>4)throw Error('Too many arguments');
  const result=await evaluateApi({baseUrl:process.argv[2],address:process.argv[3]});
  console.log(JSON.stringify(result,null,2));process.exitCode=result.allChecksPassed?0:1;
 }catch {
  console.error('Evaluation could not start. Usage: node scripts/evaluate-api.mjs [HTTPS_ORIGIN] [PUBLIC_CELO_ADDRESS]');process.exitCode=1;
 }
}
