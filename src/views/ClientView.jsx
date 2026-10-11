import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Bike, ArrowRight, MapPin, Clock, AtSign, 
  Sparkles, ChefHat, ShieldCheck, ExternalLink, ShoppingBasket,
  Gift, Star, Heart, Award
} from 'lucide-react';
import { useStore } from '../store';
import { MENU, FORMULES, CUSTOMER_REVIEWS } from '../data';
import { formatPrice } from '../format';
import { page, list, item, ease } from '../motion';
import MenuScreen from './client/MenuScreen';
import BuilderScreen from './client/BuilderScreen';
import CheckoutScreen from './client/CheckoutScreen';
import TrackingScreen from './client/TrackingScreen';
import LoyaltyModal from '../components/LoyaltyModal';
import FormuleModal from '../components/FormuleModal';
import './client/client.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { restaurantOpen, setOrderType, cart, menu: storeMenu, loyaltyStamps } = useStore();
  const menu = storeMenu || MENU;
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [activeFormule, setActiveFormule] = useState(null);

  const start = (type) => {
    setOrderType(type);
    navigate('/menu');
  };

  const cartCount = cart.length;

  return (
    <div className="screen">
      {/* Client Sticky Navigation Bar */}
      <header className="client-nav">
        <div className="client-nav-inner">
          <div className="client-nav-brand">
            <img src="/logo.jpg" alt="Logo Hoya Poké" className="client-nav-logo" />
            <div>
              <span className="client-nav-name">Hoya Poké</span>
              <span className="client-nav-city" style={{ marginLeft: 8 }}>Pézenas</span>
            </div>
          </div>

          <nav className="client-nav-links" aria-label="Navigation principale">
            <button onClick={() => navigate('/menu')}>La Carte</button>
            <button onClick={() => { setOrderType('RETRAIT'); navigate('/builder', { state: { isCustom: true } }); }}>
              Composer son Poké
            </button>
            <button onClick={() => setLoyaltyOpen(true)}>
              Poké Club (Fidélité)
            </button>
            <button onClick={() => {
              document.getElementById('infos-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Horaires & Accès
            </button>
          </nav>

          <div className="client-nav-actions">
            <button 
              className="btn btn-sm btn-ghost row gap-1"
              onClick={() => setLoyaltyOpen(true)}
              aria-label="Mon Poké Club"
              title="Carte de fidélité & Favoris"
            >
              <Gift size={16} style={{ color: 'var(--gold)' }} />
              <span className="small">Club</span>
              <span className="tag tag-gold" style={{ marginLeft: 2, height: 18, padding: '0 6px', fontSize: 10 }}>
                {loyaltyStamps}/10
              </span>
            </button>
            <button 
              className="btn btn-sm btn-ghost row gap-1"
              onClick={() => navigate('/menu')}
              aria-label="Mon panier"
            >
              <ShoppingBasket size={16} />
              <span className="small">Panier</span>
              {cartCount > 0 && (
                <span className="tag tag-gold" style={{ marginLeft: 4, height: 18, padding: '0 6px' }}>
                  {cartCount}
                </span>
              )}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => start('RETRAIT')}>
              Commander
            </button>
          </div>
        </div>
      </header>

      <div className="scroll">
        {/* Hero Section */}
        <div className="hero">
          <motion.div
            className="hero-img"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease }}
          />
          <div className="hero-content">
            <motion.span
              className={`status-chip ${restaurantOpen ? '' : 'closed'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
            >
              <span className={`live-dot ${restaurantOpen ? '' : 'off'}`} />
              {restaurantOpen ? 'Ouvert · prêt en 15 min' : 'Fermé · précommande possible'}
            </motion.span>
            
            <motion.h1
              className="display hero-title"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease }}
            >
              Hoya Poké
            </motion.h1>

            <motion.p
              className="hero-sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Bowls hawaïens frais préparés à la commande, marinades savoureuses et sauces maison. Pézenas.
            </motion.p>
          </div>
        </div>

        {/* Content Section */}
        <motion.div className="col gap-6 section" variants={list} initial="initial" animate="animate">
          {/* Mode Selector Cards */}
          <motion.div variants={item} className="mode-grid">
            <button className="mode-card" onClick={() => start('RETRAIT')}>
              <ShoppingBag size={24} strokeWidth={1.75} />
              <span className="mode-title">À emporter</span>
              <span className="muted small">Retrait au restaurant · 7 rue Anatole France</span>
            </button>
            <button className="mode-card" onClick={() => start('LIVRAISON')}>
              <Bike size={24} strokeWidth={1.75} />
              <span className="mode-title">Livraison</span>
              <span className="muted small">Directement chez vous · Pézenas & alentours</span>
            </button>
          </motion.div>

          {/* Signature Classics Strip */}
          <motion.div variants={item} className="col gap-3">
            <div className="row between">
              <h2 className="display" style={{ fontSize: 24 }}>Les classiques signature</h2>
              <button className="link-btn" onClick={() => navigate('/menu')}>
                Toute la carte <ArrowRight size={14} />
              </button>
            </div>
            <div className="classic-strip">
              {(menu.classiques || []).map((c, i) => (
                <motion.button
                  key={c.id}
                  className="classic-tile"
                  onClick={() => { 
                    if (!useStore.getState().orderType) setOrderType('RETRAIT'); 
                    navigate('/builder', { state: { baseItem: c } }); 
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.45, ease }}
                  whileTap={{ scale: 0.98 }}
                >
                  {c.image ? (
                    <img 
                      src={c.image} 
                      alt={c.name} 
                      style={{ width: '100%', height: 110, borderRadius: 12, objectFit: 'cover', marginBottom: 6 }} 
                    />
                  ) : (
                    <span className={`classic-swatch s-${c.id}`} />
                  )}
                  <span className="classic-name">{c.name}</span>
                  <span className="muted small">{c.description}</span>
                  <span className="price small">dès {formatPrice(c.priceM)}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Formules Déjeuner & Combos Strip */}
          <motion.div variants={item} className="col gap-3">
            <div className="row between">
              <div className="row gap-2">
                <span className="formule-badge">Formules Midi</span>
                <h2 className="display" style={{ fontSize: 24 }}>Nos Formules gourmandes</h2>
              </div>
              <button className="link-btn" onClick={() => navigate('/menu')}>
                Voir le menu <ArrowRight size={14} />
              </button>
            </div>
            <div className="classic-strip">
              {FORMULES.map((f, i) => (
                <motion.div
                  key={f.id}
                  className="classic-tile"
                  style={{ minWidth: 220, cursor: 'pointer', background: 'linear-gradient(180deg, #fff 0%, #faf6f0 100%)' }}
                  onClick={() => {
                    if (!useStore.getState().orderType) setOrderType('RETRAIT');
                    setActiveFormule(f);
                  }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="tag tag-gold" style={{ alignSelf: 'flex-start', fontSize: 10 }}>{f.badge}</span>
                  <strong style={{ fontSize: 15, marginTop: 4 }}>{f.name}</strong>
                  <span className="muted small" style={{ fontSize: 11, lineHeight: 1.3 }}>{f.description}</span>
                  <div className="row between" style={{ width: '100%', marginTop: 8 }}>
                    <span className="price small">dès {formatPrice(f.priceM)}</span>
                    <span className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: 11 }}>Choisir</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Custom Bowl Callout Banner */}
          <motion.div variants={item}>
            <div className="builder-callout">
              <div className="col gap-2">
                <div className="row gap-2">
                  <Sparkles size={20} style={{ color: 'var(--gold)' }} />
                  <span className="eyebrow" style={{ color: 'var(--gold)' }}>100% Personnalisable</span>
                </div>
                <h3 className="display" style={{ fontSize: 26, color: 'var(--cream)' }}>
                  Composez votre propre Poké Bowl
                </h3>
                <p style={{ opacity: 0.85, fontSize: 14, maxWidth: 540 }}>
                  Créez votre bol sur-mesure parmi plus de 30 ingrédients frais sélectionnés chaque matin par notre chef.
                </p>
                <div className="builder-callout-steps">
                  <span className="builder-step-pill">1. Base (Riz, Quinoa...)</span>
                  <span className="builder-step-pill">2. Protéines fraîches</span>
                  <span className="builder-step-pill">3. 5 Légumes & Fruits</span>
                  <span className="builder-step-pill">4. Sauce maison</span>
                  <span className="builder-step-pill">5. Toppings croquants</span>
                </div>
              </div>
              <button 
                className="btn btn-gold row gap-2"
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
                onClick={() => {
                  setOrderType(useStore.getState().orderType || 'RETRAIT');
                  navigate('/builder', { state: { isCustom: true } });
                }}
              >
                <span>Créer mon bol sur-mesure</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* Poké Club Loyalty Banner */}
          <motion.div variants={item}>
            <div 
              className="card"
              style={{
                background: 'linear-gradient(135deg, #1b3524 0%, #294c34 100%)',
                color: 'var(--cream)',
                padding: '20px 24px',
                borderRadius: 'var(--r-lg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
              onClick={() => setLoyaltyOpen(true)}
            >
              <div className="row gap-3">
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(200, 140, 50, 0.25)',
                  color: 'var(--gold)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Gift size={24} />
                </div>
                <div>
                  <div className="row gap-2">
                    <strong style={{ fontSize: 16 }}>Le Poké Club Hoya</strong>
                    <span className="tag tag-gold" style={{ fontSize: 10 }}>10 bols = 1 offert</span>
                  </div>
                  <span style={{ fontSize: 13, opacity: 0.85 }}>
                    Vous avez actuellement <strong>{loyaltyStamps}/10 tampons</strong>. Cliquez pour voir votre carte.
                  </span>
                </div>
              </div>

              <button className="btn btn-sm btn-gold row gap-1">
                <span>Ma carte fidélité</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Customer Reviews & Google Rating */}
          <motion.div variants={item} className="reviews-section">
            <div className="reviews-rating-header">
              <div>
                <div className="row gap-1" style={{ color: 'var(--gold)', marginBottom: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                  <strong style={{ color: 'var(--ink)', fontSize: 14, marginLeft: 6 }}>4.9 / 5</strong>
                </div>
                <h2 className="display" style={{ fontSize: 22 }}>Ce que nos clients en disent</h2>
                <span className="muted small">Vrais avis vérifiés · Pézenas & environs</span>
              </div>
            </div>

            <div className="reviews-carousel">
              {CUSTOMER_REVIEWS.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div className="row between">
                    <div className="row gap-1" style={{ color: 'var(--gold)' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <span className="muted small" style={{ fontSize: 11 }}>{rev.date}</span>
                  </div>
                  <p style={{ fontSize: 13, margin: '2px 0', lineHeight: 1.4, color: 'var(--ink)' }}>
                    "{rev.comment}"
                  </p>
                  <div className="row between" style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <div>
                      <strong style={{ fontSize: 12 }}>{rev.author}</strong>
                      <span className="muted small" style={{ marginLeft: 6, fontSize: 11 }}>· {rev.city}</span>
                    </div>
                    <span className="review-dish-tag">{rev.dish}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Reassurance Grid */}
          <motion.div variants={item} className="reassurance-grid">
            <div className="reassurance-card">
              <div className="reassurance-icon">
                <ChefHat size={20} />
              </div>
              <div className="col gap-1">
                <strong style={{ fontSize: 14 }}>100% Frais & Fait Maison</strong>
                <span className="muted small">Légumes découpés chaque matin, sauces et marinades artisanales.</span>
              </div>
            </div>
            <div className="reassurance-card">
              <div className="reassurance-icon">
                <Clock size={20} />
              </div>
              <div className="col gap-1">
                <strong style={{ fontSize: 14 }}>Service Minute (15 min)</strong>
                <span className="muted small">Commandez en ligne, votre commande est prête sans attente.</span>
              </div>
            </div>
            <div className="reassurance-card">
              <div className="reassurance-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="col gap-1">
                <strong style={{ fontSize: 14 }}>Sain & Gourmand</strong>
                <span className="muted small">Options végétariennes, sans gluten et riches en protéines.</span>
              </div>
            </div>
          </motion.div>

          {/* Info & Location Block */}
          <motion.div variants={item} id="infos-section" className="info-block">
            <div className="info-row between">
              <div className="row gap-3">
                <MapPin size={18} />
                <div>
                  <strong>7 rue Anatole France, 34120 Pézenas</strong>
                  <div className="muted small">Cœur historique de Pézenas</div>
                </div>
              </div>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=7+rue+Anatole+France+34120+Pezenas" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-sm btn-ghost row gap-1"
              >
                <span>Itinéraire</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="divider" />
            <div className="info-row">
              <Clock size={18} />
              <div>
                <strong>Mardi au Samedi : 11h30 – 14h30 · 18h30 – 21h30</strong>
                <div className="muted small">Fermé le Dimanche et le Lundi</div>
              </div>
            </div>
            <div className="divider" />
            <div className="info-row between">
              <div className="row gap-3">
                <AtSign size={18} />
                <span>Instagram officiel : <strong>@hoya_poke</strong></span>
              </div>
              <a 
                href="https://instagram.com/hoya_poke" 
                target="_blank" 
                rel="noreferrer"
                className="link-btn"
              >
                Suivre nos créations <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Modals for Loyalty and Formules */}
        <LoyaltyModal isOpen={loyaltyOpen} onClose={() => setLoyaltyOpen(false)} />
        <FormuleModal formule={activeFormule} isOpen={!!activeFormule} onClose={() => setActiveFormule(null)} />

        {/* Full Client Footer */}
        <footer className="client-footer">
          <div className="client-footer-inner">
            <div className="client-footer-grid">
              <div className="col gap-2">
                <div className="row gap-2">
                  <img src="/logo.jpg" alt="Hoya Poké" style={{ width: 28, height: 28, borderRadius: 6 }} />
                  <span className="client-footer-title" style={{ margin: 0 }}>Hoya Poké Pézenas</span>
                </div>
                <p className="muted small" style={{ color: 'rgba(250,245,240,0.7)', marginTop: 8 }}>
                  Restaurant de poké bowls hawaïens sains et savoureux. Préparation minute sur place, à emporter ou en livraison rapide.
                </p>
              </div>

              <div className="col gap-2">
                <h4 className="client-footer-title">Commander</h4>
                <div className="client-footer-links">
                  <button onClick={() => start('RETRAIT')}>À emporter (Click & Collect)</button>
                  <button onClick={() => start('LIVRAISON')}>En livraison à domicile</button>
                  <button onClick={() => navigate('/menu')}>Voir toute la carte</button>
                  <button onClick={() => { setOrderType('RETRAIT'); navigate('/builder', { state: { isCustom: true } }); }}>
                    Composer son Poké
                  </button>
                </div>
              </div>

              <div className="col gap-2">
                <h4 className="client-footer-title">Horaires & Contact</h4>
                <div className="client-footer-links">
                  <span>7 rue Anatole France, 34120 Pézenas</span>
                  <span>Mardi – Samedi : 11h30 – 14h30 / 18h30 – 21h30</span>
                  <a href="https://instagram.com/hoya_poke" target="_blank" rel="noreferrer">
                    Instagram : @hoya_poke
                  </a>
                </div>
              </div>

              <div className="col gap-2">
                <h4 className="client-footer-title">Espace Professionnel</h4>
                <div className="client-footer-links">
                  <button onClick={() => navigate('/cuisine')}>👨‍🍳 Écran Cuisine / KDS</button>
                  <button onClick={() => navigate('/livreur')}>🛵 Interface Livreur</button>
                  <button onClick={() => navigate('/tracking')}>📋 Suivi de commande</button>
                </div>
              </div>
            </div>

            <div className="client-footer-bottom">
              <span>© {new Date().getFullYear()} Hoya Poké Pézenas · Tous droits réservés.</span>
              <span>Développé pour Hoya Poké · Pézenas (Hérault)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} className="route" {...page}>
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/builder" element={<BuilderScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/tracking" element={<TrackingScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ClientView() {
  return (
    <div className="client-root">
      <AnimatedRoutes />
    </div>
  );
}
