import { create } from 'zustand';
import { INITIAL_ORDERS } from './data';

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

const getApiUrl = () => `/api`;

export const useStore = create((set, get) => {
  // Sync with local express server for the demo across devices
  if (typeof window !== 'undefined') {
    // Poll state every 2 seconds to bypass localtunnel limitations
    const pollState = () => {
      fetch(`${getApiUrl()}/state`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.orders) {
            set({ orders: data.orders, restaurantOpen: data.restaurantOpen });
          }
        })
        .catch(e => console.log('Polling failed, backend offline.'));
    };

    // Initial fetch
    pollState();
    // Start polling
    setInterval(pollState, 2000);
  }

  return {
    // App State
    viewMode: initialViewMode(), // 'client', 'restaurant', 'delivery', 'split'
    setViewMode: (mode) => set({ viewMode: mode }),

    // Client State
    cart: [],
    orderType: null, // 'RETRAIT' or 'LIVRAISON'
    setOrderType: (type) => set({ orderType: type }),
    addToCart: (item) => set((state) => ({ cart: [...state.cart, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }] })),
    removeFromCart: (id) => set((state) => ({ cart: state.cart.filter(item => item.id !== id) })),
    clearCart: () => set({ cart: [] }),

    // Restaurant State
    orders: INITIAL_ORDERS,
    restaurantOpen: true,
    setRestaurantOpen: async (isOpen) => {
      set({ restaurantOpen: isOpen }); // optimistic update
      try {
        await fetch(`${getApiUrl()}/toggle-restaurant`, { method: 'POST', headers: { 'Bypass-Tunnel-Reminder': 'true' } });
      } catch (e) {
        // if error, it will just stick to the local optimistic state
      }
    },
    addOrder: async (order) => {
      set((state) => ({ orders: [order, ...state.orders] })); // optimistic update
      try {
        await fetch(`${getApiUrl()}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
          body: JSON.stringify(order)
        });
      } catch (e) {
        // already added optimistically
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
        await fetch(`${getApiUrl()}/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
          body: JSON.stringify({ status })
        });
      } catch (e) {
        // already updated optimistically
      }
    },

    // Delivery State
    deliveryActiveOrderId: '1045',

    // Out of stock ingredients (local for now)
    outOfStock: [],
    toggleStock: (itemId) => set((state) => ({
      outOfStock: state.outOfStock.includes(itemId)
        ? state.outOfStock.filter(id => id !== itemId)
        : [...state.outOfStock, itemId]
    })),

    // Demo Controls
    resetDemo: async () => {
      try {
        await fetch(`${getApiUrl()}/reset`, { method: 'POST', headers: { 'Bypass-Tunnel-Reminder': 'true' } });
        set({ cart: [], outOfStock: [], deliveryActiveOrderId: '1045' });
      } catch (e) {
        set({
          cart: [],
          orders: INITIAL_ORDERS,
          outOfStock: [],
          restaurantOpen: true,
          deliveryActiveOrderId: '1045'
        });
      }
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
