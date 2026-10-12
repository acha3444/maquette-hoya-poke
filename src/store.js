import { create } from 'zustand';
import { INITIAL_ORDERS, MENU, PROMO_CODES } from './data';
import { supabase } from './supabase';
import { loadLocalTables, loadLocalTablesConfig, saveLocalTables, saveLocalTablesConfig, syncTablesToCloud, fetchTablesFromCloud } from './services/tableService';
import { loadLocalKioskConfig, saveLocalKioskConfig, syncKioskConfigToCloud, fetchKioskConfigFromCloud } from './services/kioskService';

const loadInitialMenu = () => {
  if (typeof window === 'undefined') return MENU;
  try {
    const saved = localStorage.getItem('hoya_custom_menu');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...MENU,
        ...parsed,
        classiques: parsed.classiques || MENU.classiques,
        sides: parsed.sides || MENU.sides,
        desserts: parsed.desserts || MENU.desserts,
        boissons: parsed.boissons || MENU.boissons,
        bases: parsed.bases || MENU.bases,
        fruitsLegumes: parsed.fruitsLegumes || MENU.fruitsLegumes,
        proteines: parsed.proteines || MENU.proteines,
        sauces: parsed.sauces || MENU.sauces,
        toppings: parsed.toppings || MENU.toppings
      };
    }
  } catch (e) {
    console.warn('Error loading custom menu:', e);
  }
  return MENU;
};

const loadCaisseHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('hoya_caisse_history');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
};

const loadLoyaltyStamps = () => {
  if (typeof window === 'undefined') return 3;
  try {
    const saved = localStorage.getItem('hoya_loyalty_stamps');
    return saved !== null ? Math.min(10, Math.max(0, parseInt(saved, 10))) : 3;
  } catch (e) {}
  return 3;
};

const loadFavorites = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('hoya_favorites');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [
    {
      id: 'fav-demo-1',
      name: 'Mon Poké Fraîcheur Saumon',
      price: 13.90,
      size: 'M',
      composition: ['Riz vinaigré', 'Saumon cru mariné', 'Avocat', 'Mangue', 'Edamame', 'Concombre', 'Carotte', 'Sriracha mayo', 'Sésames noirs']
    }
  ];
};

const SAMPLE_CUSTOMERS = [
  { name: 'Camille', phone: '06 41 22 87 10', address: '12 cours Jean Jaurès, Pézenas' },
  { name: 'Nicolas', phone: '07 68 03 55 92', address: '3 rue de la Foire, Pézenas' },
  { name: 'Inès', phone: '06 12 90 44 31', address: '18 avenue de Verdun, Pézenas' },
  { name: 'Hugo', phone: '06 77 15 08 63', address: '5 place Gambetta, Pézenas' }
];

