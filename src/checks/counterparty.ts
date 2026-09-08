import {CUTOFF} from '../chain.js';
import type {Observation} from '../providers/types.js';
export type CheckInput={address:string;project_wallets?:string[];dominant_funders?:string[];cutoff?:string};
export function evaluate(o:Observation,input:CheckInput) {
  const cutoff=input.cutoff??CUTOFF;
  const active=o.firstActivity && Date.parse(o.firstActivity.at)<Date.parse(cutoff) ? true : o.historyComplete?false:null;
  const has=(list:string[]|undefined,addr:string|undefined)=>!!addr && !!list?.some(a=>a.toLowerCase()===addr.toLowerCase());
  const self=has(input.project_wallets,input.address);
  const ownFunding=has(input.project_wallets,o.firstFunder?.address);
  const dominant=has(input.dominant_funders,o.firstFunder?.address);
  const reasons:string[]=[];
  let verdict:'likely_independent'|'ambiguous'|'likely_excluded'='ambiguous';
  if(self || ((ownFunding||dominant) && o.firstFunderComplete)) {
    verdict='likely_excluded'; reasons.push(self?'Address belongs to the project.':ownFunding?'First funder belongs to the project.':'First funder is a declared dominant funder.');
  } else {
    if(!input.project_wallets?.length) reasons.push('Project wallets were not supplied.');
    if(input.dominant_funders===undefined) reasons.push('Dominant-funder context was not supplied.');
    if(active!==true)reasons.push('No confirmed activity strictly before cutoff.');
    if(!o.firstFunderComplete || !o.firstFunder)reasons.push('First-funder evidence is incomplete or unknown.');
    if(o.isContract)reasons.push('Contract independence requires protocol/ownership context beyond Day 1.');
    if(ownFunding||dominant)reasons.push('Observed project-related funding needs complete history to establish first funding.');
    if(reasons.length===0){verdict='likely_independent';reasons.push('Observed activity before cutoff; confirmed first funder is outside supplied project and dominant-funder lists.');}
  }
  return {address:input.address,checked_at:new Date().toISOString(),observed_at:o.observedAt,cutoff,is_contract:o.isContract,first_tx_at:o.firstActivity?.at??null,first_tx_block:o.firstActivity?.block??null,tx_count:o.txCount,active_before_cutoff:active,
    first_funder:o.firstFunder,first_funder_is_project_wallet:o.firstFunderComplete && o.firstFunder?ownFunding:null,
    distinct_days_active_since_cutoff:new Set(o.recentActivity.filter(t=>Date.parse(t)>=Date.parse(cutoff)).map(t=>t.slice(0,10))).size,
    signals:[{code:active?'PRE_CUTOFF_ACTIVITY':'NO_CONFIRMED_PRE_CUTOFF_ACTIVITY',severity:active?'good':'warn',detail:active?'Observed Celo activity strictly before cutoff.':'No pre-cutoff activity confirmed in available evidence.'}],
    verdict,reasons,coverage:{provider:o.provider,history_complete:o.historyComplete,first_funder_complete:o.firstFunderComplete,recent_days_complete:o.recentComplete,tx_count_exact:o.txCountExact},warnings:o.warnings,
    limitation:'Preflight signals are heuristic observations, not an audit or a hackathon eligibility decision. Declared context is not independently verified; hidden common control and dominance require manual review.'};
}
export function preview(r:ReturnType<typeof evaluate>) {
  // Allowlist fields: new paid fields cannot accidentally leak into the free response.
  return {address:r.address,checked_at:r.checked_at,observed_at:r.observed_at,cutoff:r.cutoff,is_contract:r.is_contract,first_tx_at:r.first_tx_at,first_tx_block:r.first_tx_block,tx_count:r.tx_count,active_before_cutoff:r.active_before_cutoff,distinct_days_active_since_cutoff:r.distinct_days_active_since_cutoff,signals:r.signals,coverage:{provider:r.coverage.provider,history_complete:r.coverage.history_complete,recent_days_complete:r.coverage.recent_days_complete,tx_count_exact:r.coverage.tx_count_exact},limitation:r.limitation};
}
