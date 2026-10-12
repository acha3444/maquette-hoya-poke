import { supabase } from '../supabase';

const FEATURES_STORAGE_KEY = 'hoya_restaurant_features';

export const DEFAULT_FEATURES = {
  accounts: true,
  loyalty: true,
  emailing: true
};

export function loadLocalFeatures() {
  if (typeof window === 'undefined') return DEFAULT_FEATURES;
  try {
    const saved = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        accounts: parsed.accounts ?? true,
        // Loyalty strictly requires accounts to be enabled
        loyalty: (parsed.accounts ?? true) ? (parsed.loyalty ?? true) : false,
        emailing: parsed.emailing ?? true
      };
    }
  } catch (e) {
    console.warn('Error reading local features:', e);
  }
  return DEFAULT_FEATURES;
}

export function saveLocalFeatures(features) {
  if (typeof window !== 'undefined') {
    try {
      const safeFeatures = {
        accounts: Boolean(features.accounts),
        loyalty: Boolean(features.accounts && features.loyalty),
        emailing: Boolean(features.emailing)
      };
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(safeFeatures));
      window.dispatchEvent(new CustomEvent('hoya_features_updated', { detail: safeFeatures }));
    } catch (e) {}
  }
}

export async function syncFeaturesToCloud(features) {
  saveLocalFeatures(features);
  try {
    // 1. Try modern restaurant_settings table
    const { error } = await supabase.from('restaurant_settings').upsert({
      key: 'feature_flags',
      value: features,
      updated_at: new Date().toISOString()
    });

    if (error) {
      // 2. Resilient fallback via orders table
      await supabase.from('orders').upsert({
        id: '__features_config__',
        status: 'SYSTEM',
        customer_name: 'FEATURES_CONFIG',
        customer_phone: JSON.stringify(features),
        total: 0,
        items: []
      });
    }
  } catch (err) {
    console.warn('Cloud features sync error:', err);
  }
}

export async function fetchFeaturesFromCloud() {
  try {
    // 1. Try restaurant_settings
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('value')
      .eq('key', 'feature_flags')
      .maybeSingle();

    if (!error && data?.value) {
      saveLocalFeatures(data.value);
      return data.value;
    }

    // 2. Fallback to orders
    const { data: oData } = await supabase
      .from('orders')
      .select('customer_phone')
      .eq('id', '__features_config__')
      .maybeSingle();

    if (oData?.customer_phone) {
      const parsed = JSON.parse(oData.customer_phone);
      saveLocalFeatures(parsed);
      return parsed;
    }
  } catch (e) {}
  return loadLocalFeatures();
}
