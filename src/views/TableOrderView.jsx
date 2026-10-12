import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  CreditCard, Banknote, AlertTriangle, Globe, ChevronRight, X
} from 'lucide-react';
import { useStore } from '../store';
import { MENU, FORMULES } from '../data';
import { formatPrice } from '../format';
import { playSuccessSound } from '../sound';
import HoyaMark from '../components/brand/HoyaMark';
import BowlArt from '../components/brand/BowlArt';
import ProductThumb from '../components/brand/ProductThumb';
import AnimatedMark from '../components/brand/AnimatedMark';
import { BowlScene } from '../components/BowlVisualizer';
import FormuleModal from '../components/FormuleModal';
import { findTableByToken } from '../services/tableService';
import './table/tableOrder.css';

const TEXTS = {
  FR: {
    serviceSurPlace: 'Sur place · Service à table',
    tablePrefix: 'Table',
    changeLang: 'English',
    welcome: 'Bienvenue',
    welcomeSub: 'Commandez depuis votre table, on vous apporte tout.',
    added: 'Ajouté',
    viewOrder: 'Voir ma commande',
    yourOrder: 'Votre commande',
    total: 'Total',
    composeCta: 'Composer mon bol',
    from: 'dès',
    next: 'Suivant',
    back: 'Retour',
    addBowl: 'Ajouter à ma commande',
    builderSteps: ['Taille & base', 'Fruits & légumes', 'Protéine', 'Sauce', 'Toppings'],
    builderHints: ['', "Jusqu'à 5", '1 au choix', '1 au choix', "Jusqu'à 2"],
    sending: 'Envoi en cuisine…',
    orderNumber: 'Commande',
    viewMenu: 'Voir notre carte en ligne',
    cartEmpty: 'Votre commande est vide',
    addToCart: 'Ajouter',
    customBowl: 'Créer mon bol sur mesure',
    customBowlSub: 'Choisissez votre base, protéines, légumes, sauce et toppings frais.',
    categories: {
      formules: 'Formules Midi',
      classiques: 'Nos Classiques',
      surmesure: 'Sur Mesure',
      sides: 'Sides & Entrées',
      boissons: 'Boissons',
      desserts: 'Desserts'
    },
    sizeM: 'Taille M',
    sizeL: 'Taille L',
    crossSellTitle: 'Envie d’une boisson fraîche ou d’un dessert ?',
    crossSellSub: 'Ajoutez une touche sucrée ou rafraîchissante à votre commande.',
    noThanks: 'Non merci, continuer',
    paymentChoice: 'Mode de règlement',
    payOnline: 'Payer en ligne (CB)',
    payOnlineSub: 'Paiement sécurisé et instantané',
    payCounter: 'Payer au comptoir',
    payCounterSub: 'Réglez au comptoir quand vous le souhaitez (espèces, CB, tickets resto)',
    customerNamePlaceholder: 'Prénom (optionnel pour le plateau)',
    submitOrder: 'Envoyer la commande en cuisine',
    orderSentTitle: 'Commande transmise en cuisine !',
    orderSentSub: 'Restez assis à votre table, notre équipe prépare vos bols avec amour et vous les apporte.',
    counterPaymentNotice: 'N’oubliez pas de régler au comptoir lors de votre départ ou quand vous le souhaitez.',
    orderAnother: 'Commander autre chose',
    tableDisabledTitle: 'Commande à table désactivée',
    tableDisabledDesc: 'La commande à table est momentanément indisponible. Merci de vous présenter au comptoir.',
    tokenInvalidTitle: 'QR Code non reconnu',
    tokenInvalidDesc: 'Ce QR code de table n’est plus actif ou introuvable. Veuillez vous adresser à notre équipe.',
    antiSpamTitle: 'Plusieurs commandes déjà en cours',
    antiSpamDesc: 'Vous avez déjà des commandes en préparation pour cette table. Vous pouvez en suivre l’état ci-dessous avant d’en relancer une.',
    status: {
      NOUVELLE: 'Commande reçue en cuisine',
      PREPARATION: 'En cours de préparation...',
      PRETE: 'Votre commande est prête, elle arrive !',
      TERMINEE: 'Commande servie à table. Bon appétit !'
    }
  },
  EN: {
    serviceSurPlace: 'Eat-in · Table service',
    tablePrefix: 'Table',
    changeLang: 'Français',
    welcome: 'Welcome',
    welcomeSub: 'Order from your table, we bring everything to you.',
    added: 'Added',
    viewOrder: 'View my order',
    yourOrder: 'Your order',
    total: 'Total',
    composeCta: 'Build my bowl',
    from: 'from',
    next: 'Next',
    back: 'Back',
    addBowl: 'Add to my order',
    builderSteps: ['Size & base', 'Fruits & veggies', 'Protein', 'Sauce', 'Toppings'],
    builderHints: ['', 'Up to 5', 'Pick 1', 'Pick 1', 'Up to 2'],
    sending: 'Sending to the kitchen…',
    orderNumber: 'Order',
    viewMenu: 'See our online menu',
    cartEmpty: 'Your order is empty',
    addToCart: 'Add',
    customBowl: 'Create your custom bowl',
    customBowlSub: 'Choose your fresh base, proteins, veggies, sauce, and toppings.',
    categories: {
      formules: 'Lunch Combos',
      classiques: 'Signatures',
      surmesure: 'Custom Bowl',
      sides: 'Sides & Starters',
      boissons: 'Drinks',
      desserts: 'Desserts'
    },
    sizeM: 'Size M',
    sizeL: 'Size L',
    crossSellTitle: 'Would you like a drink or dessert?',
    crossSellSub: 'Add a fresh drink or sweet treat to your bowl.',
    noThanks: 'No thanks, continue',
    paymentChoice: 'Payment method',
    payOnline: 'Pay online (Credit Card)',
    payOnlineSub: 'Instant secure checkout',
    payCounter: 'Pay at the counter',
    payCounterSub: 'Pay at the counter whenever you like (cash, card, meal vouchers)',
    customerNamePlaceholder: 'First name (optional)',
    submitOrder: 'Send order to the kitchen',
    orderSentTitle: 'Order sent to the kitchen!',
    orderSentSub: 'Stay comfortably seated at your table, our team will bring your order right over.',
    counterPaymentNotice: 'Please pay at the counter before leaving or whenever you like.',
    orderAnother: 'Order something else for this table',
    tableDisabledTitle: 'Table ordering disabled',
    tableDisabledDesc: 'Table ordering is temporarily paused. Please order directly at the counter.',
    tokenInvalidTitle: 'Invalid QR Code',
    tokenInvalidDesc: 'This table QR code is inactive or expired. Please check with our team.',
    antiSpamTitle: 'Orders already in progress',
    antiSpamDesc: 'You already have active orders for this table. You can track them below.',
    status: {
      NOUVELLE: 'Order received by the kitchen',
      PREPARATION: 'Preparing your meal...',
      PRETE: 'Order ready, coming to your table!',
      TERMINEE: 'Served at your table. Enjoy your meal!'
    }
  }
};

