import {mkdirSync,writeFileSync} from 'node:fs';
import {rehearsePayment} from './lib/payment-rehearsal.js';
try{
 const result=await rehearsePayment();mkdirSync('data',{recursive:true});
 writeFileSync('data/payment-rehearsal.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}catch{
 console.error('Local payment rehearsal failed. No real keys or funds are used; run the rehearsal test for diagnostics.');process.exitCode=1;
}
