import { supabase } from '../supabase';

const TABLES_STORAGE_KEY = 'hoya_restaurant_tables';
const TABLES_CONFIG_KEY = 'hoya_tables_config';

export const DEFAULT_TABLES = [
  { id: 'tbl-1', name: 'Table 1', token: 'hp_t1_9a2b', isActive: true },
  { id: 'tbl-2', name: 'Table 2', token: 'hp_t2_4c8d', isActive: true },
  { id: 'tbl-3', name: 'Table 3', token: 'hp_t3_7e1f', isActive: true },
  { id: 'tbl-4', name: 'Table 4', token: 'hp_t4_3b5e', isActive: true },
  { id: 'tbl-5', name: 'Table 5', token: 'hp_t5_8d0a', isActive: true },
  { id: 'tbl-6', name: 'Table 6', token: 'hp_t6_2f4c', isActive: true },
  { id: 'tbl-t1', name: 'Terrasse 1', token: 'hp_tr1_6a9b', isActive: true },
  { id: 'tbl-t2', name: 'Terrasse 2', token: 'hp_tr2_1e3d', isActive: true },
  { id: 'tbl-t3', name: 'Terrasse 3', token: 'hp_tr3_5c7f', isActive: true },
  { id: 'tbl-t4', name: 'Terrasse 4', token: 'hp_tr4_0b2e', isActive: true }
];

export const DEFAULT_TABLES_CONFIG = {
  enabled: true,
  paymentMode: 'BOTH', // 'ONLINE' | 'COMPTOIR' | 'BOTH'
  maxUnpaidOrdersPerTable: 3
};

// Generate a cryptographically random, unguessable token
export function generateTableToken(tablePrefix = 't') {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `hp_${tablePrefix}_${rand}`;
}

export function loadLocalTables() {
  if (typeof window === 'undefined') return DEFAULT_TABLES;
  try {
    const saved = localStorage.getItem(TABLES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading local tables:', e);
  }
  return DEFAULT_TABLES;
}

export function saveLocalTables(tables) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
      window.dispatchEvent(new CustomEvent('hoya_tables_updated', { detail: tables }));
    } catch (e) {}
  }
}

export function loadLocalTablesConfig() {
  if (typeof window === 'undefined') return DEFAULT_TABLES_CONFIG;
  try {
    const saved = localStorage.getItem(TABLES_CONFIG_KEY);
    if (saved) return { ...DEFAULT_TABLES_CONFIG, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_TABLES_CONFIG;
}

export function saveLocalTablesConfig(config) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TABLES_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('hoya_tables_config_updated', { detail: config }));
    } catch (e) {}
  }
}

// Cloud synchronization via Supabase
export async function syncTablesToCloud(tables, config) {
  saveLocalTables(tables);
  if (config) saveLocalTablesConfig(config);

  try {
    await supabase.from('orders').upsert({
      id: '__tables_config__',
      status: 'SYSTEM',
      customer_name: 'TABLES_CONFIG',
      customer_phone: JSON.stringify(config || loadLocalTablesConfig()),
      total: tables.length,
      items: tables
    });
  } catch (err) {
    console.warn('Supabase tables sync error:', err);
  }
}

export async function fetchTablesFromCloud() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', '__tables_config__')
      .maybeSingle();

    if (!error && data?.items && Array.isArray(data.items) && data.items.length > 0) {
      saveLocalTables(data.items);
      if (data.customer_phone) {
        try {
          const cfg = JSON.parse(data.customer_phone);
          saveLocalTablesConfig(cfg);
        } catch (e) {}
      }
      return { tables: data.items, config: loadLocalTablesConfig() };
    }
  } catch (e) {}
  return { tables: loadLocalTables(), config: loadLocalTablesConfig() };
}

// Find a table by token
export function findTableByToken(token, tables = null) {
  if (!token) return null;
  const currentTables = tables || loadLocalTables();
  return currentTables.find(t => t.token === token.trim());
}