export default function TableOrderView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { 
    tables, 
    tablesConfig, 
    orders, 
    addOrder,
    currentTable,
    setCurrentTable 
  } = useStore();

  const [lang, setLang] = useState('FR');
  const t = TEXTS[lang];

  // Table Resolution and Session Persistence
  const [activeTable, setActiveTable] = useState(() => {
    if (currentTable && currentTable.token === token) return currentTable;
    try {
      const stored = sessionStorage.getItem('hoya_active_table_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token === token) return parsed;
      }
    } catch (e) {}
    return findTableByToken(token, tables);
  });

  useEffect(() => {
    const found = findTableByToken(token, tables);
    if (found) {
      setActiveTable(found);
      setCurrentTable(found);
      try {
        sessionStorage.setItem('hoya_active_table_session', JSON.stringify(found));
      } catch (e) {}
    }
  }, [token, tables, setCurrentTable]);

  // UI Flow State
  const [activeCategory, setActiveCategory] = useState('classiques');
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCrossSell, setShowCrossSell] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (tablesConfig?.paymentMode === 'ONLINE') return 'ONLINE';
    if (tablesConfig?.paymentMode === 'COMPTOIR') return 'COMPTOIR';
    return 'ONLINE';
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(() => {
    try {
      return sessionStorage.getItem(`hoya_table_last_order_${token}`) || null;
    } catch (e) {
      return null;
    }
  });

  // Modals for Custom Bowl and Formulas
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [selectedFormule, setSelectedFormule] = useState(null);
  const [lastAdded, setLastAdded] = useState(null);

  // Custom Bowl Builder Internal State
  const [builderStep, setBuilderStep] = useState(0); // 0: Size & Base, 1: Protéines, 2: Légumes, 3: Sauce, 4: Toppings
  const [customSize, setCustomSize] = useState('M');
  const [customBase, setCustomBase] = useState('Riz vinaigré');
  const [customProteins, setCustomProteins] = useState([]);
  const [customVeggies, setCustomVeggies] = useState([]);
  const [customSauce, setCustomSauce] = useState('');
  const [customToppings, setCustomToppings] = useState([]);

  // Check anti-spam: active unpaid orders for this table
  const activeTableOrders = useMemo(() => {
    if (!activeTable) return [];
    return orders.filter(o => 
      o.tableName === activeTable.name && 
      o.status !== 'TERMINEE' && 
      o.status !== 'REFUSEE'
    );
  }, [orders, activeTable]);

  const maxOrdersReached = useMemo(() => {
    const limit = tablesConfig?.maxUnpaidOrdersPerTable || 3;
    return activeTableOrders.length >= limit;
  }, [activeTableOrders, tablesConfig]);

  // Current Tracked Order
  const trackedOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find(o => o.id === activeOrderId) || null;
  }, [orders, activeOrderId]);

  // Cart Calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cart]);

  // Cart Handlers
  const addToCart = (product, size = null) => {
    setCart(prev => {
      const price = size === 'L' && product.priceL ? product.priceL : (product.price ?? product.priceM ?? 0);
      const itemName = size ? `${product.name} (${size})` : product.name;
      const existingIndex = prev.findIndex(item => item.name === itemName);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }
      return [...prev, {
        id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: itemName,
        cartName: itemName,
        price,
        size: size || 'M',
        composition: product.composition || [product.name],
        image: product.image || null,
        quantity: 1
      }];
    });
    setLastAdded({ name: size ? `${product.name} (${size})` : product.name, at: Date.now() });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Custom Bowl Confirmation
  const handleConfirmCustomBowl = () => {
    const base = MENU.surMesureBase || { priceM: 12.9, priceL: 15.9 };
    const basePrice = (MENU.bases || []).find(b => b.name === customBase)?.price || 0;
    const price = (customSize === 'L' ? base.priceL : base.priceM) + basePrice;
    const composition = [
      customBase,
      ...customProteins,
      ...customVeggies,
      customSauce,
      ...customToppings
    ].filter(Boolean);

    addToCart({
      name: `Bol sur mesure (${customSize})`,
      price,
      size: customSize,
      composition
    });

    setShowBuilderModal(false);
    // Reset builder
    setBuilderStep(0);
    setCustomProteins([]);
    setCustomVeggies([]);
    setCustomSauce('');
    setCustomToppings([]);
  };

  // Submit Order to Supabase & Realtime Kitchen
  const handleSendOrder = async () => {
    if (cart.length === 0 || !activeTable) return;
    setSubmitting(true);

    const orderId = Math.floor(1000 + Math.random() * 9000).toString();
    const finalPayment = paymentMethod === 'ONLINE' ? 'PAYÉ' : 'SUR_PLACE';

    const newOrder = {
      id: orderId,
      source: 'TABLE',
      tableName: activeTable.name,
      tableToken: activeTable.token,
      type: 'RETRAIT',
      status: 'NOUVELLE',
      paymentStatus: finalPayment,
      customerName: customerName.trim() ? `${customerName.trim()} (${activeTable.name})` : activeTable.name,
      customerPhone: 'Table',
      address: `Sur place · ${activeTable.name}`,
      items: cart.flatMap(item => Array(item.quantity || 1).fill({
        name: item.name,
        cartName: item.cartName || item.name,
        price: item.price,
        size: item.size || 'M',
        composition: item.composition || [item.name]
      })),
      total: cartTotal,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    await addOrder(newOrder);
    playSuccessSound();

    setActiveOrderId(orderId);
    try {
      sessionStorage.setItem(`hoya_table_last_order_${token}`, orderId);
    } catch (e) {}

    setCart([]);
    setDrawerOpen(false);
    setShowCrossSell(false);
    setSubmitting(false);
  };

  const storeMenu = useStore(s => s.menu);
  const menu = storeMenu || MENU;
  const customItems = {
    veggies: { list: customVeggies, set: setCustomVeggies, max: 5 },
    toppings: { list: customToppings, set: setCustomToppings, max: 2 }
  };
  const toggleMulti = (key, name) => {
    const { list, set, max } = customItems[key];
    if (list.includes(name)) set(list.filter(x => x !== name));
    else if (list.length < max) set([...list, name]);
  };
  const customPrice = (() => {
    const base = menu.surMesureBase || { priceM: 12.9, priceL: 15.9 };
    const extra = (menu.bases || []).find(b => b.name === customBase)?.price || 0;
    return (customSize === 'L' ? base.priceL : base.priceM) + extra;
  })();

  useEffect(() => {
    if (!lastAdded) return undefined;
    const timer = setTimeout(() => setLastAdded(null), 1600);
    return () => clearTimeout(timer);
  }, [lastAdded]);

  // Invalid or disabled states
  if (!activeTable || !activeTable.isActive || tablesConfig?.enabled === false) {
    const invalid = !activeTable || !activeTable.isActive;
    return (
      <div className="to-root to-center">
        <motion.div className="to-notice" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span className="to-notice-mark"><HoyaMark size={34} /></span>
          <h1>{invalid ? t.tokenInvalidTitle : t.tableDisabledTitle}</h1>
          <p>{invalid ? t.tokenInvalidDesc : t.tableDisabledDesc}</p>
          {invalid
            ? <button className="to-btn to-btn-forest" onClick={() => navigate('/')}>{t.viewMenu}</button>
            : <span className="to-table-pill dark">{activeTable.name}</span>}
        </motion.div>
      </div>
    );
  }

  const catalog = activeCategory === 'formules' || activeCategory === 'surmesure' ? [] : (menu[activeCategory] || []);
  const stepTitle = t.builderSteps[builderStep];

  return (
    <div className="to-root">
      <header className="to-head">
        <div className="to-head-row">
          <div className="to-brand" onClick={() => navigate('/')} role="link">
            <span className="to-brand-mark"><HoyaMark size={20} /></span>
            <span>Hoya Poké</span>
          </div>
          <button className="to-lang" onClick={() => setLang(l => (l === 'FR' ? 'EN' : 'FR'))}>
            <Globe size={14} />
            {t.changeLang}
          </button>
        </div>
        <div className="to-welcome">
          <span className="to-table-pill"><span className="to-dot" />{activeTable.name} · {t.serviceSurPlace}</span>
          <h1>{t.welcome} <em>{activeTable.name}</em></h1>
          <p>{t.welcomeSub}</p>
        </div>
      </header>

      <nav className="to-tabs" aria-label="Catégories">
        {Object.entries(t.categories).map(([key, label]) => (
          <button
            key={key}
            className={activeCategory === key ? 'active' : ''}
            onClick={() => { setActiveCategory(key); if (key === 'surmesure') setShowBuilderModal(true); }}
          >
            {activeCategory === key && <motion.span layoutId="to-tab" className="to-tab-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {trackedOrder && (
        <button className="to-track-strip" onClick={() => setActiveOrderId(trackedOrder.id)}>
          <span className="to-dot" />
          <span><strong>{t.orderNumber} #{trackedOrder.id}</strong> · {t.status[trackedOrder.status] || trackedOrder.status}</span>
          <ChevronRight size={16} />
        </button>
      )}

      {maxOrdersReached && (
        <div className="to-warning">
          <AlertTriangle size={18} />
          <div><strong>{t.antiSpamTitle}</strong><p>{t.antiSpamDesc}</p></div>
        </div>
      )}

      <main className="to-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeCategory === 'surmesure' && (
              <button className="to-custom" onClick={() => setShowBuilderModal(true)}>
                <span className="to-custom-art"><BowlArt item={{ name: 'Sur mesure', defaultProtein: 'Saumon cru mariné', defaultSauce: 'Sriracha mayo', ingredients: ['Avocat', 'Mangue', 'Chou rouge', 'Radis rose', 'Edamame'] }} className="to-custom-bowl" /></span>
                <span className="to-custom-copy">
                  <strong>{t.customBowl}</strong>
                  <span>{t.customBowlSub}</span>
                  <span className="to-btn to-btn-curry">{t.composeCta} · {t.from} {formatPrice(menu.surMesureBase?.priceM || 12.9)}</span>
                </span>
              </button>
            )}

            {activeCategory === 'formules' && (
              <div className="to-list">
                {FORMULES.map((f, i) => (
                  <motion.button key={f.id} className="to-formule" onClick={() => setSelectedFormule(f)}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <span className="to-formule-badge">{f.badge}</span>
                    <strong>{f.name.replace(/\s*\(.*\)$/, '')}</strong>
                    <span className="to-muted">{(f.includes || []).join(' + ')}</span>
                    <span className="to-row-foot">
                      <span className="price">{t.from} {formatPrice(f.priceM)}</span>
                      <span className="to-round"><Plus size={16} /></span>
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {activeCategory === 'classiques' && (
              <div className="to-grid">
                {catalog.map((item, i) => (
                  <motion.article key={item.id || item.name} className="to-classic"
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <span className="to-classic-art"><BowlArt item={item} className="to-classic-bowl" /></span>
                    <div className="to-classic-body">
                      <strong>{item.name}</strong>
                      <span className="to-muted">{item.description}</span>
                      <div className="to-sizes">
                        <motion.button whileTap={{ scale: 0.94 }} onClick={() => addToCart(item, 'M')}>
                          <span>M</span>{formatPrice(item.priceM)}<Plus size={14} />
                        </motion.button>
                        {item.priceL && (
                          <motion.button whileTap={{ scale: 0.94 }} onClick={() => addToCart(item, 'L')}>
                            <span>L</span>{formatPrice(item.priceL)}<Plus size={14} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}

            {!['classiques', 'formules', 'surmesure'].includes(activeCategory) && (
              <div className="to-list">
                {catalog.map((item, i) => (
                  <motion.div key={item.id || item.name} className="to-row"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ProductThumb item={item} category={activeCategory} className="to-thumb" />
                    <span className="to-row-text">
                      <strong>{item.name}</strong>
                      <span className="price">{formatPrice(item.price ?? item.priceM)}</span>
                    </span>
                    <motion.button className="to-round" whileTap={{ scale: 0.88 }} onClick={() => addToCart(item)} aria-label={`${t.addToCart} ${item.name}`}>
                      <Plus size={16} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Added feedback */}
      <AnimatePresence>
        {lastAdded && (
          <motion.div key={lastAdded.at} className="to-toast"
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
            <Check size={16} /> {t.added} · {lastAdded.name}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom cart bar */}
      <AnimatePresence>
        {cartCount > 0 && !drawerOpen && (
          <motion.div className="to-bar-wrap" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
            <button
              className="to-bar"
              onClick={() => {
                if (tablesConfig?.crossSellEnabled !== false && !cart.some(i => (menu.boissons || []).some(b => i.name.startsWith(b.name)))) setShowCrossSell(true);
                setDrawerOpen(true);
              }}
            >
              <motion.span key={cartCount} className="to-bar-count" initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>{cartCount}</motion.span>
              <span>{t.viewOrder}</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart sheet */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="to-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
            <motion.div className="to-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="to-sheet-head">
                <div>
                  <h2>{t.yourOrder}</h2>
                  <span className="to-muted">{activeTable.name} · {t.serviceSurPlace}</span>
                </div>
                <button className="to-icon" onClick={() => setDrawerOpen(false)} aria-label="Fermer"><X size={18} /></button>
              </div>

              <div className="to-sheet-body">
                {showCrossSell && (
                  <div className="to-upsell">
                    <div className="to-upsell-head">
                      <strong>{t.crossSellTitle}</strong>
                      <button onClick={() => setShowCrossSell(false)}>{t.noThanks}</button>
                    </div>
                    <div className="to-upsell-row">
                      {(menu.boissons || []).slice(0, 4).map(b => (
                        <button key={b.name} onClick={() => addToCart(b)}>
                          <ProductThumb item={b} category="boissons" className="to-upsell-thumb" />
                          <span>{b.name}</span>
                          <span className="price">{formatPrice(b.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div key={item.id} layout className="to-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
                      <div className="to-line-text">
                        <strong>{item.name}</strong>
                        {item.composition?.length > 1 && <span className="to-muted">{item.composition.join(' · ')}</span>}
                        <span className="price">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <div className="to-qty">
                        <button onClick={() => updateQuantity(item.id, -1)} aria-label="Moins">
                          {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <motion.span key={item.quantity} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>{item.quantity}</motion.span>
                        <button onClick={() => updateQuantity(item.id, 1)} aria-label="Plus"><Plus size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <label className="to-field">
                  <span>{t.customerNamePlaceholder}</span>
                  <input type="text" placeholder="Ex : Sarah" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </label>

                {tablesConfig?.paymentMode === 'BOTH' && (
                  <div className="to-field">
                    <span>{t.paymentChoice}</span>
                    {[
                      { id: 'ONLINE', icon: CreditCard, title: t.payOnline, sub: t.payOnlineSub },
                      { id: 'COMPTOIR', icon: Banknote, title: t.payCounter, sub: t.payCounterSub }
                    ].map(({ id, icon: Icon, title, sub }) => (
                      <button key={id} className={`to-pay ${paymentMethod === id ? 'active' : ''}`} onClick={() => setPaymentMethod(id)}>
                        <Icon size={18} />
                        <span><strong>{title}</strong><span className="to-muted">{sub}</span></span>
                        <span className="to-radio" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="to-sheet-foot">
                <div className="to-total"><span>{t.total}</span><strong className="price">{formatPrice(cartTotal)}</strong></div>
                <button className="to-btn to-btn-forest to-btn-block" disabled={submitting || maxOrdersReached || cart.length === 0} onClick={handleSendOrder}>
                  {submitting ? t.sending : t.submitOrder}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order sent */}
      <AnimatePresence>
        {trackedOrder && activeOrderId && (
          <motion.div className="to-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="to-done-card" initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
              <span className="to-done-mark"><AnimatedMark size={70} delay={0.2} /></span>
              <span className="to-table-pill dark">{activeTable.name} · #{trackedOrder.id}</span>
              <h2>{t.orderSentTitle}</h2>
              <p>{t.orderSentSub}</p>
              <ol className="to-steps">
                {['NOUVELLE', 'PREPARATION', 'PRETE', 'TERMINEE'].map((key, i, all) => {
                  const current = all.indexOf(trackedOrder.status);
                  return (
                    <li key={key} className={i < current ? 'done' : i === current ? 'current' : ''}>
                      <span className="to-step-dot">{i < current && <Check size={11} strokeWidth={3} />}</span>
                      <span>{t.status[key]}</span>
                    </li>
                  );
                })}
              </ol>
              {trackedOrder.paymentStatus !== 'PAYÉ' && <p className="to-pay-note">{t.counterPaymentNotice}</p>}
              <button className="to-btn to-btn-forest to-btn-block" onClick={() => setActiveOrderId(null)}>{t.orderAnother}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom bowl builder with live preview */}
      <AnimatePresence>
        {showBuilderModal && (
          <>
            <motion.div className="to-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBuilderModal(false)} />
            <motion.div className="to-sheet to-builder" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="to-sheet-head">
                <div>
                  <h2>{t.customBowl}</h2>
                  <span className="to-muted">{builderStep + 1}/5 · {stepTitle}{t.builderHints[builderStep] ? ` · ${t.builderHints[builderStep]}` : ''}</span>
                </div>
                <button className="to-icon" onClick={() => setShowBuilderModal(false)} aria-label="Fermer"><X size={18} /></button>
              </div>

              <div className="to-builder-preview">
                <BowlScene
                  className="to-builder-bowl"
                  baseName={customBase}
                  veggiesList={customVeggies}
                  proteinName={customProteins[0] || ''}
                  sauceName={customSauce}
                  toppingsList={customToppings}
                  isLarge={customSize === 'L'}
                  label="Aperçu de votre bol"
                />
                <div className="to-builder-progress">
                  {t.builderSteps.map((s, i) => <span key={s} className={i <= builderStep ? 'on' : ''} />)}
                </div>
              </div>

              <div className="to-sheet-body">
                <AnimatePresence mode="wait">
                  <motion.div key={builderStep} className="to-chips"
                    initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                    {builderStep === 0 && (
                      <>
                        {['M', 'L'].map(sz => (
                          <button key={sz} className={`to-chip wide ${customSize === sz ? 'active' : ''}`} onClick={() => setCustomSize(sz)}>
                            <strong>{sz === 'M' ? t.sizeM : t.sizeL}</strong>
                            <span>{formatPrice(sz === 'M' ? menu.surMesureBase?.priceM || 12.9 : menu.surMesureBase?.priceL || 15.9)}</span>
                          </button>
                        ))}
                        {(menu.bases || []).map(b => (
                          <button key={b.name} className={`to-chip ${customBase === b.name ? 'active' : ''}`} onClick={() => setCustomBase(b.name)}>
                            {b.name}{b.price ? ` +${formatPrice(b.price)}` : ''}
                          </button>
                        ))}
                      </>
                    )}
                    {builderStep === 1 && (menu.fruitsLegumes || []).map(f => (
                      <button key={f.name} className={`to-chip ${customVeggies.includes(f.name) ? 'active' : ''}`} onClick={() => toggleMulti('veggies', f.name)}>{f.name}</button>
                    ))}
                    {builderStep === 2 && (menu.proteines || []).map(p => (
                      <button key={p.name} className={`to-chip ${customProteins[0] === p.name ? 'active' : ''}`} onClick={() => setCustomProteins([p.name])}>{p.name}</button>
                    ))}
                    {builderStep === 3 && (menu.sauces || []).map(sc => (
                      <button key={sc.name} className={`to-chip ${customSauce === sc.name ? 'active' : ''}`} onClick={() => setCustomSauce(sc.name)}>{sc.name}</button>
                    ))}
                    {builderStep === 4 && (menu.toppings || []).map(tp => (
                      <button key={tp.name} className={`to-chip ${customToppings.includes(tp.name) ? 'active' : ''}`} onClick={() => toggleMulti('toppings', tp.name)}>{tp.name}</button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="to-sheet-foot to-builder-foot">
                {builderStep > 0
                  ? <button className="to-btn to-btn-ghost" onClick={() => setBuilderStep(st => st - 1)}><ArrowLeft size={16} /> {t.back}</button>
                  : <span className="price to-builder-price">{formatPrice(customPrice)}</span>}
                {builderStep < 4
                  ? <button className="to-btn to-btn-forest" onClick={() => setBuilderStep(st => st + 1)}>{t.next} <ArrowRight size={16} /></button>
                  : <button className="to-btn to-btn-curry" onClick={handleConfirmCustomBowl}>{t.addBowl} · {formatPrice(customPrice)}</button>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FormuleModal
        formule={selectedFormule}
        isOpen={!!selectedFormule}
        onClose={() => setSelectedFormule(null)}
        onAdd={(item) => addToCart({ name: item.cartName, price: item.price, composition: item.composition })}
      />
    </div>
  );
}
