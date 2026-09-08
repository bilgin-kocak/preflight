import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type PaymentRow = { key:string; payer:string; amount:string; token:string; endpoint:string; state:'pending'|'settled'; tx:string|null; created_at:string; settled_at:string|null };
export class Store {
  private db: Database.Database;
  constructor(path:string) {
    if(path !== ':memory:') mkdirSync(dirname(path),{recursive:true});
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL'); this.db.pragma('busy_timeout = 5000');
    this.db.exec(`CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER);
      CREATE TABLE IF NOT EXISTS quotas (ip TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(ip,day));
      CREATE TABLE IF NOT EXISTS payments (key TEXT PRIMARY KEY, payer TEXT NOT NULL, amount TEXT NOT NULL, token TEXT NOT NULL, endpoint TEXT NOT NULL, state TEXT NOT NULL, tx TEXT, created_at TEXT NOT NULL, settled_at TEXT);`);
  }
  get<T>(key:string, now=Date.now()):T|null {
    const row=this.db.prepare('SELECT value,expires FROM cache WHERE key=?').get(key) as {value:string;expires:number|null}|undefined;
    if(!row) return null;
    if(row.expires !== null && row.expires <= now) { this.db.prepare('DELETE FROM cache WHERE key=?').run(key); return null; }
    return JSON.parse(row.value) as T;
  }
  put(key:string,value:unknown,ttl:number|null,now=Date.now()) {
    this.db.prepare('INSERT OR REPLACE INTO cache VALUES (?,?,?)').run(key,JSON.stringify(value),ttl===null?null:now+ttl);
  }
  takeQuota(ip:string,limit=20,now=Date.now()) {
    const day=new Date(now).toISOString().slice(0,10);
    return this.db.transaction(() => {
      this.db.prepare('DELETE FROM quotas WHERE day < ?').run(day);
      this.db.prepare('INSERT OR IGNORE INTO quotas VALUES (?,?,0)').run(ip,day);
      return this.db.prepare('UPDATE quotas SET count=count+1 WHERE ip=? AND day=? AND count < ?').run(ip,day,limit).changes===1;
    })();
  }
  reservePayment(key:string,payer:string,amount:string,token:string,endpoint:string) {
    return this.db.prepare("INSERT OR IGNORE INTO payments (key,payer,amount,token,endpoint,state,created_at) VALUES (?,?,?,?,?,'pending',?)")
      .run(key,payer,amount,token,endpoint,new Date().toISOString()).changes===1;
  }
  settlePayment(key:string,tx:string) {
    this.db.prepare("UPDATE payments SET state='settled',tx=?,settled_at=? WHERE key=? AND state='pending'").run(tx,new Date().toISOString(),key);
  }
  payment(key:string) { return this.db.prepare('SELECT * FROM payments WHERE key=?').get(key) as PaymentRow|undefined; }
  stats() {
    const cache=this.db.prepare('SELECT count(*) AS n FROM cache WHERE expires IS NULL OR expires>?').get(Date.now()) as {n:number};
    const payment=this.db.prepare("SELECT max(settled_at) AS last FROM payments WHERE state='settled'").get() as {last:string|null};
    return {cacheSize:cache.n,lastSettlement:payment.last};
  }
  close() { this.db.close(); }
}
