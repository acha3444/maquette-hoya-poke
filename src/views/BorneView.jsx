import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Utensils, ArrowLeft, ArrowRight, Check, X, 
  RotateCcw, Sparkles, AlertTriangle, ShieldAlert, Heart,
  Volume2, Clock, Globe, Accessibility, Phone, Plus, Minus, Trash2
} from 'lucide-react';
import { useStore } from '../store';
import { MENU, FORMULES } from '../data';
import { formatPrice } from '../format';
import { RESTAURANT } from '../restaurant';
import HoyaMark from '../components/brand/HoyaMark';
import Branch from '../components/brand/Branch';
import DemoBowl from '../components/brand/DemoBowl';
import AnimatedMark from '../components/brand/AnimatedMark';
import { BowlScene } from '../components/BowlVisualizer';
import BowlArt from '../components/brand/BowlArt';
import { getKioskDeviceId, loadLocalKioskConfig, getNextKioskOrderNumber } from '../services/kioskService';
import { lockStaffApp } from '../components/StaffGuard';
import './borne/borne.css';

const TEXTS = {
  FR: {
    touchToOrder: 'Touchez l’écran pour commander',
    subtitle: 'Poké bowls frais & sains · Faits minute à Pézenas',
    chooseMode: 'Votre commande',
    dineIn: 'Sur place',
    dineInDesc: 'Plateau servi en salle ou terrasse',
    takeaway: 'À emporter',
    takeawayDesc: 'Sac emballé prêt à emporter',
    categories: {
      classiques: 'Classiques',
      surMesure: 'Sur mesure',
      formules: 'Formules Midi',
      sides: 'Sides & Entrées',
      boissons: 'Boissons',
      desserts: 'Desserts'
    },
    accessibleMode: 'Mode Accessible',
    changeLang: 'English',
    cartEmpty: 'Votre plateau est vide',
    total: 'Total',
    order: 'Commander',
    add: 'Ajouter',
    soldOut: 'Épuisé',
    customize: 'Personnaliser',
    sizeM: 'Medium (M)',
    sizeL: 'Large (L)',
    crossSellTitle: 'Envie d’une boisson ou d’un dessert ?',
    crossSellSub: 'Complétez votre repas ou profitez d’une formule avantageuse.',
    upgradeFormule: 'Passer en formule midi',
    noThanks: 'Non merci, continuer',
    recapTitle: 'Votre récapitulatif',
    modify: 'Modifier',
    validateAndPay: 'Valider ma commande',
    loyaltyTitle: 'Programme Fidélité',
    loyaltySub: 'Entrez votre numéro de téléphone pour cumuler un tampon (10 tampons = 1 bol offert !).',
    skipLoyalty: 'Passer sans fidélité',
    confirmLoyalty: 'Valider le numéro',
    payCounterTitle: 'Paiement au comptoir',
    payCounterDesc: 'Réglez directement au comptoir en espèces, carte bancaire ou titres-restaurant.',
    payCounterBtn: 'Confirmer et payer au comptoir',
    confirmTitle: 'Commande validée !',
    confirmMsg: 'Votre commande est envoyée en cuisine. Veuillez vous présenter au comptoir pour le paiement et le retrait.',
    orderNumberLabel: 'Numéro de commande',
    autoReturn: 'Retour à l’accueil dans',
    seconds: 'secondes',
    areYouThere: 'Vous êtes toujours là ?',
    stillHere: 'Oui, je continue ma commande',
    resetOrder: 'Annuler et recommencer',
    closedTitle: 'Borne momentanément fermée',
    closedDesc: 'Veuillez vous adresser directement au comptoir pour passer commande.',
    allergens: 'Allergènes & Infos',
    step: 'Étape'
  },
  EN: {
    touchToOrder: 'Touch the screen to order',
    subtitle: 'Fresh & healthy poké bowls · Made fresh in Pézenas',
    chooseMode: 'Choose your order type',
    dineIn: 'Eat-in',
    dineInDesc: 'Served on a tray in the dining room or terrace',
    takeaway: 'Takeaway',
    takeawayDesc: 'Packed in a bag ready to take away',
    categories: {
      classiques: 'Signatures',
      surMesure: 'Custom Bowl',
      formules: 'Lunch Combos',
      sides: 'Sides & Starters',
      boissons: 'Drinks',
      desserts: 'Desserts'
    },
    accessibleMode: 'Accessible Mode',
    changeLang: 'Français',
    cartEmpty: 'Your tray is empty',
    total: 'Total',
    order: 'Order',
    add: 'Add',
    soldOut: 'Sold out',
    customize: 'Customize',
    sizeM: 'Medium (M)',
    sizeL: 'Large (L)',
    crossSellTitle: 'Would you like a drink or dessert?',
    crossSellSub: 'Complete your meal or enjoy our great lunch combo deal.',
    upgradeFormule: 'Upgrade to Lunch Combo',
    noThanks: 'No thanks, continue',
    recapTitle: 'Order Summary',
    modify: 'Modify',
    validateAndPay: 'Confirm order',
    loyaltyTitle: 'Loyalty Program',
    loyaltySub: 'Enter your phone number to collect a stamp (10 stamps = 1 free bowl!).',
    skipLoyalty: 'Skip loyalty',
    confirmLoyalty: 'Confirm number',
    payCounterTitle: 'Pay at the counter',
    payCounterDesc: 'Pay directly at the cashier in cash or credit card.',
    payCounterBtn: 'Confirm & pay at the counter',
    confirmTitle: 'Order Confirmed!',
    confirmMsg: 'Your order has been sent to the kitchen. Please present yourself at the counter to pay and pick up your meal.',
    orderNumberLabel: 'Order Number',
    autoReturn: 'Returning to home in',
    seconds: 'seconds',
    areYouThere: 'Are you still there?',
    stillHere: 'Yes, keep ordering',
    resetOrder: 'Cancel and restart',
    closedTitle: 'Kiosk temporarily closed',
    closedDesc: 'Please order directly at the counter with our staff.',
    allergens: 'Allergens & Info',
    step: 'Step'
  }
};

