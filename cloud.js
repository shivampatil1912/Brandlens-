/* BrandLens Hybrid Database Adapter (window.BrandCloud):
   1. Local Transactional Database: IndexedDB ('BrandLensDB') for large binary/image assets & structured state
   2. Cloud PostgreSQL Sync: Optional zero-backend Supabase REST API connector */
(function (root) {
  'use strict';
  const IDB_NAME = 'BrandLensDB', IDB_STORE = 'state', IDB_KEY = 'workspace_v1';
  const CFG_KEY = 'bl_supabase_cfg_v1';


  function authHeaders(key, extra) {
    const h = Object.assign({ 'apikey': key }, extra || {});
    if (String(key || '').startsWith('eyJ')) h['Authorization'] = `Bearer ${key}`;
    return h;
  }

  function getConfig() {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      url: 'https://deailqakayymhewubuif.supabase.co',
      anonKey: 'sb_publishable_TD3KTSjEWAQMr72ly2gmHw_M2VZY48x',
      enabled: true
    };
  }

  function setConfig({ url, anonKey, enabled }) {
    const clean = {
      url: String(url || '').trim().replace(/\/+$/, ''),
      anonKey: String(anonKey || '').trim(),
      enabled: !!(enabled && url && anonKey)
    };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(clean)); } catch (e) {}
    return clean;
  }

  function openIDB() {
    return new Promise((res, rej) => {
      if (typeof indexedDB === 'undefined') return res(null);
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });
  }

  async function idbPut(data) {
    try {
      const idb = await openIDB();
      if (!idb) return false;
      return await new Promise(res => {
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put({ id: IDB_KEY, payload: data, updatedAt: new Date().toISOString() }, IDB_KEY);
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      });
    } catch (e) { return false; }
  }

  async function idbClear() {
    try {
      const idb = await openIDB();
      if (!idb) return false;
      return await new Promise(res => {
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(IDB_KEY);
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      });
    } catch (e) { return false; }
  }

  async function idbGet() {
    try {
      const idb = await openIDB();
      if (!idb) return null;
      return await new Promise(res => {
        const tx = idb.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
        req.onsuccess = () => res(req.result ? req.result.payload : null);
        req.onerror = () => res(null);
      });
    } catch (e) { return null; }
  }

  async function supabasePush(data) {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.url || !cfg.anonKey || typeof fetch !== 'function') return false;
    try {
      const res = await fetch(`${cfg.url}/rest/v1/brandlens_workspaces`, {
        method: 'POST',
        headers: authHeaders(cfg.anonKey, { 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
        body: JSON.stringify({ id: 'default_workspace', payload: data, updated_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) { return false; }
  }

  async function supabasePull() {
    const cfg = getConfig();
    if (!cfg.enabled || !cfg.url || !cfg.anonKey || typeof fetch !== 'function') return null;
    try {
      const res = await fetch(`${cfg.url}/rest/v1/brandlens_workspaces?id=eq.default_workspace&select=payload`, {
        headers: authHeaders(cfg.anonKey)
      });
      if (!res.ok) return null;
      const rows = await res.json();
      return (rows && rows[0] && rows[0].payload) ? rows[0].payload : null;
    } catch (e) { return null; }
  }

  async function syncSave(data) {
    await idbPut(data);
    supabasePush(data);
  }

  async function testConnection({ url, anonKey }) {
    const u = String(url || '').trim().replace(/\/+$/, '');
    const k = String(anonKey || '').trim();
    if (!u || !k) throw new Error('Enter both Supabase Project URL and anon public key.');
    const res = await fetch(`${u}/rest/v1/brandlens_workspaces?select=id&limit=1`, {
      headers: authHeaders(k)
    });
    if (!res.ok) throw new Error(`Supabase responded with HTTP ${res.status}. Make sure you ran supabase_schema.sql in SQL Editor.`);
    return true;
  }

  function status() {
    const cfg = getConfig();
    return {
      indexedDbSupported: typeof indexedDB !== 'undefined',
      supabaseConnected: !!(cfg.enabled && cfg.url && cfg.anonKey),
      supabaseUrl: cfg.url || ''
    };
  }

  root.BrandCloud = { getConfig, setConfig, idbPut, idbGet, idbClear, supabasePush, supabasePull, syncSave, testConnection, status };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BrandCloud;
})(typeof window !== 'undefined' ? window : globalThis);
