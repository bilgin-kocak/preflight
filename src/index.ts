import {readFileSync} from 'node:fs';
import {serve} from '@hono/node-server';
import {createApp} from './app.js';
import {loadConfig} from './config.js';
import {Store} from './cache.js';
import {readClient} from './chain.js';
import {BlockscoutProvider} from './providers/blockscout.js';
import {CeloscanProvider} from './providers/celoscan.js';
import {Providers,resolveCutoff} from './providers/index.js';
const config=loadConfig();
const store=new Store(config.DATABASE_PATH);
const rpc=readClient(config.CELO_RPC_URL);
const key=config.ETHERSCAN_API_KEY??config.CELOSCAN_API_KEY;
const provider=new Providers(new BlockscoutProvider(),store,key?new CeloscanProvider(key,rpc):undefined);
const app=createApp({config,store,provider,cutoffBlock:cutoff=>resolveCutoff(store,rpc,cutoff),currentBlock:()=>rpc.getBlockNumber(),skill:readFileSync(new URL('../skill.md',import.meta.url),'utf8')});
// Resolve once at startup; a failed lookup is never cached and will retry on demand.
void resolveCutoff(store,rpc).catch(()=>console.warn('Cutoff resolution unavailable; will retry on request.'));
const server=serve({fetch:app.fetch,port:config.PORT,hostname:'0.0.0.0'},()=>console.info(`Preflight listening on ${config.PORT}; payments ${config.PAYMENTS_ENABLED==='true'?'enabled':'disabled'}`));
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
