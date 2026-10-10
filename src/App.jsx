import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { RotateCcw, Plus } from 'lucide-react';
import { useStore } from './store';
import { ease } from './motion';
import ClientView from './views/ClientView';
import RestaurantView from './views/RestaurantView';
import DeliveryView from './views/DeliveryView';

const VIEWS = [
  { id: 'client', label: 'Client' },
  { id: 'restaurant', label: 'Cuisine' },
  { id: 'delivery', label: 'Livreur' },
  { id: 'split', label: 'Client + Cuisine', short: 'Les deux' }
];

const frameMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } }
};

function App() {
  const { viewMode, setViewMode, resetDemo, simulateNewOrder } = useStore();
  const showClient = viewMode === 'client' || viewMode === 'split';
  const showRestaurant = viewMode === 'restaurant' || viewMode === 'split';

  return (
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <header className="shell-bar">
          <div className="shell-brand">
            <span className="display">Hoya Poké</span>
            <span className="shell-note">Maquette interactive · aucune commande réelle</span>
          </div>

          <nav className="segmented" aria-label="Vue">
            {VIEWS.map(v => (
              <button
                key={v.id}
                className={viewMode === v.id ? 'active' : ''}
                onClick={() => setViewMode(v.id)}
              >
                {viewMode === v.id && (
                  <motion.div layoutId="view-pill" className="pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                )}
                <span className="label-full">{v.label}</span>
                {v.short && <span className="label-short">{v.short}</span>}
              </button>
            ))}
          </nav>

          <div className="shell-actions">
            {showRestaurant && (
              <button className="shell-btn accent" onClick={simulateNewOrder}>
                <Plus size={14} strokeWidth={2.5} /> Commande test
              </button>
            )}
            <button className="shell-btn" onClick={resetDemo} title="Réinitialiser la démo">
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        </header>

        <main className={`stage ${viewMode === 'split' ? 'split' : ''}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            {showClient && (
              <motion.div key="client" className="frame frame-phone" {...frameMotion}>
                <ClientView />
              </motion.div>
            )}
            {showRestaurant && (
              <motion.div key="restaurant" className={`frame ${viewMode === 'split' ? 'frame-tablet' : ''}`} {...frameMotion}>
                <RestaurantView />
              </motion.div>
            )}
            {viewMode === 'delivery' && (
              <motion.div key="delivery" className="frame frame-phone" {...frameMotion}>
                <DeliveryView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
