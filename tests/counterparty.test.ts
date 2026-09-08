import {describe,expect,it} from 'vitest';
import {evaluate,preview} from '../src/checks/counterparty.js';
import {normalizeHistory,parseExplorerList} from '../src/providers/history.js';
import type {Observation} from '../src/providers/types.js';
const a='0x1111111111111111111111111111111111111111';
const f='0x2222222222222222222222222222222222222222';
const p='0x3333333333333333333333333333333333333333';
const base:Observation={address:a,isContract:false,txCount:10,txCountExact:true,firstActivity:{at:'2026-01-01T00:00:00.000Z',block:100},firstFunder:{address:f,token:'CELO',amount:'1',at:'2026-01-01T00:00:00.000Z'},firstFunderComplete:true,historyComplete:true,recentActivity:['2026-09-01T00:00:00Z'],recentComplete:true,provider:'fixture',observedAt:'2026-09-08T00:00:00Z',warnings:[]};
const input={address:a,project_wallets:[p],dominant_funders:[]};
describe('counterparty verdicts',()=>{
 it('excludes own wallet, own first funding and declared dominant funder',()=>{
  expect(evaluate(base,{...input,project_wallets:[a]}).verdict).toBe('likely_excluded');
  expect(evaluate(base,{...input,project_wallets:[f]}).verdict).toBe('likely_excluded');
  expect(evaluate(base,{...input,dominant_funders:[f]}).verdict).toBe('likely_excluded');
 });
 it('requires complete funding evidence and explicit project context',()=>{
  expect(evaluate(base,input).verdict).toBe('likely_independent');
  expect(evaluate({...base,firstFunderComplete:false},input).verdict).toBe('ambiguous');
  expect(evaluate(base,{address:a}).verdict).toBe('ambiguous');
  expect(evaluate(base,{address:a,project_wallets:[p]}).verdict).toBe('ambiguous');
  expect(evaluate({...base,isContract:true},input).verdict).toBe('ambiguous');
 });
 it('strictly excludes cutoff timestamp from pre-existing activity',()=>{
  const r=evaluate({...base,firstActivity:{at:'2026-08-28T00:00:00Z',block:75974442}},input);
  expect(r.active_before_cutoff).toBe(false);expect(r.verdict).toBe('ambiguous');
 });
 it('does not leak paid conclusions through preview reasons/signals',()=>{
  const r=preview(evaluate(base,{...input,project_wallets:[f]}));
  const serialized=JSON.stringify(r);
  for(const secret of ['verdict','first_funder','reasons','PROJECT_FUNDED',f]) expect(serialized).not.toContain(secret);
 });
});
describe('history evidence',()=>{
 it('preserves partial-index status and rejects API errors',()=>{
  expect(parseExplorerList({status:'2',message:'not yet processed',result:[]}).complete).toBe(false);
  expect(()=>parseExplorerList({status:'0',message:'NOTOK',result:'rate limit'})).toThrow();
  expect(parseExplorerList({status:'0',message:'No transactions found',result:[]}).rows).toEqual([]);
 });
 it('finds earliest successful inbound positive transfer across all streams',()=>{
  const row=(ts:string,from:string,to:string,value:string)=>({timeStamp:ts,blockNumber:ts,from,to,value,isError:'0',hash:'0x1'});
  const o=normalizeHistory(a,[{rows:[row('10',f,a,'0'),row('20',f,a,'1000000000000000000')],complete:true},{rows:[{...row('15',p,a,'5000000'),tokenSymbol:'USDC',tokenDecimal:'6'}],complete:true},{rows:[{...row('5',f,a,'1'),isError:'1'}],complete:true}]);
  expect(o.firstFunder?.address).toBe(p);expect(o.firstFunder?.amount).toBe('5');expect(o.firstFunderComplete).toBe(true);
 });
 it('does not assert first-funder certainty when a stream was truncated',()=>{
  const r={timeStamp:'1',blockNumber:'1',from:f,to:a,value:'1'};
  expect(normalizeHistory(a,[{rows:[r],complete:true},{rows:[],complete:false}]).firstFunderComplete).toBe(false);
 });
});