export default function BorneView() {
  const navigate = useNavigate();
  const { menu, outOfStock, addOrder, restaurantOpen, kioskConfig } = useStore();
  const currentMenu = menu || MENU;
  const config = kioskConfig || loadLocalKioskConfig();

  // Kiosk Device & View State
  const [lang, setLang] = useState('FR');
  const t = TEXTS[lang];
  const [kioskState, setKioskState] = useState('ATTRACT'); // ATTRACT | MODE | CATALOG | CUSTOM_BUILDER | CROSS_SELL | RECAP | LOYALTY | PAYMENT | CONFIRMED
  const [orderType, setOrderType] = useState('SUR_PLACE'); // SUR_PLACE | A_EMPORTER
  const [isAccessible, setIsAccessible] = useState(false);
  const [selectedCat, setSelectedCat] = useState('classiques');
  const [selectedProduct, setSelectedProduct] = useState(null); // for item modal
  const [activeFormuleModal, setActiveFormuleModal] = useState(null);
  const [showAllergensModal, setShowAllergensModal] = useState(false);

  // Kiosk Cart (Dedicated state to ensure complete kiosk isolation)
  const [kioskCart, setKioskCart] = useState([]);
  const cartTotal = useMemo(() => kioskCart.reduce((sum, item) => sum + item.price, 0), [kioskCart]);

  // Custom Bowl Builder State
  const [builderStep, setBuilderStep] = useState(0); // 0: Size, 1: Base, 2: Veggies, 3: Protein, 4: Sauce, 5: Toppings
  const [customBowl, setCustomBowl] = useState({
    size: 'M',
    base: '',
    fruitsLegumes: [],
    proteine: '',
    sauce: '',
    toppings: [],
    price: 12.90
  });

  // Classic bowl options modal
  const [classicOptions, setClassicOptions] = useState({
    item: null,
    size: 'M',
    sauce: '',
    removedIngredients: []
  });

  // Loyalty Phone Keypad
  const [loyaltyPhone, setLoyaltyPhone] = useState('');

  // Confirmation order details
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(15);

  // Inactivity Detection
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(15);
  const lastInteractionRef = useRef(Date.now());
  const secretExitTimerRef = useRef(null);

  // Wake Lock Ref
  const wakeLockRef = useRef(null);

  // Reset interaction timer
  const recordInteraction = () => {
    lastInteractionRef.current = Date.now();
    if (showIdleModal) {
      setShowIdleModal(false);
    }
  };

  // 1. Screen Wake Lock & Fullscreen
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();

    // Re-request wake lock on visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Auto-reload at 4 AM every night
    const checkNightlyReload = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 4 && now.getMinutes() === 0) {
        window.location.reload();
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(checkNightlyReload);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 2. Inactivity Monitor
  useEffect(() => {
    if (kioskState === 'ATTRACT' || kioskState === 'CONFIRMED') {
      return;
    }

    const interval = setInterval(() => {
      const idleTime = Math.floor((Date.now() - lastInteractionRef.current) / 1000);
      const limit = config.idleTimeout || 60;

      if (idleTime >= limit && !showIdleModal) {
        setShowIdleModal(true);
        setIdleCountdown(15);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [kioskState, config.idleTimeout, showIdleModal]);

  const handleResetKiosk = () => {
    setKioskCart([]);
    setConfirmedOrder(null);
    setSelectedProduct(null);
    setShowIdleModal(false);
    setLoyaltyPhone('');
    setKioskState('ATTRACT');
  };

  // Idle countdown tick
  useEffect(() => {
    if (!showIdleModal) return;

    if (idleCountdown <= 0) {
      // Inactivity timeout: clear and reset to attract
      handleResetKiosk();
      return;
    }

    const tId = setTimeout(() => {
      setIdleCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(tId);
  }, [showIdleModal, idleCountdown]);

  // Auto return after confirmation
  useEffect(() => {
    if (kioskState !== 'CONFIRMED') return;

    if (autoReturnCountdown <= 0) {
      handleResetKiosk();
      return;
    }

    const tId = setTimeout(() => {
      setAutoReturnCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(tId);
  }, [kioskState, autoReturnCountdown]);

  // 3. Secret Exit (5-second long press on top-right corner)
  const handleSecretExitStart = () => {
    secretExitTimerRef.current = setTimeout(() => {
      lockStaffApp();
      navigate('/admin');
    }, 5000);
  };

  const handleSecretExitEnd = () => {
    if (secretExitTimerRef.current) {
      clearTimeout(secretExitTimerRef.current);
      secretExitTimerRef.current = null;
    }
  };

  // Cart operations
  const addKioskCartItem = (item) => {
    recordInteraction();
    setKioskCart(prev => [...prev, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  };

  const removeKioskCartItem = (id) => {
    recordInteraction();
    setKioskCart(prev => prev.filter(i => i.id !== id));
  };

  // Step calculations for custom bowl
  const handleAddCustomBowl = () => {
    recordInteraction();
    addKioskCartItem({
      cartName: `Poké Sur Mesure (${customBowl.size})`,
      name: 'Poké Sur Mesure',
      price: customBowl.price,
      size: customBowl.size,
      composition: [
        customBowl.base,
        ...customBowl.fruitsLegumes,
        customBowl.proteine,
        customBowl.sauce,
        ...customBowl.toppings
      ].filter(Boolean)
    });
    setKioskState('CATALOG');
  };

  // Place order from Borne
  const handlePlaceBorneOrder = async () => {
    recordInteraction();
    const kioskId = getKioskDeviceId();
    const dailyNumber = getNextKioskOrderNumber();
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: dailyNumber, // e.g. B-001
      status: 'NOUVELLE',
      source: 'BORNE',
      type: orderType, // 'SUR_PLACE' | 'A_EMPORTER'
      time: nowTime,
      customerName: `${kioskId} (${dailyNumber})`,
      customerPhone: loyaltyPhone || 'BORNE',
      address: orderType === 'SUR_PLACE' ? 'Sur place (Borne)' : 'À emporter (Borne)',
      kioskId,
      dailyNumber,
      total: cartTotal,
      paymentStatus: 'À ENCAISSER', // V1: pay at counter
      items: kioskCart
    };

    await addOrder(newOrder);
    setConfirmedOrder(newOrder);
    setKioskCart([]);
    setAutoReturnCountdown(15);
    setKioskState('CONFIRMED');
  };

  // Guard: if restaurant is closed or kiosk disabled by admin
  const isKioskClosed = !restaurantOpen || config.enabled === false;

  return (
    <div 
      className={`borne-root ${isAccessible ? 'is-accessible' : ''}`}
      onTouchStart={recordInteraction}
      onClick={recordInteraction}
    >
      {/* Secret Exit Button (5s press in top-right) */}
      <button 
        className="borne-secret-exit"
        onMouseDown={handleSecretExitStart}
        onMouseUp={handleSecretExitEnd}
        onTouchStart={handleSecretExitStart}
        onTouchEnd={handleSecretExitEnd}
        aria-label="Sortie sécurisée"
        title="Appui long 5s pour sortir de la borne"
      />

      {/* Persistent Top Bar */}
      <header className="borne-top-bar">
        <div className="borne-top-brand">
          <HoyaMark size={32} />
          <span>Hoya Poké</span>
          <span style={{ fontSize: 13, opacity: 0.75, fontWeight: 600, marginLeft: 8 }}>
            {getKioskDeviceId()}
          </span>
        </div>

        <div className="borne-top-actions">
          {/* Accessibility Toggle */}
          <button 
            className={`borne-pill-btn ${isAccessible ? 'active' : ''}`}
            onClick={() => setIsAccessible(!isAccessible)}
          >
            <Accessibility size={18} />
            <span>{t.accessibleMode}</span>
          </button>

          {/* Language Switcher */}
          <button 
            className="borne-pill-btn"
            onClick={() => setLang(lang === 'FR' ? 'EN' : 'FR')}
          >
            <Globe size={18} />
            <span>{t.changeLang}</span>
          </button>

          {/* Reset / Restart Order */}
          {kioskState !== 'ATTRACT' && kioskState !== 'CONFIRMED' && (
            <button 
              className="borne-pill-btn"
              onClick={handleResetKiosk}
              title="Recommencer"
            >
              <RotateCcw size={16} />
              <span>{t.resetOrder}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Kiosk Views */}
      <main className="borne-main-container">
        {isKioskClosed ? (
          <div className="borne-modes-screen">
            <AlertTriangle size={64} style={{ color: 'var(--curry)' }} />
            <h1 className="borne-attract-title">{t.closedTitle}</h1>
            <p className="borne-attract-sub">{t.closedDesc}</p>
            <p style={{ marginTop: 12, fontWeight: 600 }}>{RESTAURANT.nap}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* 1. Écran de veille (ATTRACT) */}
            {kioskState === 'ATTRACT' && (
              <motion.div 
                key="attract"
                className="borne-attract-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setKioskState('MODE')}
              >
                <Branch className="borne-attract-branch" />
                <motion.div
                  className="borne-attract-copy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="borne-attract-eyebrow">{RESTAURANT.tagline}</span>
                  <h1 className="borne-attract-title">{t.touchToOrder}</h1>
                  <p className="borne-attract-sub">{t.subtitle}</p>
                </motion.div>

                <div className="borne-attract-hero">
                  <DemoBowl className="borne-attract-demo" bowlClassName="borne-attract-bowl" />
                  <div className="borne-attract-sticker" aria-hidden="true">
                    <svg viewBox="0 0 120 120" className="borne-sticker-ring">
                      <defs><path id="borne-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
                      <text textLength="272" lengthAdjust="spacing">
                        <textPath href="#borne-ring" textLength="272" lengthAdjust="spacing">POKÉ BOWLS & COFFEE · HEALTHY FOOD ·</textPath>
                      </text>
                    </svg>
                    <HoyaMark size={34} />
                  </div>
                </div>

                <div className="borne-attract-cta">
                  <HoyaMark size={28} />
                  <span>{t.order}</span>
                  <ArrowRight size={24} />
                </div>

                <div className="borne-attract-ticker" aria-hidden="true">
                  <div>
                    {[...RESTAURANT.promises, ...RESTAURANT.promises].map((p, i) => (
                      <span key={i}>{p}<HoyaMark size={16} strokeWidth={12} /></span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Choix du Mode (Sur place vs À emporter) */}
            {kioskState === 'MODE' && (
              <motion.div 
                key="mode"
                className="borne-modes-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="borne-attract-title">{t.chooseMode}</h1>
                <div className="borne-modes-grid">
                  <button 
                    className="borne-mode-card"
                    onClick={() => {
                      setOrderType('SUR_PLACE');
                      setKioskState('CATALOG');
                    }}
                  >
                    <div className="borne-mode-icon"><Utensils size={48} /></div>
                    <div className="borne-mode-title">{t.dineIn}</div>
                    <div className="borne-mode-desc">{t.dineInDesc}</div>
                  </button>

                  <button 
                    className="borne-mode-card"
                    onClick={() => {
                      setOrderType('A_EMPORTER');
                      setKioskState('CATALOG');
                    }}
                  >
                    <div className="borne-mode-icon"><ShoppingBag size={48} /></div>
                    <div className="borne-mode-title">{t.takeaway}</div>
                    <div className="borne-mode-desc">{t.takeawayDesc}</div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. Catalogue & Sélection des Pokés */}
            {kioskState === 'CATALOG' && (
              <motion.div 
                key="catalog"
                className="borne-catalog-layout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Category Navigation Bar (64px+) */}
                <div className="borne-category-bar">
                  {Object.entries(t.categories).map(([catKey, catLabel]) => (
                    <button
                      key={catKey}
                      className={`borne-cat-tab ${selectedCat === catKey ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCat(catKey);
                        if (catKey === 'surMesure') {
                          setBuilderStep(0);
                          setCustomBowl({ size: 'M', base: '', fruitsLegumes: [], proteine: '', sauce: '', toppings: [], price: 12.90 });
                          setKioskState('CUSTOM_BUILDER');
                        }
                      }}
                    >
                      {catLabel}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                <div className="borne-products-scroll">
                  {/* Category: Classiques */}
                  {selectedCat === 'classiques' && (currentMenu.classiques || []).map(p => {
                    const isSoldOut = outOfStock.includes(p.id);
                    return (
                      <div 
                        key={p.id} 
                        className={`borne-product-card ${isSoldOut ? 'is-soldout' : ''}`}
                        onClick={() => {
                          if (isSoldOut) return;
                          setSelectedProduct(p);
                          setClassicOptions({ item: p, size: 'M', sauce: p.defaultSauce || 'Soja sucrée', removedIngredients: [] });
                        }}
                      >
                        {isSoldOut && <div className="borne-soldout-badge">{t.soldOut}</div>}
                        <div className="borne-product-art">
                          <BowlArt item={p} />
                          {p.badge && <span className="borne-badge-corner">{p.badge}</span>}
                        </div>
                        <div className="borne-product-info">
                          <div className="borne-product-name">{p.name}</div>
                          <div className="borne-product-desc">{p.description}</div>
                          <div className="borne-product-bottom">
                            <span className="borne-product-price">dès {formatPrice(p.priceM)}</span>
                            <button className="borne-product-add-btn">
                              <Plus size={16} /> {t.customize}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Category: Formules Midi */}
                  {selectedCat === 'formules' && FORMULES.map(f => (
                    <div 
                      key={f.id} 
                      className="borne-product-card"
                      onClick={() => {
                        addKioskCartItem({
                          cartName: f.name,
                          name: f.name,
                          price: f.priceM,
                          size: 'M',
                          isFormule: true,
                          composition: f.includes || []
                        });
                      }}
                    >
                      <div className="borne-product-art">
                        <HoyaMark size={64} style={{ color: 'var(--gold)' }} />
                        {f.badge && <span className="borne-badge-corner">{f.badge}</span>}
                      </div>
                      <div className="borne-product-info">
                        <div className="borne-product-name">{f.name}</div>
                        <div className="borne-product-desc">{f.description}</div>
                        <div className="borne-product-bottom">
                          <span className="borne-product-price">{formatPrice(f.priceM)}</span>
                          <button className="borne-product-add-btn">
                            <Plus size={16} /> {t.add}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Category: Sides & Desserts & Boissons */}
                  {['sides', 'desserts', 'boissons'].includes(selectedCat) && (currentMenu[selectedCat] || []).map(item => {
                    const isSoldOut = outOfStock.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`borne-product-card ${isSoldOut ? 'is-soldout' : ''}`}
                        onClick={() => {
                          if (isSoldOut) return;
                          addKioskCartItem({
                            cartName: item.name,
                            name: item.name,
                            price: item.price,
                            composition: [item.name]
                          });
                        }}
                      >
                        {isSoldOut && <div className="borne-soldout-badge">{t.soldOut}</div>}
                        <div className="borne-product-art">
                          <HoyaMark size={54} style={{ color: 'var(--green-800)', opacity: 0.8 }} />
                          {item.bestseller && <span className="borne-badge-corner">Best-Seller</span>}
                        </div>
                        <div className="borne-product-info">
                          <div className="borne-product-name">{item.name}</div>
                          <div className="borne-product-bottom">
                            <span className="borne-product-price">{formatPrice(item.price)}</span>
                            <button className="borne-product-add-btn">
                              <Plus size={16} /> {t.add}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Cart Bar */}
                {kioskCart.length > 0 && (
                  <div className="borne-bottom-bar">
                    <div className="borne-cart-summary">
                      <div className="borne-cart-badge">{kioskCart.length}</div>
                      <div className="borne-cart-total-info">
                        <span className="borne-cart-label">{t.total} TTC</span>
                        <span className="borne-cart-amount">{formatPrice(cartTotal)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 14 }}>
                      <button 
                        className="borne-pill-btn" 
                        style={{ color: 'var(--green-900)', background: 'var(--cream-2)', borderColor: 'var(--line)' }}
                        onClick={() => setKioskState('RECAP')}
                      >
                        {t.modify}
                      </button>

                      <button 
                        className="borne-validate-btn"
                        onClick={() => {
                          // If cross sell is active and customer only has bowls, trigger cross sell
                          if (config.crossSellEnabled) {
                            setKioskState('CROSS_SELL');
                          } else {
                            setKioskState('RECAP');
                          }
                        }}
                      >
                        <span>{t.validateAndPay}</span>
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. Bol Sur Mesure Tactile (Étape par écran) */}
            {kioskState === 'CUSTOM_BUILDER' && (
              <motion.div 
                key="custom-builder"
                className="borne-modes-screen"
                style={{ justifyContent: 'flex-start', paddingTop: 20 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ width: '100%', maxWidth: 760, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="borne-pill-btn"
                    style={{ color: 'var(--green-900)', background: 'var(--cream-2)' }}
                    onClick={() => {
                      if (builderStep > 0) setBuilderStep(builderStep - 1);
                      else setKioskState('CATALOG');
                    }}
                  >
                    <ArrowLeft size={18} /> {builderStep === 0 ? 'Retour carte' : 'Étape précédente'}
                  </button>

                  <h2 style={{ fontSize: 24, fontWeight: 800 }}>
                    {t.step} {builderStep + 1} / 5
                  </h2>

                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--green-800)' }}>
                    {formatPrice(customBowl.price)}
                  </span>
                </div>

                <div className="borne-builder-preview">
                  <BowlScene
                    className="borne-builder-bowl"
                    baseName={customBowl.base || 'Riz vinaigré'}
                    veggiesList={customBowl.fruitsLegumes}
                    proteinName={customBowl.proteine}
                    sauceName={customBowl.sauce}
                    toppingsList={customBowl.toppings}
                    isLarge={customBowl.size === 'L'}
                    label="Aperçu de votre bol"
                  />
                </div>

                {/* Step 0: Taille */}
                {builderStep === 0 && (
                  <div style={{ width: '100%', maxWidth: 760 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, margin: '20px 0', textAlign: 'center' }}>Choisissez votre taille</h2>
                    <div className="borne-grid-responsive-2">
                      <button 
                        className="borne-mode-card"
                        style={{ borderColor: customBowl.size === 'M' ? 'var(--green-800)' : 'var(--line)' }}
                        onClick={() => {
                          setCustomBowl(b => ({ ...b, size: 'M', price: 12.90 }));
                          setBuilderStep(1);
                        }}
                      >
                        <div style={{ fontSize: 32, fontWeight: 900 }}>Taille M</div>
                        <div>12,90 € · Le bol idéal</div>
                      </button>
                      <button 
                        className="borne-mode-card"
                        style={{ borderColor: customBowl.size === 'L' ? 'var(--green-800)' : 'var(--line)' }}
                        onClick={() => {
                          setCustomBowl(b => ({ ...b, size: 'L', price: 15.90 }));
                          setBuilderStep(1);
                        }}
                      >
                        <div style={{ fontSize: 32, fontWeight: 900 }}>Taille L</div>
                        <div>15,90 € · Pour les grosses faims</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Base */}
                {builderStep === 1 && (
                  <div style={{ width: '100%', maxWidth: 760 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, margin: '20px 0', textAlign: 'center' }}>1. Votre base</h2>
                    <div className="borne-grid-responsive-3">
                      {(currentMenu.bases || []).map(b => (
                        <button
                          key={b.id}
                          className="borne-mode-card"
                          style={{ minHeight: 160, padding: 20, borderColor: customBowl.base === b.name ? 'var(--green-800)' : 'var(--line)' }}
                          onClick={() => {
                            const extra = b.price || 0;
                            setCustomBowl(prev => ({ ...prev, base: b.name, price: (prev.size === 'M' ? 12.90 : 15.90) + extra }));
                            setBuilderStep(2);
                          }}
                        >
                          <div style={{ fontSize: 20, fontWeight: 800 }}>{b.name}</div>
                          {b.price > 0 && <div style={{ color: 'var(--gold-ink)', fontWeight: 700 }}>+{formatPrice(b.price)}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Fruits & Légumes (jusqu'à 5 inclus) */}
                {builderStep === 2 && (
                  <div style={{ width: '100%', maxWidth: 760 }}>
                    <h2 style={{ fontSize: 26, fontWeight: 900, margin: '14px 0', textAlign: 'center' }}>
                      2. Fruits & légumes ({customBowl.fruitsLegumes.length}/5 inclus)
                    </h2>
                    <div className="borne-grid-responsive-3" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
                      {(currentMenu.fruitsLegumes || []).map(fl => {
                        const isSelected = customBowl.fruitsLegumes.includes(fl.name);
                        return (
                          <button
                            key={fl.id}
                            className="borne-pill-btn"
                            style={{ 
                              justifyContent: 'space-between',
                              background: isSelected ? 'var(--green-800)' : 'var(--cream-2)',
                              color: isSelected ? 'var(--cream)' : 'var(--green-900)',
                              borderColor: isSelected ? 'var(--green-800)' : 'var(--line)'
                            }}
                            onClick={() => {
                              setCustomBowl(prev => {
                                const list = isSelected ? prev.fruitsLegumes.filter(f => f !== fl.name) : [...prev.fruitsLegumes, fl.name];
                                const extraCount = Math.max(0, list.length - 5);
                                const baseP = prev.size === 'M' ? 12.90 : 15.90;
                                return { ...prev, fruitsLegumes: list, price: baseP + extraCount * 1.00 };
                              });
                            }}
                          >
                            <span>{fl.name}</span>
                            {isSelected && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>
                    <button 
                      className="borne-validate-btn" 
                      style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
                      onClick={() => setBuilderStep(3)}
                    >
                      Étape suivante : Protéine <ArrowRight size={20} />
                    </button>
                  </div>
                )}

                {/* Step 3: Protéine */}
                {builderStep === 3 && (
                  <div style={{ width: '100%', maxWidth: 760 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, margin: '20px 0', textAlign: 'center' }}>3. Votre protéine</h2>
                    <div className="borne-grid-responsive-2">
                      {(currentMenu.proteines || []).map(prot => (
                        <button
                          key={prot.id}
                          className="borne-mode-card"
                          style={{ minHeight: 140, padding: 20, borderColor: customBowl.proteine === prot.name ? 'var(--green-800)' : 'var(--line)' }}
                          onClick={() => {
                            setCustomBowl(prev => ({ ...prev, proteine: prot.name }));
                            setBuilderStep(4);
                          }}
                        >
                          <div style={{ fontSize: 20, fontWeight: 800 }}>{prot.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Sauce & Croquant */}
                {builderStep === 4 && (
                  <div style={{ width: '100%', maxWidth: 760 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, margin: '20px 0', textAlign: 'center' }}>4. Sauce & Croquant</h2>
                    
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Sauce maison :</h3>
                    <div className="borne-grid-responsive-3" style={{ marginBottom: 20 }}>
                      {(currentMenu.sauces || []).map(s => (
                        <button
                          key={s.id}
                          className="borne-pill-btn"
                          style={{ 
                            background: customBowl.sauce === s.name ? 'var(--green-800)' : 'var(--cream-2)',
                            color: customBowl.sauce === s.name ? 'var(--cream)' : 'var(--green-900)'
                          }}
                          onClick={() => setCustomBowl(prev => ({ ...prev, sauce: s.name }))}
                        >
                          <span>{s.name}</span>
                        </button>
                      ))}
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Croquant :</h3>
                    <div className="borne-grid-responsive-3">
                      {(currentMenu.toppings || []).map(top => {
                        const isSelected = customBowl.toppings.includes(top.name);
                        return (
                          <button
                            key={top.id}
                            className="borne-pill-btn"
                            style={{ 
                              background: isSelected ? 'var(--green-800)' : 'var(--cream-2)',
                              color: isSelected ? 'var(--cream)' : 'var(--green-900)'
                            }}
                            onClick={() => {
                              setCustomBowl(prev => ({
                                ...prev,
                                toppings: isSelected ? prev.toppings.filter(t => t !== top.name) : [...prev.toppings, top.name]
                              }));
                            }}
                          >
                            <span>{top.name}</span>
                            {isSelected && <Check size={16} />}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      className="borne-validate-btn" 
                      style={{ marginTop: 28, width: '100%', justifyContent: 'center' }}
                      onClick={handleAddCustomBowl}
                    >
                      Ajouter mon bol au plateau ({formatPrice(customBowl.price)})
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 5. Ventes additionnelles (CROSS_SELL) */}
            {kioskState === 'CROSS_SELL' && (
              <motion.div 
                key="cross-sell"
                className="borne-modes-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ textAlign: 'center', maxWidth: 720 }}>
                  <h1 className="borne-attract-title">{t.crossSellTitle}</h1>
                  <p className="borne-attract-sub">{t.crossSellSub}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, width: 'min(92vw, 760px)' }}>
                  {(currentMenu.boissons || []).slice(0, 3).map(b => (
                    <div key={b.id} className="borne-product-card" onClick={() => addKioskCartItem({ cartName: b.name, name: b.name, price: b.price })}>
                      <div className="borne-product-info">
                        <div className="borne-product-name">{b.name}</div>
                        <div className="borne-product-bottom">
                          <span className="borne-product-price">{formatPrice(b.price)}</span>
                          <button className="borne-product-add-btn"><Plus size={16} /> {t.add}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(currentMenu.desserts || []).slice(0, 3).map(d => (
                    <div key={d.id} className="borne-product-card" onClick={() => addKioskCartItem({ cartName: d.name, name: d.name, price: d.price })}>
                      <div className="borne-product-info">
                        <div className="borne-product-name">{d.name}</div>
                        <div className="borne-product-bottom">
                          <span className="borne-product-price">{formatPrice(d.price)}</span>
                          <button className="borne-product-add-btn"><Plus size={16} /> {t.add}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                  <button 
                    className="borne-pill-btn"
                    style={{ minHeight: 64, padding: '0 32px', fontSize: 18, color: 'var(--green-900)' }}
                    onClick={() => setKioskState('RECAP')}
                  >
                    {t.noThanks}
                  </button>

                  <button 
                    className="borne-validate-btn"
                    onClick={() => setKioskState('RECAP')}
                  >
                    Voir mon récapitulatif <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 6. Récapitulatif du Panier */}
            {kioskState === 'RECAP' && (
              <motion.div 
                key="recap"
                className="borne-modes-screen"
                style={{ justifyContent: 'flex-start', paddingTop: 30 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ width: 'min(92vw, 680px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900 }}>{t.recapTitle}</h1>
                    <button className="borne-pill-btn" onClick={() => setKioskState('CATALOG')}>
                      + Ajouter d’autres articles
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '52vh', overflowY: 'auto' }}>
                    {kioskCart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--paper)', borderRadius: 18, border: '2px solid var(--line)' }}>
                        <div>
                          <strong style={{ fontSize: 18 }}>{item.cartName || item.name}</strong>
                          {item.composition && (
                            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                              {item.composition.join(', ')}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontSize: 20, fontWeight: 800 }}>{formatPrice(item.price)}</span>
                          <button 
                            className="icon-btn" 
                            style={{ color: '#c94a29' }} 
                            onClick={() => removeKioskCartItem(item.id)}
                            aria-label="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: '20px 0', borderTop: '2px solid var(--line)' }}>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{t.total} TTC :</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--green-900)' }}>{formatPrice(cartTotal)}</div>
                  </div>

                  <button 
                    className="borne-validate-btn" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                    onClick={() => setKioskState('LOYALTY')}
                  >
                    Valider et passer au paiement <ArrowRight size={22} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 7. Programme Fidélité (Pavé numérique géant sur écran) */}
            {kioskState === 'LOYALTY' && (
              <motion.div 
                key="loyalty"
                className="borne-modes-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ textAlign: 'center', maxWidth: 600 }}>
                  <h1 className="borne-attract-title">{t.loyaltyTitle}</h1>
                  <p className="borne-attract-sub">{t.loyaltySub}</p>
                </div>

                {/* Display Screen */}
                <div style={{ 
                  width: min(90, 360), 
                  minHeight: 64, 
                  background: 'var(--cream-2)', 
                  borderRadius: 20, 
                  border: '2px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: '0.1em'
                }}>
                  {loyaltyPhone || '06 _ _ _ _ _ _ _ _'}
                </div>

                {/* Giant Numpad */}
                <div className="borne-numpad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button 
                      key={num} 
                      className="borne-numkey"
                      onClick={() => {
                        recordInteraction();
                        if (loyaltyPhone.length < 10) setLoyaltyPhone(prev => prev + num);
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    className="borne-numkey" 
                    style={{ color: '#c94a29' }}
                    onClick={() => {
                      recordInteraction();
                      setLoyaltyPhone(prev => prev.slice(0, -1));
                    }}
                  >
                    ←
                  </button>
                  <button 
                    className="borne-numkey"
                    onClick={() => {
                      recordInteraction();
                      if (loyaltyPhone.length < 10) setLoyaltyPhone(prev => prev + '0');
                    }}
                  >
                    0
                  </button>
                  <button 
                    className="borne-numkey" 
                    style={{ color: 'var(--forest)' }}
                    onClick={() => setKioskState('PAYMENT')}
                  >
                    <Check size={28} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
                  <button 
                    className="borne-pill-btn" 
                    style={{ color: 'var(--green-900)' }}
                    onClick={() => setKioskState('PAYMENT')}
                  >
                    {t.skipLoyalty}
                  </button>
                  {loyaltyPhone.length >= 10 && (
                    <button 
                      className="borne-validate-btn"
                      onClick={() => setKioskState('PAYMENT')}
                    >
                      {t.confirmLoyalty}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* 8. Choix de Paiement (V1 Comptoir / Prêt pour terminal CB) */}
            {kioskState === 'PAYMENT' && (
              <motion.div 
                key="payment"
                className="borne-modes-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="borne-attract-title">{t.payCounterTitle}</h1>
                <p className="borne-attract-sub">{t.payCounterDesc}</p>

                <div style={{ background: 'var(--paper)', borderRadius: 28, padding: 36, border: '2px solid var(--line)', textAlign: 'center', width: 'min(90vw, 560px)' }}>
                  <div style={{ fontSize: 18, color: 'var(--muted)', marginBottom: 8 }}>Montant à régler au comptoir :</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--green-900)', marginBottom: 28 }}>
                    {formatPrice(cartTotal)}
                  </div>

                  <button 
                    className="borne-validate-btn" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handlePlaceBorneOrder}
                  >
                    <Check size={24} /> {t.payCounterBtn}
                  </button>
                </div>

                {/* Note: Architecture ready for future card terminal on kiosk */}
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
                  Terminal de paiement direct bientôt disponible sur cette borne.
                </div>
              </motion.div>
            )}

            {/* 9. Écran de Confirmation (Numéro B-XXX, 15s auto-return) */}
            {kioskState === 'CONFIRMED' && (
              <motion.div 
                key="confirmed"
                className="borne-modes-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="borne-confirm-box">
                  <div className="borne-confirm-mark">
                    <AnimatedMark size={84} delay={0.25} />
                  </div>

                  <h1 className="borne-attract-title">{t.confirmTitle}</h1>
                  <p className="borne-attract-sub">{t.confirmMsg}</p>

                  <div>
                    <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontWeight: 700 }}>
                      {t.orderNumberLabel}
                    </span>
                    <div className="borne-order-number-banner">
                      {confirmedOrder?.id || 'B-001'}
                    </div>
                  </div>

                  <div style={{ fontSize: 16, color: 'var(--muted)' }}>
                    {t.autoReturn} <strong>{autoReturnCountdown} {t.seconds}</strong>
                  </div>

                  <button className="borne-validate-btn" onClick={handleResetKiosk}>
                    Terminer et retour à l'accueil
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Product Customization Modal (for classics) */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="borne-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <motion.div 
              className="borne-modal-box"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="borne-modal-header">
                <h3 style={{ fontSize: 24, fontWeight: 800 }}>{selectedProduct.name}</h3>
                <button className="icon-btn" onClick={() => setSelectedProduct(null)}><X size={24} /></button>
              </div>

              <div className="borne-modal-body">
                <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 20 }}>{selectedProduct.description}</p>

                {/* Size choice */}
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Taille :</h4>
                <div className="borne-grid-responsive-2" style={{ marginBottom: 20 }}>
                  <button 
                    className="borne-pill-btn"
                    style={{ 
                      background: classicOptions.size === 'M' ? 'var(--green-800)' : 'var(--cream-2)',
                      color: classicOptions.size === 'M' ? 'var(--cream)' : 'var(--green-900)'
                    }}
                    onClick={() => setClassicOptions(prev => ({ ...prev, size: 'M' }))}
                  >
                    <span>Medium (M) · {formatPrice(selectedProduct.priceM)}</span>
                  </button>
                  <button 
                    className="borne-pill-btn"
                    style={{ 
                      background: classicOptions.size === 'L' ? 'var(--green-800)' : 'var(--cream-2)',
                      color: classicOptions.size === 'L' ? 'var(--cream)' : 'var(--green-900)'
                    }}
                    onClick={() => setClassicOptions(prev => ({ ...prev, size: 'L' }))}
                  >
                    <span>Large (L) · {formatPrice(selectedProduct.priceL)}</span>
                  </button>
                </div>

                {/* Sauce choice */}
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Sauce :</h4>
                <div className="borne-grid-responsive-3" style={{ marginBottom: 20 }}>
                  {(currentMenu.sauces || []).map(s => (
                    <button
                      key={s.id}
                      className="borne-pill-btn"
                      style={{ 
                        fontSize: 14,
                        background: classicOptions.sauce === s.name ? 'var(--green-800)' : 'var(--cream-2)',
                        color: classicOptions.sauce === s.name ? 'var(--cream)' : 'var(--green-900)'
                      }}
                      onClick={() => setClassicOptions(prev => ({ ...prev, sauce: s.name }))}
                    >
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>

                {/* Ingredients to remove */}
                {selectedProduct.ingredients && (
                  <>
                    <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Retirer un ingrédient (facultatif) :</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {selectedProduct.ingredients.map(ing => {
                        const isRemoved = classicOptions.removedIngredients.includes(ing);
                        return (
                          <button
                            key={ing}
                            className="borne-pill-btn"
                            style={{ 
                              fontSize: 14,
                              background: isRemoved ? '#c94a29' : 'var(--cream-2)',
                              color: isRemoved ? '#fff' : 'var(--green-900)'
                            }}
                            onClick={() => {
                              setClassicOptions(prev => ({
                                ...prev,
                                removedIngredients: isRemoved ? prev.removedIngredients.filter(i => i !== ing) : [...prev.removedIngredients, ing]
                              }));
                            }}
                          >
                            <span>{isRemoved ? `Sans ${ing}` : ing}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="borne-modal-footer">
                <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--forest)' }}>
                  {formatPrice(classicOptions.size === 'M' ? selectedProduct.priceM : selectedProduct.priceL)}
                </span>
                <button 
                  className="borne-validate-btn"
                  onClick={() => {
                    const price = classicOptions.size === 'M' ? selectedProduct.priceM : selectedProduct.priceL;
                    addKioskCartItem({
                      cartName: `${selectedProduct.name} (${classicOptions.size})`,
                      name: selectedProduct.name,
                      price,
                      size: classicOptions.size,
                      sauce: classicOptions.sauce,
                      removedIngredients: classicOptions.removedIngredients,
                      composition: (selectedProduct.ingredients || []).filter(i => !classicOptions.removedIngredients.includes(i))
                    });
                    setSelectedProduct(null);
                  }}
                >
                  Ajouter au plateau
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inactivity Alert Modal */}
      <AnimatePresence>
        {showIdleModal && (
          <div className="borne-modal-backdrop">
            <motion.div 
              className="borne-modal-box" 
              style={{ maxWidth: 480 }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="borne-idle-alert">
                <div className="borne-idle-countdown">{idleCountdown}</div>
                <h3 style={{ fontSize: 28, fontWeight: 900 }}>{t.areYouThere}</h3>
                <p style={{ fontSize: 16, color: 'var(--muted)' }}>
                  Sans action de votre part, la commande sera annulée pour le prochain client.
                </p>

                <button 
                  className="borne-validate-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    recordInteraction();
                    setShowIdleModal(false);
                  }}
                >
                  {t.stillHere}
                </button>

                <button 
                  className="borne-pill-btn"
                  style={{ color: '#c94a29', borderColor: '#c94a29' }}
                  onClick={handleResetKiosk}
                >
                  {t.resetOrder}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function min(a, b) {
  return typeof a === 'number' && typeof b === 'number' ? Math.min(a, b) : b;
}
