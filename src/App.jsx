import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MotionConfig, motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Bike, ShoppingBag, Volume2, Plus, RotateCcw, 
  X, Sparkles, CheckCircle2, ChevronUp, ChevronDown 
} from 'lucide-react';
import { useStore } from './store';
import { playNewOrderSound, unlockAudio } from './sound';
import ClientView from './views/ClientView';
import RestaurantView from './views/RestaurantView';
import DeliveryView from './views/DeliveryView';
import AdminView from './views/AdminView';
import StaffGuard from './components/StaffGuard';
import { usePwaManager } from './utils/usePwaManager';

function FloatingProNav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { simulateNewOrder, resetDemo } = useStore();

  if (hidden) {
    return (
      <button 
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 9999,
          background: 'rgba(15, 26, 20, 0.4)',
          border: 'none',
          color: 'var(--cream)',
          padding: '6px 10px',
          borderRadius: 20,
          fontSize: 11,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)'
        }}
        onClick={() => setHidden(false)}
        title="Afficher le menu pro"
      >
        ⚡ Staff
      </button>
    );
  }

  const isKitchen = location.pathname.startsWith('/cuisine') || location.pathname.startsWith('/admin');
  const isDelivery = location.pathname.startsWith('/livreur');
  const isClient = !isKitchen && !isDelivery;

  return (
    <>
      <button
        className="floating-pro-badge"
        onClick={() => setOpen(!open)}
        aria-label="Ouvrir le menu professionnel et démo"
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f8a3a', display: 'inline-block' }} />
          <span>Accès Pro / Démo</span>
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="floating-pro-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ padding: '14px 16px', background: 'var(--green-900)', color: 'var(--cream)' }} className="row between">
              <div className="row gap-2">
                <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                <strong style={{ fontSize: 14 }}>Hoya Poké · Espaces Pro</strong>
              </div>
              <button 
                onClick={() => setOpen(false)}
                style={{ color: 'var(--cream)', opacity: 0.8 }}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="col gap-2" style={{ padding: 14 }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>Navigation directe</span>
              
              <div className="col gap-1">
                <button
                  className={`btn btn-sm ${isClient ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => { navigate('/'); setOpen(false); }}
                >
                  <ShoppingBag size={15} />
                  <span>Site Client (Commande en ligne)</span>
                </button>

                <button
                  className={`btn btn-sm ${isKitchen ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => { navigate('/cuisine'); setOpen(false); }}
                >
                  <ChefHat size={15} />
                  <span>Écran Cuisine (KDS tablette)</span>
                </button>

                <button
                  className={`btn btn-sm ${isDelivery ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => { navigate('/livreur'); setOpen(false); }}
                >
                  <Bike size={15} />
                  <span>App Livreur (Courses & GPS)</span>
                </button>

                <button
                  className={`btn btn-sm ${location.pathname.startsWith('/admin') ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => { navigate('/admin'); setOpen(false); }}
                >
                  <Sparkles size={15} />
                  <span>Admin · Carte & Clôture Caisse</span>
                </button>
              </div>

              <div className="divider" style={{ margin: '6px 0' }} />

              <span className="eyebrow" style={{ fontSize: 10 }}>Outils de démonstration</span>

              <div className="row gap-2">
                <button
                  className="btn btn-sm btn-ghost grow"
                  style={{ fontSize: 12, padding: '0 8px' }}
                  onClick={async () => {
                    await unlockAudio();
                    playNewOrderSound(true);
                  }}
                  title="Tester le carillon sonore de nouvelle commande"
                >
                  <Volume2 size={13} />
                  <span>Test Son</span>
                </button>

                <button
                  className="btn btn-sm btn-ghost grow"
                  style={{ fontSize: 12, padding: '0 8px' }}
                  onClick={() => {
                    simulateNewOrder();
                  }}
                  title="Générer une commande test en direct"
                >
                  <Plus size={13} />
                  <span>+1 Commande</span>
                </button>
              </div>

              <button
                className="btn btn-sm btn-ghost"
                style={{ fontSize: 12, justifyContent: 'center', color: 'var(--muted)' }}
                onClick={() => {
                  if (confirm('Réinitialiser toutes les données de test ?')) {
                    resetDemo();
                  }
                }}
              >
                <RotateCcw size={12} />
                <span>Réinitialiser les données</span>
              </button>

              <div className="row between" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, padding: '4px 2px' }}>
                <span className="row gap-1" style={{ color: '#4f8a3a', fontWeight: 600 }}>
                  <CheckCircle2 size={12} /> Supabase Realtime Cloud
                </span>
                <button 
                  onClick={() => { setHidden(true); setOpen(false); }}
                  style={{ textDecoration: 'underline', color: 'var(--muted)', fontSize: 11 }}
                >
                  Masquer le bouton
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AppContent() {
  usePwaManager();

  return (
    <>
      <Routes>
        <Route 
          path="/cuisine" 
          element={
            <StaffGuard title="Écran Cuisine / KDS" defaultPin="1234">
              <RestaurantView />
            </StaffGuard>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <StaffGuard title="Administration Hoya Poké" defaultPin="1234">
              <AdminView />
            </StaffGuard>
          } 
        />
        <Route 
          path="/livreur" 
          element={
            <StaffGuard title="Espace Livreur" defaultPin="1234">
              <DeliveryView />
            </StaffGuard>
          } 
        />
        <Route path="/*" element={<ClientView />} />
      </Routes>
      <FloatingProNav />
    </>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
