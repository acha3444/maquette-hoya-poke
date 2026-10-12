import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Plus, Check, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useStore } from '../../store';
import { MENU, FORMULES } from '../../data';
import { formatPrice } from '../../format';
import { ease } from '../../motion';
import FormuleModal from '../../components/FormuleModal';
import BowlArt from '../../components/brand/BowlArt';
import { useDragScroll } from '../../utils/useDragScroll';

const CATEGORIES = [
  { id: 'formules', label: 'Formules midi' },
  { id: 'classiques', label: 'Classiques' },
  { id: 'surmesure', label: 'Sur mesure' },
  { id: 'sides', label: 'Sides' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' }
];

const reveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.45, ease }
};

const DESKTOP_QUERY = '(min-width: 860px)';
const subscribeDesktop = (cb) => {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useIsDesktop = () => useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches);

function AddButton({ item }) {
  const addToCart = useStore(s => s.addToCart);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <motion.button
      className={`add-btn ${added ? 'done' : ''}`}
      whileTap={{ scale: 0.9 }}
      aria-label={`Ajouter ${item.name}`}
      onClick={() => {
        addToCart({ ...item, cartName: item.name, composition: [item.name] });
        setAdded(true);
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={added ? 'ok' : 'add'}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'grid' }}
        >
          {added ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function SimpleItem({ item, soldOut }) {
  return (
    <motion.div className={`menu-row ${soldOut ? 'sold-out' : ''}`} {...reveal}>
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
        />
      )}
      <div className="grow col gap-1">
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <span className="menu-name">{item.name}</span>
          {item.bestseller && <span className="tag tag-gold">Le plus commandé</span>}
          {item.badge && <span className="tag tag-green">{item.badge}</span>}
        </div>
        {item.description && <span className="muted small" style={{ fontSize: 11 }}>{item.description}</span>}
        <span className="price small">{formatPrice(item.price)}</span>
      </div>
      {soldOut ? <span className="tag">Épuisé</span> : <AddButton item={item} />}
    </motion.div>
  );
}