const SAMPLE_ITEMS = [
  { name: 'Poké Classique Saumon (M)', price: 11.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Saumon cru mariné', 'Soja sucrée'] },
  { name: 'Poké Classique Poulet (L)', price: 14.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Poulet frit maison', 'Sriracha mayo'] },
  { name: 'Tiramisu spéculoos', price: 4.50, composition: ['Tiramisu spéculoos'] },
  { name: 'Thé pétillant artisanal', price: 3.50, composition: ['Thé pétillant artisanal'] }
];

const VIEW_MODES = ['client', 'restaurant', 'delivery', 'split'];

const initialViewMode = () => {
  if (typeof window === 'undefined') return 'split';
  const fromUrl = new URLSearchParams(window.location.search).get('view');
  if (VIEW_MODES.includes(fromUrl)) return fromUrl;
  return window.innerWidth < 1024 ? 'client' : 'split';
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function mapFromDb(row) {
  const isBorne = row.source === 'BORNE' || 
    Boolean(row.kiosk_id) || 
    String(row.id).startsWith('B-') || 
    (row.customer_name && row.customer_name.includes('BORNE')) || 
    (row.address && row.address.includes('Borne'));

  const isTable = row.source === 'TABLE' || 
    Boolean(row.table_name) || 
    (row.customer_name && /Table \d+|Terrasse \d+/i.test(row.customer_name)) || 
    (row.address && /Table \d+|Terrasse \d+/i.test(row.address));

  const extractedTableName = row.table_name || 
    row.address?.match(/(Table\s*\d+|Terrasse\s*\d+)/i)?.[0] || 
    row.customer_name?.match(/(Table\s*\d+|Terrasse\s*\d+)/i)?.[0] || 
    null;

  const extractedDailyNumber = row.daily_number || 
    (String(row.id).startsWith('B-') ? String(row.id) : null) || 
    row.customer_name?.match(/B-\d+/)?.[0] || 
    row.address?.match(/B-\d+/)?.[0] || 
    null;

  const extractedKioskId = row.kiosk_id || 
    (isBorne ? (row.address?.match(/Borne\s*\d+/i)?.[0] || 'Borne 1') : null);

  const finalSource = row.source || (isTable ? 'TABLE' : isBorne ? 'BORNE' : (row.type === 'LIVRAISON' ? 'LIVRAISON' : 'RETRAIT'));

  return {
    id: String(row.id),
    status: row.status,
    type: row.type || (isTable || isBorne ? 'SUR_PLACE' : 'RETRAIT'),
    source: finalSource,
    tableName: extractedTableName,
    tableToken: row.table_token || null,
    kioskId: extractedKioskId,
    dailyNumber: extractedDailyNumber,
    time: row.time || '12:00',
    customerName: row.customer_name || row.customerName || (isTable ? `Client ${extractedTableName || ''}`.trim() : isBorne ? `Borne (${extractedDailyNumber || 'B-001'})` : 'Client'),
    customerPhone: row.customer_phone || row.customerPhone || '06 00 00 00 00',
    address: row.address || (isTable ? `Sur place (${extractedTableName || 'Table'})` : isBorne ? 'Sur place (Borne)' : '7 Rue Anatole France, Pézenas'),
    zone: row.zone,
    deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? 0),
    total: Number(row.total || 0),
    paymentStatus: row.payment_status || row.paymentStatus || 'PAYÉ',
    items: Array.isArray(row.items) ? row.items : [],
    driver: row.driver || 'Alex',
    isLate: Boolean(row.is_late ?? row.isLate ?? false),
    created_at: row.created_at
  };
}

function mapToDbFull(order) {
  return {
    id: String(order.id),
    status: order.status || 'NOUVELLE',
    type: order.type || 'RETRAIT',
    source: order.source || (order.tableName ? 'TABLE' : order.kioskId ? 'BORNE' : 'WEB'),
    table_name: order.tableName || null,
    table_token: order.tableToken || null,
    kiosk_id: order.kioskId || null,
    daily_number: order.dailyNumber || null,
    time: order.time || '12:00',
    customer_name: order.customerName || (order.tableName ? `Client ${order.tableName}` : 'Client'),
    customer_phone: order.customerPhone || '06 00 00 00 00',
    address: order.address || (order.tableName ? `Sur place (${order.tableName})` : null),
    zone: order.zone || null,
    delivery_fee: order.deliveryFee || 0,
    total: Number(order.total || 0),
    payment_status: order.paymentStatus || 'PAYÉ',
    items: order.items || [],
    driver: order.driver || null,
    is_late: Boolean(order.isLate || false)
  };
}

function mapToDbCompat(order) {
  let enrichedCustomerName = order.customerName || 'Client';
  let enrichedAddress = order.address || null;

  if (order.source === 'TABLE' || order.tableName) {
    if (!enrichedCustomerName.includes('Table') && !enrichedCustomerName.includes('Terrasse')) {
      enrichedCustomerName = `${enrichedCustomerName} [${order.tableName || 'Table'}]`;
    }
    if (!enrichedAddress) enrichedAddress = `Sur place · ${order.tableName || 'Table'}`;
  } else if (order.source === 'BORNE' || order.kioskId || String(order.id).startsWith('B-')) {
    const num = order.dailyNumber || order.id;
    if (!enrichedCustomerName.includes('BORNE')) {
      enrichedCustomerName = `${enrichedCustomerName} [BORNE ${num}]`;
    }
    if (!enrichedAddress) enrichedAddress = `Sur place (Borne) · ${num}`;
  }

  return {
    id: String(order.id),
    status: order.status || 'NOUVELLE',
    type: order.type || (order.tableName || order.source === 'BORNE' ? 'SUR_PLACE' : 'RETRAIT'),
    time: order.time || '12:00',
    customer_name: enrichedCustomerName,
    customer_phone: order.customerPhone || (order.source === 'BORNE' ? 'BORNE' : '06 00 00 00 00'),
    address: enrichedAddress,
    zone: order.zone || null,
    delivery_fee: order.deliveryFee || 0,
    total: Number(order.total || 0),
    payment_status: order.paymentStatus || 'PAYÉ',
    items: order.items || [],
    driver: order.driver || null,
    is_late: Boolean(order.isLate || false)
  };
}

export const useStore = create((set, get) => {
  if (typeof window !== 'undefined') {
    // 1. Initial fetch from Supabase Cloud
    const initSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const validOrders = data.filter(row => row.id !== '__pin_config__' && row.id !== '__tables_config__' && row.id !== '__kiosk_config__' && row.status !== 'SYSTEM');
          set({ orders: validOrders.map(mapFromDb) });

          // Fetch tables config from cloud record
          const tablesRow = data.find(r => r.id === '__tables_config__');
          if (tablesRow?.items && Array.isArray(tablesRow.items)) {
            saveLocalTables(tablesRow.items);
            let cfg = loadLocalTablesConfig();
            if (tablesRow.customer_phone) {
              try { cfg = JSON.parse(tablesRow.customer_phone); saveLocalTablesConfig(cfg); } catch (e) {}
            }
            set({ tables: tablesRow.items, tablesConfig: cfg });
          }

          // Fetch kiosk config from cloud record
          const kioskRow = data.find(r => r.id === '__kiosk_config__');
          if (kioskRow?.customer_phone) {
            try {
              const kcfg = JSON.parse(kioskRow.customer_phone);
              saveLocalKioskConfig(kcfg);
              set({ kioskConfig: kcfg });
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Supabase initial fetch fallback:', e);
      }
    };

    initSupabase();

    // 2. Realtime WebSocket subscription from Supabase
    try {
      supabase
        .channel('public:orders_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.new?.id === '__pin_config__' || payload.old?.id === '__pin_config__') {
            return; // Managed by StaffGuard PIN sync
          }
          if (payload.new?.id === '__tables_config__') {
            const items = payload.new.items;
            if (Array.isArray(items)) {
              saveLocalTables(items);
              let cfg = loadLocalTablesConfig();
              if (payload.new.customer_phone) {
                try { cfg = JSON.parse(payload.new.customer_phone); saveLocalTablesConfig(cfg); } catch (e) {}
              }
              set({ tables: items, tablesConfig: cfg });
            }
            return;
          }
          if (payload.new?.id === '__kiosk_config__') {
            if (payload.new.customer_phone) {
              try {
                const kcfg = JSON.parse(payload.new.customer_phone);
                saveLocalKioskConfig(kcfg);
                set({ kioskConfig: kcfg });
              } catch (e) {}
            }
            return;
          }
          if (payload.eventType === 'INSERT') {
            const newOrder = mapFromDb(payload.new);
            set(state => {
              if (state.orders.some(o => o.id === newOrder.id)) return state;
              return { orders: [newOrder, ...state.orders] };
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapFromDb(payload.new);
            set(state => ({
              orders: state.orders.map(o => o.id === updated.id ? updated : o)
            }));
          } else if (payload.eventType === 'DELETE') {
            set(state => ({
              orders: state.orders.filter(o => o.id !== String(payload.old?.id))
            }));
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase realtime fallback:', e);
    }
  }

  return {
    // App State
    viewMode: initialViewMode(),
    setViewMode: (mode) => set({ viewMode: mode }),

    // Table Session State (QR code /t/:token)
    currentTable: null,
    setCurrentTable: (table) => set({ currentTable: table }),
    tables: loadLocalTables(),
    tablesConfig: loadLocalTablesConfig(),
    updateTables: (newTables) => {
      saveLocalTables(newTables);
      syncTablesToCloud(newTables, get().tablesConfig);
      set({ tables: newTables });
    },
    updateTablesConfig: (cfg) => {
      saveLocalTablesConfig(cfg);
      syncTablesToCloud(get().tables, cfg);
      set({ tablesConfig: cfg });
    },

    // Kiosk State & Config (/borne)
    kioskConfig: loadLocalKioskConfig(),
    updateKioskConfig: (cfg) => {
      saveLocalKioskConfig(cfg);
      syncKioskConfigToCloud(cfg);
      set({ kioskConfig: cfg });
    },

    // Client State
    cart: [],
    orderType: null,
    setOrderType: (type) => set({ orderType: type }),
    addToCart: (item) => set((state) => ({ cart: [...state.cart, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }] })),
    removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(item => item.id !== id) })),
    clearCart: () => set({ cart: [] }),

    // Loyalty & Gamification
    loyaltyStamps: loadLoyaltyStamps(),
    addLoyaltyStamp: (count = 1) => set(state => {
      const next = Math.min(10, state.loyaltyStamps + count);
      try { localStorage.setItem('hoya_loyalty_stamps', next); } catch (e) {}
      return { loyaltyStamps: next };
    }),
    claimLoyaltyReward: () => set(() => {
      try { localStorage.setItem('hoya_loyalty_stamps', 0); } catch (e) {}
      return { loyaltyStamps: 0 };
    }),

    // Favorites & Quick Re-order
    favorites: loadFavorites(),
    toggleFavorite: (bowl) => set(state => {
      const exists = state.favorites.some(f => f.name === bowl.name || f.id === bowl.id);
      let updated;
      if (exists) {
        updated = state.favorites.filter(f => f.name !== bowl.name && f.id !== bowl.id);
      } else {
        const newFav = {
          id: `fav-${Date.now()}`,
          name: bowl.cartName || bowl.name || 'Mon Poké Favori',
          price: bowl.price || 12.90,
          size: bowl.size || 'M',
          composition: bowl.composition || [bowl.name]
        };
        updated = [newFav, ...state.favorites];
      }
      try { localStorage.setItem('hoya_favorites', JSON.stringify(updated)); } catch (e) {}
      return { favorites: updated };
    }),

    // Promo Codes
    activePromo: null,
    applyPromo: (code) => {
      const trimmed = (code || '').trim().toUpperCase();
      const promo = PROMO_CODES[trimmed];
      if (!promo) {
        return { success: false, message: 'Code promo invalide.' };
      }
      set({ activePromo: promo });
      return { success: true, message: `Code ${promo.code} appliqué (${promo.label}) !` };
    },
    removePromo: () => set({ activePromo: null }),

    // Restaurant State
    orders: INITIAL_ORDERS,
    restaurantOpen: true,
    setRestaurantOpen: (isOpen) => set({ restaurantOpen: isOpen }),

    addOrder: async (order) => {
      set((state) => ({ orders: [order, ...state.orders] })); // optimistic update
      try {
        const fullPayload = mapToDbFull(order);
        const { error } = await supabase.from('orders').insert(fullPayload);
        if (error) {
          // Fallback to compat payload if custom columns (source, table_name, etc.) are not in schema cache
          console.warn('Supabase full insert fallback (retrying with compatible schema):', error.message);
          const compatPayload = mapToDbCompat(order);
          const { error: compatErr } = await supabase.from('orders').insert(compatPayload);
          if (compatErr) {
            console.error('Supabase compat insert error:', compatErr);
          }
        }
      } catch (e) {
        console.error('Supabase insert exception:', e);
      }
    },

    placeOrder: async (orderData) => {
      const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        status: 'NOUVELLE',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        ...orderData
      };
      await get().addOrder(newOrder);
      get().clearCart();
      return newOrder.id;
    },

    updateOrderStatus: async (id, status) => {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })); // optimistic update
      try {
        const { error } = await supabase.from('orders').update({ status }).eq('id', String(id));
        if (error) console.error('Supabase update error:', error);
      } catch (e) {
        console.error('Supabase update exception:', e);
      }
    },

    // Delivery State
    deliveryActiveOrderId: '1045',

    // Out of stock
    outOfStock: [],
    toggleStock: (itemId) => set((state) => ({
      outOfStock: state.outOfStock.includes(itemId)
        ? state.outOfStock.filter(id => id !== itemId)
        : [...state.outOfStock, itemId]
    })),

    // Menu Management State
    menu: loadInitialMenu(),

    addMenuItem: (category, item) => {
      set(state => {
        const currentList = state.menu[category] || [];
        const newItem = {
          ...item,
          id: item.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        };
        const updatedMenu = {
          ...state.menu,
          [category]: [newItem, ...currentList]
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('hoya_custom_menu', JSON.stringify(updatedMenu));
        }
        return { menu: updatedMenu };
      });
    },

    updateMenuItem: (category, id, updatedFields) => {
      set(state => {
        const currentList = state.menu[category] || [];
        const updatedMenu = {
          ...state.menu,
          [category]: currentList.map(item => item.id === id ? { ...item, ...updatedFields } : item)
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('hoya_custom_menu', JSON.stringify(updatedMenu));
        }
        return { menu: updatedMenu };
      });
    },

    deleteMenuItem: (category, id) => {
      set(state => {
        const currentList = state.menu[category] || [];
        const updatedMenu = {
          ...state.menu,
          [category]: currentList.filter(item => item.id !== id)
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('hoya_custom_menu', JSON.stringify(updatedMenu));
        }
        return { menu: updatedMenu };
      });
    },

    resetMenu: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hoya_custom_menu');
      }
      set({ menu: MENU });
    },

    // Caisse & Bilan Z History
    caisseHistory: loadCaisseHistory(),

    saveCaisseCloture: (clotureData) => {
      set(state => {
        const nextHistory = [clotureData, ...state.caisseHistory];
        if (typeof window !== 'undefined') {
          localStorage.setItem('hoya_caisse_history', JSON.stringify(nextHistory));
        }
        return { caisseHistory: nextHistory };
      });
    },

    // Demo Controls
    resetDemo: async () => {
      set({ cart: [], orders: INITIAL_ORDERS, outOfStock: [], restaurantOpen: true, deliveryActiveOrderId: '1045' });
      try {
        await supabase.from('orders').delete().neq('id', '__pin_config__');
        for (const init of INITIAL_ORDERS) {
          try {
            const { error } = await supabase.from('orders').insert(mapToDbFull(init));
            if (error) {
              await supabase.from('orders').insert(mapToDbCompat(init));
            }
          } catch (e) {}
        }
      } catch (e) {}
    },

    simulateNewOrder: () => {
      const customer = pick(SAMPLE_CUSTOMERS);
      const items = [pick(SAMPLE_ITEMS.slice(0, 2)), pick(SAMPLE_ITEMS.slice(2))];
      const subtotal = items.reduce((sum, i) => sum + i.price, 0);
      const newOrder = {
        id: (Math.floor(Math.random() * 9000) + 1000).toString(),
        status: 'NOUVELLE',
        type: 'LIVRAISON',
        time: new Date(Date.now() + 30 * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        zone: 1,
        deliveryFee: 2.50,
        total: subtotal + 2.50,
        paymentStatus: 'PAYÉ',
        items
      };
      get().addOrder(newOrder);
    }
  };
});
