import {mkdirSync,writeFileSync} from 'node:fs';
import {isAddress} from 'viem';
const url=process.env.PUBLIC_BASE_URL;
if(!url || !url.startsWith('https://'))throw new Error('Set PUBLIC_BASE_URL to the reachable deployment before preparing reviews.');
const wallets=[process.env.AGENT_ADDRESS,process.env.REVIEWER_ADDRESS].filter((x):x is string=>!!x);
if(wallets.length!==2 || !wallets.every(a=>isAddress(a,{strict:false})) || wallets[0]!.toLowerCase()===wallets[1]!.toLowerCase())throw new Error('Set distinct AGENT_ADDRESS and REVIEWER_ADDRESS so both team wallets are excluded.');
mkdirSync('data',{recursive:true});
const document={name:'Preflight — Day 1 baseline',propertyType:'api',propertyUrl:`${url.replace(/\/$/,'')}/skill.md`,budget:10,skillFilters:[],locationFilters:[],excludedBotWallets:wallets,questions:[
 {id:'discovery',type:'freeform',text:'Read /skill.md, call /health and the free preview. Describe any instructions that prevented a successful call, with exact URL, status and error.'},
 {id:'evidence',type:'freeform',text:'Check whether the preview clearly explains its evidence, coverage and uncertainty. Name an observed misleading field or a concrete improvement, with the request used.'},
 {id:'payment',type:'freeform',text:'Call the paid endpoint without payment. Describe the actual activation state, price and payment instructions. If payment is disabled or you cannot pay, say so; do not claim a paid test.'},
 {id:'usefulness',type:'rating',text:'How useful are these Celo counterparty signals for your agent workflow?'},
]};
writeFileSync('data/askbots-round-1.json',JSON.stringify(document,null,2));
console.log('Prepared data/askbots-round-1.json; 10 reviews cost 1.10 USDT. Run: npx askbots@0.2.0 submit --file data/askbots-round-1.json --json (dry-run only).');
console.log('Do not use stock --execute: its CELO-gas, untagged funding violates this project’s transaction policy.');
