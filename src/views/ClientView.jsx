import React from 'react';
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Bike, ArrowRight, MapPin, Clock, AtSign } from 'lucide-react';
import { useStore } from '../store';
import { MENU } from '../data';
import { formatPrice } from '../format';
import { page, list, item, ease } from '../motion';
import MenuScreen from './client/MenuScreen';
import BuilderScreen from './client/BuilderScreen';
import CheckoutScreen from './client/CheckoutScreen';
import TrackingScreen from './client/TrackingScreen';
import './client/client.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { restaurantOpen, setOrderType } = useStore();

  const start = (type) => {
    setOrderType(type);
    navigate('/menu');
  };

  return (
    <div className="screen">
      <div className="scroll">
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
              Bowls préparés à la commande, sauces et desserts maison. Pézenas.
            </motion.p>
          </div>
        </div>

        <motion.div className="col gap-6 section" variants={list} initial="initial" animate="animate">
          <motion.div variants={item} className="mode-grid">
            <button className="mode-card" onClick={() => start('RETRAIT')}>
              <ShoppingBag size={22} strokeWidth={1.75} />
              <span className="mode-title">À emporter</span>
              <span className="muted small">Retrait en boutique</span>
            </button>
            <button className="mode-card" onClick={() => start('LIVRAISON')}>
              <Bike size={22} strokeWidth={1.75} />
              <span className="mode-title">Livraison</span>
              <span className="muted small">Pézenas et alentours</span>
            </button>
          </motion.div>

          <motion.div variants={item} className="col gap-3">
            <div className="row between">
              <h2 className="display" style={{ fontSize: 22 }}>Les classiques</h2>
              <button className="link-btn" onClick={() => navigate('/menu')}>
                Toute la carte <ArrowRight size={14} />
              </button>
            </div>
            <div className="classic-strip">
              {MENU.classiques.map((c, i) => (
                <motion.button
                  key={c.id}
                  className="classic-tile"
                  onClick={() => { if (!useStore.getState().orderType) setOrderType('RETRAIT'); navigate('/builder', { state: { baseItem: c } }); }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.45, ease }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`classic-swatch s-${c.id}`} />
                  <span className="classic-name">{c.name}</span>
                  <span className="muted small">{c.description}</span>
                  <span className="price small">dès {formatPrice(c.priceM)}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="info-block">
            <div className="info-row">
              <MapPin size={16} />
              <span>7 rue Anatole France, 34120 Pézenas</span>
            </div>
            <div className="divider" />
            <div className="info-row">
              <Clock size={16} />
              <span>Mar – Sam · 11h30 – 14h30 · 18h30 – 21h30</span>
            </div>
            <div className="divider" />
            <div className="info-row">
              <AtSign size={16} />
              <span>@hoya_poke</span>
            </div>
          </motion.div>
        </motion.div>
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
    <MemoryRouter>
      <div className="client-root">
        <AnimatedRoutes />
      </div>
    </MemoryRouter>
  );
}
