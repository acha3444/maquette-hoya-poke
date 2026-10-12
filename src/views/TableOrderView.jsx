import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Check, Plus, Minus, Trash2, ArrowLeft, ArrowRight,
  Sparkles, CreditCard, Banknote, Clock, AlertTriangle, Globe,
  Coffee, UtensilsCrossed, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { useStore } from '../store';
import { MENU, FORMULES } from '../data';
import { formatPrice } from '../format';
import { playSuccessSound } from '../sound';
import HoyaMark from '../components/brand/HoyaMark';
import BowlArt from '../components/brand/BowlArt';
import FormuleModal from '../components/FormuleModal';
import { findTableByToken } from '../services/tableService';
import './table/tableOrder.css';

const TEXTS = {
  FR: {
    serviceSurPlace: 'Sur place · Service à table',
    tablePrefix: 'Table',
    changeLang: 'English',
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
    orderAnother: 'Commander autre chose pour la même table',
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
      const price = size === 'L' && product.priceL ? product.priceL : product.price;
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
    const price = customSize === 'L' ? 14.90 : 11.90;
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

  // Invalid or Disabled States
  if (!activeTable || !activeTable.isActive) {
    return (
      <div className="table-order-root" style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div className="table-card" style={{ maxWidth: 420, padding: 32, borderRadius: 24 }}>
          <AlertTriangle size={48} style={{ color: '#d97706', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, margin: '0 0 10px' }}>{t.tokenInvalidTitle}</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 24px' }}>{t.tokenInvalidDesc}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Voir notre carte en ligne
          </button>
        </div>
      </div>
    );
  }

  if (tablesConfig?.enabled === false) {
    return (
      <div className="table-order-root" style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div className="table-card" style={{ maxWidth: 420, padding: 32, borderRadius: 24 }}>
          <Coffee size={48} style={{ color: 'var(--green-800)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, margin: '0 0 10px' }}>{t.tableDisabledTitle}</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 24px' }}>{t.tableDisabledDesc}</p>
          <div className="table-badge-pill" style={{ background: 'var(--green-900)', margin: '0 auto' }}>
            {activeTable.name}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-order-root">
      {/* 1. Persistent Top Banner & Header */}
      <header className="table-order-header">
        <div className="table-order-banner">
          <div className="row gap-2">
            <span className="table-badge-pill">
              <span className="table-pulse-dot" />
              <span>{activeTable.name} · {t.serviceSurPlace}</span>
            </span>
          </div>

          <button 
            className="btn btn-sm btn-ghost" 
            style={{ color: '#fff', fontSize: 12, padding: '2px 8px', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => setLang(l => l === 'FR' ? 'EN' : 'FR')}
          >
            <Globe size={13} />
            <span>{t.changeLang}</span>
          </button>
        </div>

        <div className="table-header-main">
          <div className="row gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <HoyaMark size={28} />
            <div>
              <strong style={{ fontSize: 15, display: 'block', lineHeight: 1.1 }}>Hoya Poké</strong>
              <span className="muted small" style={{ fontSize: 11 }}>Pézenas</span>
            </div>
          </div>

          {cartCount > 0 && (
            <button 
              className="table-cart-trigger"
              style={{ padding: '8px 16px', fontSize: 13 }}
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingBag size={15} />
              <span>{cartCount} · {formatPrice(cartTotal)}</span>
            </button>
          )}
        </div>

        {/* Categories Tab Bar */}
        <div className="table-cat-scroll">
          {Object.entries(t.categories).map(([catKey, label]) => (
            <button
              key={catKey}
              className={`table-cat-chip ${activeCategory === catKey ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(catKey);
                if (catKey === 'surmesure') setShowBuilderModal(true);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Active Order Live Tracking Banner (If already ordered) */}
      {trackedOrder && (
        <section style={{ padding: '12px 16px', background: '#ecfdf5', borderBottom: '1px solid #10b981' }}>
          <div className="row between" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="row gap-2">
              <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 13, color: '#065f46', display: 'block' }}>
                  Commande #{trackedOrder.id} ({activeTable.name})
                </strong>
                <span style={{ fontSize: 12, color: '#047857' }}>
                  {t.status[trackedOrder.status] || trackedOrder.status}
                </span>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-ghost" 
              style={{ fontSize: 11, borderColor: '#10b981', color: '#065f46' }}
              onClick={() => setActiveOrderId(trackedOrder.id)}
            >
              Détails
            </button>
          </div>
        </section>
      )}

      {/* 3. Anti-Spam Warning (if user has max active orders) */}
      {maxOrdersReached && (
        <div style={{ margin: '16px', padding: '14px', background: '#fef3c7', borderRadius: 12, border: '1px solid #f59e0b', color: '#92400e' }}>
          <div className="row gap-2">
            <AlertTriangle size={18} />
            <strong style={{ fontSize: 13 }}>{t.antiSpamTitle}</strong>
          </div>
          <p style={{ fontSize: 12, margin: '6px 0 0', lineHeight: 1.4 }}>{t.antiSpamDesc}</p>
        </div>
      )}

      {/* 4. Products Catalog Section */}
      <main style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {/* Banner Custom Bowl Builder Hero */}
        {activeCategory === 'surmesure' && (
          <div style={{ padding: 16 }}>
            <div style={{ background: 'var(--green-900)', color: '#fff', borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <Sparkles size={32} style={{ color: 'var(--gold)', margin: '0 auto 10px' }} />
              <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{t.customBowl}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, maxWidth: 440, margin: '0 auto 16px' }}>{t.customBowlSub}</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowBuilderModal(true)}
              >
                Commencer à composer (dès 11,90 €)
              </button>
            </div>
          </div>
        )}

        {/* Formules Midi */}
        {activeCategory === 'formules' && (
          <div className="table-grid">
            {FORMULES.map(f => (
              <div key={f.id} className="table-card">
                <div className="table-card-body">
                  <span className="table-card-badge" style={{ position: 'static', alignSelf: 'flex-start', marginBottom: 8 }}>
                    Formule
                  </span>
                  <h3 className="table-card-title">{f.name}</h3>
                  <p className="table-card-desc">{f.desc}</p>
                  <div className="table-card-foot">
                    <span className="table-card-price">{formatPrice(f.price)}</span>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedFormule(f)}
                    >
                      Composer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Items List (Classiques, Sides, Boissons, Desserts) */}
        {activeCategory !== 'formules' && (
          <div className="table-grid">
            {(MENU[activeCategory] || []).map(item => (
              <div key={item.name} className="table-card">
                {item.image && (
                  <div className="table-card-img-wrap">
                    <img src={item.image} alt={item.name} className="table-card-img" />
                    {item.badge && <span className="table-card-badge">{item.badge}</span>}
                  </div>
                )}
                <div className="table-card-body">
                  <h3 className="table-card-title">{item.name}</h3>
                  {item.composition && (
                    <p className="table-card-desc">{item.composition.join(' · ')}</p>
                  )}
                  {item.desc && !item.composition && (
                    <p className="table-card-desc">{item.desc}</p>
                  )}

                  <div className="table-card-foot">
                    <div>
                      <span className="table-card-price">{formatPrice(item.price)}</span>
                      {item.priceL && (
                        <span className="muted small" style={{ marginLeft: 6, fontSize: 11 }}>
                          (L: {formatPrice(item.priceL)})
                        </span>
                      )}
                    </div>

                    {item.priceL ? (
                      <div className="row gap-1">
                        <button 
                          className="btn btn-sm btn-ghost" 
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => addToCart(item, 'M')}
                        >
                          + M
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => addToCart(item, 'L')}
                        >
                          + L
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => addToCart(item)}
                      >
                        <Plus size={14} /> {t.addToCart}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 5. Sticky Bottom Cart Trigger Bar */}
      {cartCount > 0 && !drawerOpen && (
        <div className="table-bottom-bar">
          <div>
            <div className="row gap-2">
              <span className="table-pulse-dot" />
              <strong style={{ fontSize: 14 }}>{activeTable.name}</strong>
            </div>
            <span className="muted small">{cartCount} article{cartCount > 1 ? 's' : ''}</span>
          </div>

          <button 
            className="table-cart-trigger"
            onClick={() => {
              if (tablesConfig?.crossSellEnabled !== false && cart.length > 0 && !cart.some(i => (MENU.boissons || []).some(b => b.name === i.name))) {
                setShowCrossSell(true);
              }
              setDrawerOpen(true);
            }}
          >
            <span>Voir ma commande</span>
            <strong>{formatPrice(cartTotal)}</strong>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 6. Cart Drawer / Bottom Sheet */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              className="table-drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div 
              className="table-drawer-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              <div className="table-drawer-head">
                <div className="row gap-2">
                  <ShoppingBag size={20} style={{ color: 'var(--green-800)' }} />
                  <div>
                    <strong style={{ fontSize: 16 }}>Votre commande</strong>
                    <span className="muted small" style={{ display: 'block' }}>{activeTable.name} · {t.serviceSurPlace}</span>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => setDrawerOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="table-drawer-body">
                {/* Cross-Sell Suggestion */}
                {showCrossSell && (
                  <div style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 14, border: '1px solid var(--line)' }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <strong style={{ fontSize: 13, color: 'var(--green-900)' }}>{t.crossSellTitle}</strong>
                      <button 
                        style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setShowCrossSell(false)}
                      >
                        {t.noThanks}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {(MENU.boissons || []).slice(0, 3).map(b => (
                        <div key={b.name} style={{ background: '#fff', padding: 8, borderRadius: 10, minWidth: 140, border: '1px solid var(--line)' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, display: 'block' }}>{b.name}</span>
                          <span className="price small">{formatPrice(b.price)}</span>
                          <button 
                            className="btn btn-sm btn-ghost" 
                            style={{ width: '100%', marginTop: 6, padding: '2px 0', fontSize: 11 }}
                            onClick={() => addToCart(b)}
                          >
                            + Ajouter
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="col">
                  {cart.map(item => (
                    <div key={item.id} className="table-cart-item">
                      <div className="col" style={{ flex: 1, paddingRight: 10 }}>
                        <strong style={{ fontSize: 14 }}>{item.name}</strong>
                        {item.composition && (
                          <span className="muted small" style={{ fontSize: 11, marginTop: 2 }}>
                            {item.composition.join(' · ')}
                          </span>
                        )}
                        <span className="price small" style={{ marginTop: 4 }}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>

                      <div className="row gap-1" style={{ alignItems: 'center' }}>
                        <button 
                          className="icon-btn" 
                          style={{ width: 28, height: 28 }}
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          {item.quantity === 1 ? <Trash2 size={13} style={{ color: '#ef4444' }} /> : <Minus size={13} />}
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                          {item.quantity}
                        </span>
                        <button 
                          className="icon-btn" 
                          style={{ width: 28, height: 28 }}
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Customer Name Input */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    {t.customerNamePlaceholder}
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Ex: Sarah"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10 }}
                  />
                </div>

                {/* Payment Method Selector */}
                {tablesConfig?.paymentMode === 'BOTH' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                      {t.paymentChoice}
                    </label>
                    <div className="col gap-2">
                      <label 
                        className={`row gap-2 ${paymentMethod === 'ONLINE' ? 'active' : ''}`}
                        style={{ 
                          padding: 12, 
                          borderRadius: 12, 
                          border: `1.5px solid ${paymentMethod === 'ONLINE' ? 'var(--green-700)' : 'var(--line)'}`,
                          background: paymentMethod === 'ONLINE' ? 'rgba(46, 125, 50, 0.05)' : '#fff',
                          cursor: 'pointer' 
                        }}
                      >
                        <input 
                          type="radio" 
                          name="table_pay" 
                          checked={paymentMethod === 'ONLINE'} 
                          onChange={() => setPaymentMethod('ONLINE')} 
                        />
                        <CreditCard size={18} style={{ color: 'var(--green-700)' }} />
                        <div className="col">
                          <strong style={{ fontSize: 13 }}>{t.payOnline}</strong>
                          <span className="muted small">{t.payOnlineSub}</span>
                        </div>
                      </label>

                      <label 
                        className={`row gap-2 ${paymentMethod === 'COMPTOIR' ? 'active' : ''}`}
                        style={{ 
                          padding: 12, 
                          borderRadius: 12, 
                          border: `1.5px solid ${paymentMethod === 'COMPTOIR' ? 'var(--green-700)' : 'var(--line)'}`,
                          background: paymentMethod === 'COMPTOIR' ? 'rgba(46, 125, 50, 0.05)' : '#fff',
                          cursor: 'pointer' 
                        }}
                      >
                        <input 
                          type="radio" 
                          name="table_pay" 
                          checked={paymentMethod === 'COMPTOIR'} 
                          onChange={() => setPaymentMethod('COMPTOIR')} 
                        />
                        <Banknote size={18} style={{ color: '#d97706' }} />
                        <div className="col">
                          <strong style={{ fontSize: 13 }}>{t.payCounter}</strong>
                          <span className="muted small">{t.payCounterSub}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Total Recap */}
                <div style={{ background: 'var(--cream)', padding: 14, borderRadius: 12, marginTop: 10 }}>
                  <div className="row between">
                    <span style={{ fontSize: 14 }}>Total de votre plateau</span>
                    <strong className="price" style={{ fontSize: 20 }}>{formatPrice(cartTotal)}</strong>
                  </div>
                  <span className="muted small" style={{ display: 'block', marginTop: 4 }}>
                    Service inclus à la {activeTable.name} · Préparé minute
                  </span>
                </div>

                {/* Send Order Button */}
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 16, justifyContent: 'center' }}
                  disabled={submitting || maxOrdersReached}
                  onClick={handleSendOrder}
                >
                  {submitting ? 'Transmission en cuisine...' : t.submitOrder}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 7. Live Tracking Modal / Screen */}
      <AnimatePresence>
        {trackedOrder && activeOrderId && (
          <div className="modal-centered-wrapper" style={{ zIndex: 999 }}>
            <motion.div 
              className="modal-centered-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="table-tracking-box"
              style={{ position: 'relative', zIndex: 1000, width: '92%', maxWidth: 480 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={36} />
              </div>

              <span className="table-badge-pill" style={{ background: 'var(--green-900)', marginBottom: 12 }}>
                {activeTable.name} · Commande #{trackedOrder.id}
              </span>

              <h2 style={{ fontSize: 22, margin: '8px 0' }}>{t.orderSentTitle}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
                {t.orderSentSub}
              </p>

              {/* Status progression steps */}
              <div className="col" style={{ textAlign: 'left', marginBottom: 20 }}>
                {[
                  { key: 'NOUVELLE', label: '1. Reçue en cuisine' },
                  { key: 'PREPARATION', label: '2. En préparation' },
                  { key: 'PRETE', label: '3. Prête pour le service' },
                  { key: 'TERMINEE', label: '4. Servie à table' }
                ].map((step) => {
                  const isCurrent = trackedOrder.status === step.key;
                  return (
                    <div 
                      key={step.key} 
                      className={`table-status-step ${isCurrent ? 'active' : ''}`}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: isCurrent ? '#10b981' : '#9ca3af' }} />
                      <span style={{ fontWeight: isCurrent ? 700 : 500, fontSize: 13 }}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {trackedOrder.paymentStatus !== 'PAYÉ' && (
                <div style={{ padding: 12, background: '#fef3c7', borderRadius: 10, color: '#92400e', fontSize: 12, marginBottom: 16 }}>
                  {t.counterPaymentNotice}
                </div>
              )}

              <button 
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setActiveOrderId(null);
                }}
              >
                {t.orderAnother}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Custom Bowl Builder Modal */}
      <AnimatePresence>
        {showBuilderModal && (
          <div className="modal-centered-wrapper" style={{ zIndex: 980 }}>
            <motion.div 
              className="modal-centered-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBuilderModal(false)}
            />
            <motion.div 
              className="table-card"
              style={{ position: 'relative', zIndex: 990, width: '92%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', padding: 20, borderRadius: 20 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <div>
                  <strong style={{ fontSize: 18 }}>Composer mon bol</strong>
                  <span className="muted small" style={{ display: 'block' }}>Étape {builderStep + 1} / 5</span>
                </div>
                <button className="icon-btn" onClick={() => setShowBuilderModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Step 0: Taille & Base */}
              {builderStep === 0 && (
                <div className="col gap-3">
                  <div>
                    <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>1. Choisir la taille</span>
                    <div className="row gap-2">
                      <button 
                        className={`chip grow ${customSize === 'M' ? 'active' : ''}`}
                        onClick={() => setCustomSize('M')}
                        style={{ padding: 10, justifyContent: 'center' }}
                      >
                        Medium (M) · 11,90 €
                      </button>
                      <button 
                        className={`chip grow ${customSize === 'L' ? 'active' : ''}`}
                        onClick={() => setCustomSize('L')}
                        style={{ padding: 10, justifyContent: 'center' }}
                      >
                        Large (L) · 14,90 €
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>2. Choisir votre base</span>
                    <div className="col gap-1">
                      {(MENU.bases || []).map(b => (
                        <button 
                          key={b.name}
                          className={`chip ${customBase === b.name ? 'active' : ''}`}
                          onClick={() => setCustomBase(b.name)}
                          style={{ padding: 10, justifyContent: 'flex-start' }}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Protéines */}
              {builderStep === 1 && (
                <div className="col gap-2">
                  <span className="eyebrow">Choisissez vos protéines (1 pour M, 2 pour L)</span>
                  {(MENU.proteines || []).map(p => {
                    const sel = customProteins.includes(p.name);
                    return (
                      <button 
                        key={p.name}
                        className={`chip ${sel ? 'active' : ''}`}
                        onClick={() => {
                          setCustomProteins(prev => sel ? prev.filter(x => x !== p.name) : [...prev, p.name]);
                        }}
                        style={{ padding: 10, justifyContent: 'space-between' }}
                      >
                        <span>{p.name}</span>
                        {sel && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Fruits & Légumes */}
              {builderStep === 2 && (
                <div className="col gap-2">
                  <span className="eyebrow">Choisissez jusqu'à 4 fruits & légumes frais</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {(MENU.fruitsLegumes || []).map(f => {
                      const sel = customVeggies.includes(f.name);
                      return (
                        <button 
                          key={f.name}
                          className={`chip ${sel ? 'active' : ''}`}
                          onClick={() => {
                            setCustomVeggies(prev => sel ? prev.filter(x => x !== f.name) : [...prev, f.name]);
                          }}
                          style={{ padding: 10, fontSize: 12 }}
                        >
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Sauce */}
              {builderStep === 3 && (
                <div className="col gap-2">
                  <span className="eyebrow">Choisissez votre sauce</span>
                  {(MENU.sauces || []).map(s => (
                    <button 
                      key={s.name}
                      className={`chip ${customSauce === s.name ? 'active' : ''}`}
                      onClick={() => setCustomSauce(s.name)}
                      style={{ padding: 10, justifyContent: 'space-between' }}
                    >
                      <span>{s.name}</span>
                      {customSauce === s.name && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 4: Toppings */}
              {builderStep === 4 && (
                <div className="col gap-2">
                  <span className="eyebrow">Toppings croquants</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {(MENU.toppings || []).map(tp => {
                      const sel = customToppings.includes(tp.name);
                      return (
                        <button 
                          key={tp.name}
                          className={`chip ${sel ? 'active' : ''}`}
                          onClick={() => {
                            setCustomToppings(prev => sel ? prev.filter(x => x !== tp.name) : [...prev, tp.name]);
                          }}
                          style={{ padding: 10, fontSize: 12 }}
                        >
                          {tp.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step Controls */}
              <div className="row between" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                {builderStep > 0 ? (
                  <button className="btn btn-ghost" onClick={() => setBuilderStep(s => s - 1)}>
                    Retour
                  </button>
                ) : <div />}

                {builderStep < 4 ? (
                  <button className="btn btn-primary" onClick={() => setBuilderStep(s => s + 1)}>
                    Suivant <ArrowRight size={14} />
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleConfirmCustomBowl}>
                    Ajouter au plateau
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Formule Modal */}
      <AnimatePresence>
        {selectedFormule && (
          <FormuleModal 
            formule={selectedFormule}
            onClose={() => setSelectedFormule(null)}
            onValidate={(customFormuleItem) => {
              addToCart({
                name: `${selectedFormule.name} (${customFormuleItem.bowlSize})`,
                price: customFormuleItem.price,
                composition: [
                  customFormuleItem.bowlName,
                  customFormuleItem.side,
                  customFormuleItem.drink,
                  customFormuleItem.dessert
                ].filter(Boolean)
              });
              setSelectedFormule(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
