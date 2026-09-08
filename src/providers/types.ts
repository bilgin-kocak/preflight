export type Funder={address:string;token:string;amount:string;at:string};
export type Observation={
  address:string; isContract:boolean; txCount:number; txCountExact:boolean;
  firstActivity:{at:string;block:number}|null; firstFunder:Funder|null;
  firstFunderComplete:boolean; historyComplete:boolean;
  recentActivity:string[]; recentComplete:boolean; provider:string; observedAt:string; warnings:string[];
};
export interface Provider { name:string; inspect(address:string,cutoffBlock:number):Promise<Observation>; health():Promise<boolean>; }
export type ExplorerRow=Record<string,string>;
export type History={rows:ExplorerRow[];complete:boolean};
