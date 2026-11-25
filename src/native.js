/*
 * Jembatan ke fitur Android (Capacitor).
 * Di Android: database SQLite asli, simpan & bagikan file, buka WhatsApp, tombol Back.
 * Di browser (untuk uji coba): SQLite versi web (sql.js) yang disimpan di IndexedDB.
 */
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AppLauncher } from '@capacitor/app-launcher';
import { App } from '@capacitor/app';

const isNative = Capacitor.isNativePlatform();
const DB_NAME = 'burpi';

/* ---------- SQLite asli di Android ---------- */
async function openNativeDb() {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const consistent = (await sqlite.checkConnectionsConsistency()).result;
  const exists = (await sqlite.isConnection(DB_NAME, false)).result;
  const db = consistent && exists
    ? await sqlite.retrieveConnection(DB_NAME, false)
    : await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
  await db.open();
  const clean = (rows) => (rows || []).filter((r) => !('ios_columns' in r));
  return {
    kind: 'SQLite (Android)',
    exec: async (sql) => { await db.execute(sql, true); },
    query: async (sql, params) => clean((await db.query(sql, params || [])).values),
    runSet: async (set) => { if (set.length) await db.executeSet(set, true); }
  };
}

/* ---------- SQLite web (sql.js) untuk uji coba di browser ---------- */
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('burpi-pos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(k) { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function idbSet(k, v) { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }

let sqlJsPromise = null;
function loadSqlJs() {
  if (!sqlJsPromise) sqlJsPromise = window.initSqlJs({ locateFile: (f) => 'lib/' + f });
  return sqlJsPromise;
}
async function openWebDb() {
  const SQL = await loadSqlJs();
  const saved = await idbGet('db');
  const db = saved ? new SQL.Database(saved) : new SQL.Database();
  let timer = null;
  const persist = () => { clearTimeout(timer); timer = setTimeout(() => idbSet('db', db.export()), 300); };
  return {
    kind: 'SQLite (browser)',
    exec: async (sql) => { db.exec(sql); persist(); },
    query: async (sql, params) => {
      const st = db.prepare(sql); st.bind(params || []);
      const rows = []; while (st.step()) rows.push(st.getAsObject()); st.free(); return rows;
    },
    runSet: async (set) => {
      if (!set.length) return;
      db.exec('BEGIN');
      try { set.forEach((s) => db.run(s.statement, s.values || [])); db.exec('COMMIT'); }
      catch (e) { db.exec('ROLLBACK'); throw e; }
      persist();
    }
  };
}

/* ---------- file, tautan, tombol back ---------- */
function u8ToB64(u8) {
  let s = ''; const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
async function toBytes(data) {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  return data;
}
async function saveFile(name, data, mime) {
  const bytes = await toBytes(data);
  if (!isNative) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: mime || 'application/octet-stream' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return { shared: false };
  }
  const res = await Filesystem.writeFile({ path: name, data: u8ToB64(bytes), directory: Directory.Cache });
  try { await Share.share({ title: name, dialogTitle: 'Simpan atau kirim ' + name, files: [res.uri] }); }
  catch (e) { /* pengguna menutup jendela bagikan */ }
  return { shared: true };
}
async function openExternal(url) {
  if (!isNative) { window.open(url, '_blank', 'noopener'); return; }
  try { await AppLauncher.openUrl({ url }); } catch (e) { window.location.href = url; }
}
function onBack(cb) { if (isNative) App.addListener('backButton', cb); }
function minimize() { if (isNative && App.minimizeApp) App.minimizeApp(); }

window.Native = {
  isNative,
  platform: Capacitor.getPlatform(),
  openDb: () => (isNative ? openNativeDb() : openWebDb()),
  loadSqlJs,
  saveFile,
  openExternal,
  onBack,
  minimize
};
