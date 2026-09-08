import {mkdirSync,writeFileSync} from 'node:fs';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
// Exclusive creation: reruns cannot replace a funded wallet. Never print keys.
mkdirSync('.secrets',{recursive:true,mode:0o700});
const agent=generatePrivateKey(),reviewer=generatePrivateKey();
const addresses={agent:privateKeyToAccount(agent).address,reviewer:privateKeyToAccount(reviewer).address};
writeFileSync('.secrets/wallets.env',`AGENT_PRIVATE_KEY=${agent}\nAGENT_ADDRESS=${addresses.agent}\nREVIEWER_PRIVATE_KEY=${reviewer}\nREVIEWER_ADDRESS=${addresses.reviewer}\n`,{flag:'wx',mode:0o600});
console.log(JSON.stringify({addresses,keyFile:'.secrets/wallets.env',network:'Celo mainnet',funded:false},null,2));
