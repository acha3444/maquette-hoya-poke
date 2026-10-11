import { create } from 'zustand';
import { INITIAL_ORDERS } from './data';
import { supabase } from './supabase';

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
  return {
    id: String(row.id),
    status: row.status,
    type: row.type || 'RETRAIT',
    time: row.time || '12:00',
    customerName: row.customer_name || row.customerName || 'Client',
    customerPhone: row.customer_phone || row.customerPhone || '06 00 00 00 00',
    address: row.address || '7 rue Anatole France, Pézenas',
    zone: row.zone,
    deliveryFee: Number(row.delivery_fee ?? row.deliveryFee ?? 0),
    total: Number(row.total || 0),
    paymentStatus: row.payment_status || row.paymentStatus || 'PAYÉ',
    items: row.items || [],
    driver: row.driver || 'Alex',
    isLate: Boolean(row.is_late ?? row.isLate ?? false),
    created_at: row.created_at
  };
}

function mapToDb(order) {
  return {
    id: String(order.id),
    status: order.status || 'NOUVELLE',
    type: order.type || 'RETRAIT',
    time: order.time || '12:00',
    customer_name: order.customerName || 'Client',
    customer_phone: order.customerPhone || '06 00 00 00 00',
    address: order.address || null,
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
          set({ orders: data.map(mapFromDb) });
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

    // Client State
    cart: [],
    orderType: null,
    setOrderType: (type) => set({ orderType: type }),
    addToCart: (item) => set((state) => ({ cart: [...state.cart, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }] })),
    removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(item => item.id !== id) })),
    clearCart: () => set({ cart: [] }),

    // Restaurant State
    orders: INITIAL_ORDERS,
    restaurantOpen: true,
    setRestaurantOpen: (isOpen) => set({ restaurantOpen: isOpen }),

    addOrder: async (order) => {
      set((state) => ({ orders: [order, ...state.orders] })); // optimistic update
      try {
        const { error } = await supabase.from('orders').insert(mapToDb(order));
        if (error) console.error('Supabase insert error:', error);
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

    // Demo Controls
    resetDemo: async () => {
      set({ cart: [], orders: INITIAL_ORDERS, outOfStock: [], restaurantOpen: true, deliveryActiveOrderId: '1045' });
      try {
        await supabase.from('orders').delete().neq('id', '0');
        for (const init of INITIAL_ORDERS) {
          await supabase.from('orders').insert(mapToDb(init));
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