export default function MenuScreen() {
  const navigate = useNavigate();
  const { cart, orderType, setOrderType, outOfStock, removeFromCart, addToCart, menu: storeMenu } = useStore();
  const menu = storeMenu || MENU;
  const [activeCategory, setActiveCategory] = useState('formules');
  const [cartOpen, setCartOpen] = useState(false);
  const [dietFilter, setDietFilter] = useState('all');
  const [selectedFormule, setSelectedFormule] = useState(null);
  const scrollRef = useRef(null);
  const lockSpy = useRef(false);
  const dragControls = useDragControls();
  const isDesktop = useIsDesktop();
  const catBarDrag = useDragScroll();
  const dietBarDrag = useDragScroll();

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    if (!orderType) setOrderType('RETRAIT');
  }, [orderType, setOrderType]);

  const sheetOpen = cartOpen && cart.length > 0;

  // Highlight the category currently in view
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      if (lockSpy.current) return;
      const top = root.getBoundingClientRect().top;
      let current = CATEGORIES[0].id;
      for (const cat of CATEGORIES) {
        const el = document.getElementById(`cat-${cat.id}`);
        if (el && el.getBoundingClientRect().top - top < 80) current = cat.id;
      }
      setActiveCategory(current);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setActiveCategory(id);
    lockSpy.current = true;
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { lockSpy.current = false; }, 600);
  };

  // Filter items by diet
  const filterClassiques = (items = []) => {
    if (dietFilter === 'all') return items;
    if (dietFilter === 'veggie') return items.filter(i => i.id === 'c3'); // Falafel
    if (dietFilter === 'pesco') return items.filter(i => ['c1', 'c3', 'c4'].includes(i.id)); // Saumon, Falafel, Thon
    if (dietFilter === 'protein') return items.filter(i => ['c1', 'c2', 'c4'].includes(i.id)); // Saumon, Poulet, Thon
    if (dietFilter === 'sans_gluten') return items; // bases et garnitures adaptées
    return items;
  };

  const hasDrinkInCart = cart.some(i => (menu.boissons || []).some(b => b.name === i.name || b.name === i.cartName) || i.isFormule);
  const hasDessertInCart = cart.some(i => (menu.desserts || []).some(d => d.name === i.name || d.name === i.cartName) || i.isFormule);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <div className="order-type-toggle">
          {['RETRAIT', 'LIVRAISON'].map(t => (
            <button key={t} className={orderType === t ? 'active' : ''} onClick={() => setOrderType(t)}>
              {orderType === t && <motion.span layoutId="ot-pill" className="ot-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span>{t === 'RETRAIT' ? 'À emporter' : 'Livraison'}</span>
            </button>
          ))}
        </div>
        <span />
      </div>

      <div className="cat-bar drag-scroll" ref={catBarDrag.ref}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => scrollTo(cat.id)}
            className={activeCategory === cat.id ? 'active' : ''}
          >
            {cat.label}
            {activeCategory === cat.id && (
              <motion.span layoutId="cat-underline" className="cat-underline" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
          </button>
        ))}
      </div>

      {/* Dietary Filters Pill Strip */}
      <div className="diet-filter-bar drag-scroll" ref={dietBarDrag.ref}>
        {[
          { id: 'all', label: 'Tous les plats' },
          { id: 'veggie', label: 'Végétarien' },
          { id: 'sans_gluten', label: 'Sans gluten' },
          { id: 'pesco', label: 'Pescétarien' },
          { id: 'protein', label: 'Protéiné' }
        ].map(df => (
          <button
            key={df.id}
            className={`diet-filter-pill ${dietFilter === df.id ? 'active' : ''}`}
            onClick={() => setDietFilter(df.id)}
          >
            {df.label}
          </button>
        ))}
      </div>

      <div className="scroll" ref={scrollRef}>
        <div className="menu-body">
          {/* Section Formules */}
          <section id="cat-formules" className="menu-section">
            <h2 className="display menu-heading">Les formules du midi</h2>
            <p className="muted small menu-lead">Poké au choix + Boisson fraîche (+ Dessert). Économisez jusqu'à 2,50 €.</p>
            <div className="menu-section-grid">
              {FORMULES.map(f => (
                <motion.div
                  key={f.id}
                  className="menu-row clickable"
                  onClick={() => setSelectedFormule(f)}
                  {...reveal}
                >
                  <div className="grow col gap-1">
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      <span className="menu-name">{f.name}</span>
                      <span className="tag tag-gold">{f.badge}</span>
                    </div>
                    <span className="muted small" style={{ fontSize: 11 }}>{f.description}</span>
                    <span className="price small">M {formatPrice(f.priceM)} · L {formatPrice(f.priceL)}</span>
                  </div>
                  <button className="btn btn-sm btn-primary">Composer</button>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="cat-classiques" className="menu-section">
            <h2 className="display menu-heading">Les classiques</h2>
            <p className="muted small menu-lead">Riz vinaigré, carotte, concombre, edamame, avocat, ananas, sésame. Vous choisissez la sauce.</p>
            <div className="menu-section-grid">
            {filterClassiques(menu.classiques || []).map(item => {
              const proteinId = (menu.proteines || []).find(p => p.name === item.defaultProtein)?.id;
              const soldOut = outOfStock.includes(proteinId);
              return (
                <motion.button
                  key={item.id}
                  className={`menu-row clickable ${soldOut ? 'sold-out' : ''}`}
                  disabled={soldOut}
                  onClick={() => navigate('/builder', { state: { baseItem: item } })}
                  {...reveal}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                    />
                  ) : (
                    <span className="menu-bowl"><BowlArt item={item} className="menu-bowl-art" /></span>
                  )}
                  <div className="grow col gap-1">
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      <span className="menu-name">{item.name}</span>
                      {item.badge && <span className="tag tag-green">{item.badge}</span>}
                    </div>
                    <span className="muted small">{item.description}</span>
                    <span className="price small">M {formatPrice(item.priceM)} · L {formatPrice(item.priceL)}</span>
                  </div>
                  {soldOut ? <span className="tag">Épuisé</span> : <ArrowRight size={18} className="muted" />}
                </motion.button>
              );
            })}
            </div>
          </section>

          <section id="cat-surmesure" className="menu-section">
            <h2 className="display menu-heading">Sur mesure</h2>
            <motion.button className="custom-card" onClick={() => navigate('/builder', { state: { isCustom: true } })} {...reveal} whileTap={{ scale: 0.99 }}>
              <div className="col gap-1" style={{ textAlign: 'left' }}>
                <span className="menu-name" style={{ color: 'var(--cream)' }}>Le Sur Mesure</span>
                <span className="small" style={{ opacity: 0.75 }}>1 base, 5 fruits & légumes, 1 protéine, 1 sauce, 2 toppings</span>
                <span className="price small" style={{ color: 'var(--gold)' }}>dès {formatPrice(menu.surMesureBase?.priceM || 12.90)}</span>
              </div>
              <span className="custom-cta">Composer <ArrowRight size={14} /></span>
            </motion.button>
          </section>

          <section id="cat-sides" className="menu-section">
            <h2 className="display menu-heading">Sides</h2>
            <div className="menu-section-grid">
              {(menu.sides || []).map(item => <SimpleItem key={item.id} item={item} soldOut={outOfStock.includes(item.id)} />)}
            </div>
          </section>

          <section id="cat-desserts" className="menu-section">
            <h2 className="display menu-heading">Desserts du moment</h2>
            <div className="menu-section-grid">
              {(menu.desserts || []).map(item => <SimpleItem key={item.id} item={item} soldOut={outOfStock.includes(item.id)} />)}
            </div>
          </section>

          <section id="cat-boissons" className="menu-section">
            <h2 className="display menu-heading">Boissons</h2>
            <div className="menu-section-grid">
              {(menu.boissons || []).map(item => <SimpleItem key={item.id} item={item} soldOut={outOfStock.includes(item.id)} />)}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            className="cart-bar-wrap"
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
          >
            <button className="cart-bar" onClick={() => setCartOpen(true)}>
              <span className="row gap-2">
                <motion.span
                  key={cart.length}
                  className="cart-count"
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {cart.length}
                </motion.span>
                Voir le panier
              </span>
              <span className="price">{formatPrice(cartTotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              className={`sheet ${isDesktop ? 'drawer' : ''}`}
              style={{ height: '78%' }}
              initial={isDesktop ? { x: '100%' } : { y: '100%' }}
              animate={isDesktop ? { x: 0 } : { y: 0 }}
              exit={isDesktop ? { x: '100%' } : { y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag={isDesktop ? false : 'y'}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) setCartOpen(false);
              }}
            >
              <div className="sheet-grip" onPointerDown={(e) => dragControls.start(e)}>
                <div className="sheet-handle" />
              </div>
              <div className="row between sheet-head">
                <h2 className="display" style={{ fontSize: 22 }}>Votre panier</h2>
                <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>

              <div className="scroll" style={{ padding: '0 20px' }}>
                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                      className="cart-line"
                    >
                      <div className="row between gap-3" style={{ alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700 }}>{item.cartName}</span>
                        <span className="price">{formatPrice(item.price)}</span>
                      </div>
                      {item.composition && item.composition.length > 1 && (
                        <p className="muted small">{item.composition.join(' · ')}</p>
                      )}
                      {item.removedIngredients?.length > 0 && (
                        <p className="text-danger small">Sans {item.removedIngredients.join(', ').toLowerCase()}</p>
                      )}
                      <button className="link-btn danger" onClick={() => removeFromCart(item.id)}>Retirer</button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Upselling Suggestions */}
                {(!hasDrinkInCart || !hasDessertInCart) && (
                  <div className="upsell-card" style={{ margin: '14px 0' }}>
                    <div className="row gap-2">
                      <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                      <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Parfait pour accompagner votre bol</strong>
                    </div>
                    {!hasDrinkInCart && (
                      <div className="upsell-item">
                        <div className="col">
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Thé pétillant artisanal</span>
                          <span className="price small">3,50 €</span>
                        </div>
                        <button 
                          className="btn btn-sm btn-ghost row gap-1"
                          onClick={() => addToCart({ name: 'Thé pétillant artisanal', cartName: 'Thé pétillant artisanal', price: 3.50, composition: ['Thé pétillant artisanal'] })}
                        >
                          <Plus size={14} /> Ajouter
                        </button>
                      </div>
                    )}
                    {!hasDessertInCart && (
                      <div className="upsell-item">
                        <div className="col">
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Tiramisu spéculoos maison</span>
                          <span className="price small">4,50 €</span>
                        </div>
                        <button 
                          className="btn btn-sm btn-ghost row gap-1"
                          onClick={() => addToCart({ name: 'Tiramisu spéculoos', cartName: 'Tiramisu spéculoos', price: 4.50, composition: ['Tiramisu spéculoos'] })}
                        >
                          <Plus size={14} /> Ajouter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bottom-bar">
                <div className="row between" style={{ marginBottom: 12 }}>
                  <span className="muted">Sous-total</span>
                  <span className="price" style={{ fontSize: 20 }}>{formatPrice(cartTotal)}</span>
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => { setCartOpen(false); navigate('/checkout'); }}
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FormuleModal 
        formule={selectedFormule} 
        isOpen={!!selectedFormule} 
        onClose={() => setSelectedFormule(null)} 
      />
    </div>
  );
}

