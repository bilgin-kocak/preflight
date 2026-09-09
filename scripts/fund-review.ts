import {mkdirSync,writeFileSync} from 'node:fs';
import {createWalletClient,http,keccak256,parseEventLogs,zeroAddress,type Hex} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {celo} from 'viem/chains';
import {verifyTx} from '@celo/attribution-tags';
import {readClient,USDC,USDC_FEE_CURRENCY} from '../src/chain.js';
import {reviewFundingPlan,recordedFundingStep,ERC20_ABI,ESCROW_ABI,USDT,ESCROW,DEPOSIT} from './lib/review-funding.js';

let stage='configuration';
async function main(){
 const projectId=process.env.ASKBOTS_PROJECT_ID??'';
 const tag=process.env.ATTRIBUTION_TAG??'';
 const plan=reviewFundingPlan(projectId,tag);
 if(!process.argv.includes('--execute')){console.log(JSON.stringify({mode:'dry-run; no transaction sent',projectId,budget:10,depositUSDT:'1.10',maximumGasUSDC:'0.20 total',...plan},(_,v)=>typeof v==='bigint'?v.toString():v,2));return;}
 const pk=process.env.AGENT_PRIVATE_KEY;if(!pk||!/^0x[0-9a-fA-F]{64}$/.test(pk))throw Error('Missing local signing key');
 const account=privateKeyToAccount(pk as Hex);
 if(account.address.toLowerCase()!==process.env.AGENT_ADDRESS?.toLowerCase())throw Error('Wallet mismatch');
 const client=readClient(process.env.CELO_RPC_URL);
 const wallet=createWalletClient({account,chain:celo,transport:http(process.env.CELO_RPC_URL??'https://forno.celo.org')});
 stage='chain and escrow checks';
 if(await client.getChainId()!==42220)throw Error('Wrong chain');
 const escrowRead=<F extends 'usdt'|'paused'|'costPerResponse'|'platformFeePerResponse'>(functionName:F)=>client.readContract({address:ESCROW,abi:ESCROW_ABI,functionName});
 const [token,paused,cost,fee]=await Promise.all([escrowRead('usdt'),escrowRead('paused'),escrowRead('costPerResponse'),escrowRead('platformFeePerResponse')]);
 if(token.toLowerCase()!==USDT.toLowerCase()||paused||cost!==100000n||fee!==10000n)throw Error('Escrow terms changed');
 const project=await client.readContract({address:ESCROW,abi:ESCROW_ABI,functionName:'getProject',args:[plan.projectKey]});
 if(project[0]!==zeroAddress)throw Error('Project already exists on chain; reconcile saved funding transaction and activate only.');
 const [usdt,usdc,native]=await Promise.all([client.readContract({address:USDT,abi:ERC20_ABI,functionName:'balanceOf',args:[account.address]}),client.readContract({address:USDC,abi:ERC20_ABI,functionName:'balanceOf',args:[account.address]}),client.getBalance({address:account.address})]);
 if(usdt<DEPOSIT||usdc<200000n||native!==0n)throw Error('Need 1.10 USDT and 0.20 USDC gas headroom, with zero CELO.');
 mkdirSync('data',{recursive:true});
 const send=async(step:'approve'|'fund')=>{
  stage=step;const request=plan[step];
  return recordedFundingStep({path:`data/askbots-${projectId}-${step}.json`,request,
   prepare:async()=>{
    await client.call({account:account.address,...request});
    // Forno can reject token-denominated fee fields during eth_estimateGas.
    // Estimate units with feeCurrency first, then fill USDC fees separately.
    const estimate=await client.estimateGas({account:account.address,...request});
    const gas=(estimate*120n+99n)/100n;
    const p=await wallet.prepareTransactionRequest({...request,gas});
    console.log(`${step}: maximum USDC gas ${Number(p.gas*p.maxFeePerGas!)/1e18}`);return p;
   },
   sign:async(p)=>{const serialized=await wallet.signTransaction(p);return {serialized,hash:keccak256(serialized)};},
   broadcast:async(serialized)=>{const hash=await client.sendRawTransaction({serializedTransaction:serialized});console.log(`${step}: broadcast ${hash}`);},
   verify:async(hash)=>{
    const receipt=await client.waitForTransactionReceipt({hash,timeout:60000});
    const [decoded,tx]=await Promise.all([verifyTx({client,hash}),client.getTransaction({hash})]);
    if(receipt.status!=='success'||!decoded?.codes.includes(tag)||tx.feeCurrency?.toLowerCase()!==USDC_FEE_CURRENCY.toLowerCase()||tx.from.toLowerCase()!==account.address.toLowerCase()||tx.to?.toLowerCase()!==request.to.toLowerCase()||tx.input!==request.data||tx.value!==0n)throw Error('Receipt or transaction policy verification failed');
    if(step==='fund'){
     const event=parseEventLogs({abi:ESCROW_ABI,logs:receipt.logs,eventName:'ProjectCreated'}).find(e=>e.address.toLowerCase()===ESCROW.toLowerCase()&&e.args.projectId===plan.projectKey&&e.args.creator.toLowerCase()===account.address.toLowerCase()&&e.args.totalDeposit===DEPOSIT);
     if(!event)throw Error('Missing exact ProjectCreated event');
    }
   },
  });
 };
 const allowance=await client.readContract({address:USDT,abi:ERC20_ABI,functionName:'allowance',args:[account.address,ESCROW]});
 if(allowance!==0n&&allowance!==DEPOSIT)throw Error('Unexpected existing allowance; reconcile before changing it.');
 if(allowance===0n)await send('approve');
 if(await client.readContract({address:USDT,abi:ERC20_ABI,functionName:'allowance',args:[account.address,ESCROW]})!==DEPOSIT)throw Error('Approval did not match the deposit');
 const hash=await send('fund');
 stage='final verification';
 const funded=await client.readContract({address:ESCROW,abi:ESCROW_ABI,functionName:'getProject',args:[plan.projectKey]});
 if(funded[0].toLowerCase()!==account.address.toLowerCase()||funded[1]!==10n||funded[2]!==DEPOSIT)throw Error('Funded project mismatch');
 const result={projectId,hash,creator:account.address,budget:10,depositUSDT:'1.10',tag,feeCurrency:'USDC',status:'funded on chain; platform activation required'};
 writeFileSync(`data/askbots-${projectId}-funded.json`,JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result,null,2));
}
main().catch(()=>{console.error(`Review funding stopped at ${stage}. Inspect data/askbots-*-approve.json and *-fund.json before retrying; never delete uncertain transaction records. Upstream error details are suppressed to protect credentials.`);process.exitCode=1;});
