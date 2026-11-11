import {DatabaseSync} from 'node:sqlite';
export class Store {
 constructor(path){this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS quotes(id TEXT PRIMARY KEY, owner TEXT NOT NULL, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, received TEXT NOT NULL);');}
 save(owner,q){this.db.prepare('INSERT INTO quotes(id,owner,body) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE quotes.owner=excluded.owner').run(q.id,owner,JSON.stringify(q));}
 get(owner,id){const r=this.db.prepare('SELECT body FROM quotes WHERE id=? AND owner=?').get(id,owner);return r?JSON.parse(r.body):null;}
 list(owner){return this.db.prepare('SELECT body FROM quotes WHERE owner=? ORDER BY rowid DESC').all(owner).map(x=>JSON.parse(x.body));}
 findOrder(orderId){for(const r of this.db.prepare('SELECT owner,body FROM quotes').all()){const q=JSON.parse(r.body);if(q.orderId===orderId)return {owner:r.owner,quote:q};}return null;}
 hasEvent(id){return Boolean(this.db.prepare('SELECT id FROM events WHERE id=?').get(id));}
 recordEvent(id){this.db.prepare('INSERT OR IGNORE INTO events(id,received) VALUES(?,?)').run(id,new Date().toISOString());}
 close(){this.db.close();}
}
