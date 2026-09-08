import {BlockscoutProvider} from '../src/providers/blockscout.js';
import {Store} from '../src/cache.js';
import {readClient} from '../src/chain.js';
import {Providers,resolveCutoff} from '../src/providers/index.js';
import {evaluate,preview} from '../src/checks/counterparty.js';
const store=new Store(':memory:');
try{
  const rpc=readClient();
  if(await rpc.getChainId()!==42220)throw new Error('Wrong network');
  const cutoff=await resolveCutoff(store,rpc);
  const provider=new Providers(new BlockscoutProvider(),store);
  const started=performance.now();
  const address='0x23Ca5C88009B94aA554dC37beE88517C92f7c07a';
  const data=await provider.inspect(address,cutoff);
  const result=preview(evaluate(data,{address}));
  if(result.active_before_cutoff!==true || result.tx_count<1)throw new Error('Known old wallet smoke failed');
  console.log(JSON.stringify({mode:'read-only mainnet smoke',cutoffBlock:cutoff,durationMs:Math.round(performance.now()-started),result},null,2));
}finally{store.close();}
