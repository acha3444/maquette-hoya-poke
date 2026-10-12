import { supabase } from '../supabase';

const KIOSK_CONFIG_KEY = 'hoya_kiosk_config';
const KIOSK_DEVICE_ID_KEY = 'hoya_kiosk_device_id';
const KIOSK_COUNTER_KEY = 'hoya_kiosk_daily_counter';

export const DEFAULT_KIOSK_CONFIG = {
  enabled: true,
  idleTimeout: 60, // seconds
  alertCountdown: 15, // seconds
  heroTitle: 'Bienvenue chez Hoya Poké',
  heroSub: 'Des poké bowls frais & sains, préparés minute à Pézenas.',
  heroImage: '/hero.jpg',
  prepTiming: 'BEFORE_PAYMENT', // 'BEFORE_PAYMENT' | 'AFTER_PAYMENT'
  paymentModes: 'COMPTOIR', // 'COMPTOIR' | 'CB_BORNE' | 'BOTH'
  crossSellEnabled: true
};

export function getKioskDeviceId() {
  if (typeof window === 'undefined') return 'Borne 1';
  try {
    const id = localStorage.getItem(KIOSK_DEVICE_ID_KEY);
    if (id) return id;
    localStorage.setItem(KIOSK_DEVICE_ID_KEY, 'Borne 1');
  } catch (e) {}
  return 'Borne 1';
}

export function setKioskDeviceId(id) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(KIOSK_DEVICE_ID_KEY, id);
    } catch (e) {}
  }
}

export function loadLocalKioskConfig() {
  if (typeof window === 'undefined') return DEFAULT_KIOSK_CONFIG;
  try {
    const saved = localStorage.getItem(KIOSK_CONFIG_KEY);
    if (saved) return { ...DEFAULT_KIOSK_CONFIG, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_KIOSK_CONFIG;
}

export function saveLocalKioskConfig(config) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(KIOSK_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent('hoya_kiosk_config_updated', { detail: config }));
    } catch (e) {}
  }
}

// Generate next daily order number (e.g. B-001, B-002) reset each day
export function getNextKioskOrderNumber() {
  if (typeof window === 'undefined') return 'B-001';
  try {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem(KIOSK_COUNTER_KEY);
    let data = { date: today, count: 0 };
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        data = parsed;
      }
    }
    data.count += 1;
    localStorage.setItem(KIOSK_COUNTER_KEY, JSON.stringify(data));
    const padded = String(data.count).padStart(3, '0');
    return `B-${padded}`;
  } catch (e) {
    return `B-${Math.floor(100 + Math.random() * 900)}`;
  }
}

// Cloud synchronization for kiosk config
export async function syncKioskConfigToCloud(config) {
  saveLocalKioskConfig(config);
  try {
    await supabase.from('orders').upsert({
      id: '__kiosk_config__',
      status: 'SYSTEM',
      customer_name: 'KIOSK_CONFIG',
      customer_phone: JSON.stringify(config),
      total: 0,
      items: []
    });
  } catch (e) {
    console.warn('Supabase kiosk config sync error:', e);
  }
}

export async function fetchKioskConfigFromCloud() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', '__kiosk_config__')
      .maybeSingle();

    if (!error && data?.customer_phone) {
      const parsed = JSON.parse(data.customer_phone);
      saveLocalKioskConfig(parsed);
      return parsed;
    }
  } catch (e) {}
  return loadLocalKioskConfig();
}
