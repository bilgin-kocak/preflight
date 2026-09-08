import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createWalletClient,encodeFunctionData,http,keccak256,parseAbi,parseEventLogs,type Hex} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {celo} from 'viem/chains';
import {verifyTx} from '@celo/attribution-tags';
import {IDENTITY_REGISTRY,prepareMainnetWrite,readClient,USDC_FEE_CURRENCY} from '../src/chain.js';
// ABI confirmed on Blockscout's registry implementation. See CONFIG.md.
const abi=parseAbi(['function register(string agentURI) returns (uint256 agentId)','event Registered(uint256 indexed agentId, string agentURI, address indexed owner)']);
async function main(){
  const tag=process.env.ATTRIBUTION_TAG??'';
  const uri=process.env.AGENT_URI??'';
  if(!/^https:\/\//.test(uri))throw new Error('Set AGENT_URI to the public HTTPS agent registration document.');
  const guarded=prepareMainnetWrite({tag,feeCurrency:process.env.FEE_CURRENCY??USDC_FEE_CURRENCY,data:encodeFunctionData({abi,functionName:'register',args:[uri]})});
  const request={to:IDENTITY_REGISTRY,...guarded};
  if(!process.argv.includes('--execute')) {console.log(JSON.stringify({mode:'dry-run; no transaction sent',chainId:42220,...request},null,2));return;}
  const pk=process.env.AGENT_PRIVATE_KEY;
  if(!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk))throw new Error('Set AGENT_PRIVATE_KEY locally; never supply it as a CLI flag.');
  const account=privateKeyToAccount(pk as Hex);
  if(account.address.toLowerCase()!==process.env.AGENT_ADDRESS?.toLowerCase())throw new Error('AGENT_ADDRESS must match the registered signing wallet.');
  mkdirSync('data',{recursive:true});
  const statePath=`data/identity-${account.address.toLowerCase()}.json`;
  if(existsSync(statePath)) {
    const record=JSON.parse(readFileSync(statePath,'utf8')) as {hash:string};
    throw new Error(`Identity transaction already prepared: ${record.hash}. Reconcile it before another registration; automatic resend refused.`);
  }
  const client=readClient(process.env.CELO_RPC_URL);
  if(await client.getChainId()!==42220)throw new Error('Refusing a non-Celo-mainnet RPC.');
  if(await client.getBalance({address:account.address})!==0n)throw new Error('Day 1 agent wallet must hold zero CELO. Gas is paid with USDC.');
  await client.call({account:account.address,...request});
  const wallet=createWalletClient({account,chain:celo,transport:http(process.env.CELO_RPC_URL??'https://forno.celo.org')});
  const prepared=await wallet.prepareTransactionRequest(request);
  if(!prepared.gas || !prepared.maxFeePerGas || prepared.gas*prepared.maxFeePerGas>100000000000000000n)throw new Error('Estimated USDC gas exceeds the 0.10 USDC cap or cannot be estimated.');
  // Recheck final prepared data/currency; client preparation cannot weaken the policy.
  if(prepared.feeCurrency?.toLowerCase()!==USDC_FEE_CURRENCY.toLowerCase() || prepared.data!==guarded.data)throw new Error('Prepared transaction violated attribution/USDC policy.');
  const serialized=await wallet.signTransaction(prepared);
  const hash=keccak256(serialized);
  writeFileSync(statePath,JSON.stringify({hash,address:account.address,tag,uri,state:'prepared'},null,2),{flag:'wx',mode:0o600});
  console.log(`Prepared identity transaction ${hash}; record saved before broadcast.`);
  await client.sendRawTransaction({serializedTransaction:serialized});
  const receipt=await client.waitForTransactionReceipt({hash});
  const [decoded,transaction]=await Promise.all([verifyTx({client,hash}),client.getTransaction({hash})]);
  if(receipt.status!=='success' || !decoded?.codes.includes(tag) || transaction.feeCurrency?.toLowerCase()!==USDC_FEE_CURRENCY.toLowerCase())throw new Error(`Transaction verification failed. Inspect ${hash}; do not resend.`);
  const event=parseEventLogs({abi,logs:receipt.logs,eventName:'Registered'}).find(e=>e.address.toLowerCase()===IDENTITY_REGISTRY.toLowerCase()&&e.args.owner.toLowerCase()===account.address.toLowerCase());
  if(!event)throw new Error(`Missing Registered event; inspect ${hash}.`);
  const result={hash,agentId:event.args.agentId.toString(),tag,tagVerified:true,feeCurrency:'USDC',agentUrl:`https://8004scan.io/agents/celo/${event.args.agentId}`};
  writeFileSync(statePath,JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Registration failed');process.exitCode=1;});
