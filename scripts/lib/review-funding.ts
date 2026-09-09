import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {encodeFunctionData,encodePacked,keccak256,parseAbi,type Hex} from 'viem';
import {prepareMainnetWrite,USDC_FEE_CURRENCY} from '../../src/chain.js';

// Verified deployment and CLI project-key encoding: CONFIG.md / AskBots 0.2.0.
export const USDT='0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e' as const;
export const ESCROW='0x58166D5422717F3Db0c4c76139dE6FB11D4a09cf' as const;
export const DEPOSIT=1100000n;
export const ERC20_ABI=parseAbi(['function balanceOf(address) view returns(uint256)','function allowance(address,address) view returns(uint256)','function approve(address,uint256) returns(bool)']);
export const ESCROW_ABI=parseAbi([
 'function createProject(bytes32 projectId,uint256 budget)',
 'function getProject(bytes32) view returns(address creator,uint256 budget,uint256 totalDeposit,uint256 paidCount,bool refunded,uint256 projectCostPerResponse,uint256 projectPlatformFeePerResponse)',
 'function usdt() view returns(address)','function paused() view returns(bool)',
 'function costPerResponse() view returns(uint256)','function platformFeePerResponse() view returns(uint256)',
 'event ProjectCreated(bytes32 indexed projectId,address indexed creator,uint256 totalDeposit)',
]);
export function reviewFundingPlan(projectId:string,tag:string){
 if(!/^[a-z0-9]{1,64}$/.test(projectId))throw Error('Expected an existing AskBots project ID.');
 const projectKey=keccak256(encodePacked(['string'],[projectId]));
 const tagged=(to:typeof USDT|typeof ESCROW,data:Hex)=>({type:'cip64' as const,to,value:0n,...prepareMainnetWrite({tag,feeCurrency:USDC_FEE_CURRENCY,data})});
 return {projectKey,approve:tagged(USDT,encodeFunctionData({abi:ERC20_ABI,functionName:'approve',args:[ESCROW,DEPOSIT]})),fund:tagged(ESCROW,encodeFunctionData({abi:ESCROW_ABI,functionName:'createProject',args:[projectKey,10n]}))};
}
type Request=ReturnType<typeof reviewFundingPlan>['fund'];
type Prepared={type?:string;to?:string|null;data?:string;value?:bigint;feeCurrency?:string|null;chainId?:number;gas?:bigint;maxFeePerGas?:bigint};
export function validateFundingRequest(p:Prepared,expected:Request){
 if(p.type!=='cip64'||p.chainId!==42220||p.to?.toLowerCase()!==expected.to.toLowerCase()||p.data!==expected.data||p.feeCurrency?.toLowerCase()!==USDC_FEE_CURRENCY.toLowerCase()||(p.value??0n)!==0n)throw Error('Prepared funding transaction changed the approved request.');
 if(!p.gas||p.gas<=0n||!p.maxFeePerGas||p.maxFeePerGas<=0n||p.gas*p.maxFeePerGas>100000000000000000n)throw Error('Funding gas estimate exceeds 0.10 USDC per transaction.');
}
// Existing records are reconciled by receipt, never automatically resent.
export async function recordedFundingStep<T extends Prepared>(p:{path:string;request:Request;prepare:()=>Promise<T>;sign:(prepared:T)=>Promise<{hash:Hex;serialized:Hex}>;broadcast:(serialized:Hex)=>Promise<unknown>;verify:(hash:Hex)=>Promise<void>}){
 if(existsSync(p.path)){
  const record=JSON.parse(readFileSync(p.path,'utf8'));
  if(!/^0x[0-9a-f]{64}$/.test(record.hash)||record.to!==p.request.to||record.data!==p.request.data||record.feeCurrency!==p.request.feeCurrency)throw Error('Funding record differs from the expected transaction.');
  await p.verify(record.hash);return record.hash as Hex;
 }
 const prepared=await p.prepare();validateFundingRequest(prepared,p.request);
 const {hash,serialized}=await p.sign(prepared);
 // Exclusive creation also prevents two concurrent runs broadcasting this step.
 writeFileSync(p.path,JSON.stringify({hash,to:p.request.to,data:p.request.data,feeCurrency:p.request.feeCurrency,state:'prepared'},null,2),{flag:'wx',mode:0o600});
 await p.broadcast(serialized);await p.verify(hash);return hash;
}
