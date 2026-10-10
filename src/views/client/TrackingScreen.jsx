import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Phone, Check } from 'lucide-react';
import { useStore } from '../../store';
import { formatPrice } from '../../format';
import { ease } from '../../motion';
import MiniMap from '../../components/MiniMap';

const STATUS_ORDER = ['NOUVELLE', 'PREPARATION', 'PRETE', 'LIVRAISON', 'TERMINEE'];

const getSteps = (type) => [
  { id: 'NOUVELLE', label: 'Commande reçue', desc: 'Le restaurant va la confirmer' },
  { id: 'PREPARATION', label: 'En préparation', desc: 'Votre bol est en cours de préparation' },
  { id: 'PRETE', label: 'Prête', desc: type === 'RETRAIT' ? 'Vous pouvez venir la récupérer' : 'En attente du livreur' },
  ...(type === 'LIVRAISON' ? [{ id: 'LIVRAISON', label: 'En route', desc: 'Le livreur arrive' }] : []),
  { id: 'TERMINEE', label: type === 'RETRAIT' ? 'Récupérée' : 'Livrée', desc: 'Bon appétit' }
];

export default function TrackingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders } = useStore();

  const orderId = location.state?.orderId || orders[0]?.id;
  const order = orders.find(o => o.id === orderId);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (order?.status !== 'LIVRAISON') return;
    const interval = setInterval(() => setProgress(p => Math.min(1, p + 0.02)), 1000);
    return () => clearInterval(interval);
  }, [order?.status]);

  if (!order) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="muted">Commande introuvable.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  const steps = getSteps(order.type);
  const statusRank = STATUS_ORDER.indexOf(order.status);
  const currentIndex = Math.max(0, steps.findIndex(s => STATUS_ORDER.indexOf(s.id) >= statusRank));
  const done = order.status === 'TERMINEE';

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Fermer">
          <X size={20} />
        </button>
        <span className="topbar-title">Commande n° {order.id}</span>
        <span />
      </div>

      <div className="scroll">
        <div className="col gap-6 section">
          <motion.div
            className="eta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="eyebrow" style={{ color: 'rgba(250,245,240,0.6)' }}>
              {done ? 'Terminée' : order.type === 'RETRAIT' ? 'Retrait prévu à' : 'Livraison prévue à'}
            </span>
            <span className="display eta-time tnum">{order.time}</span>
            <span className="small" style={{ opacity: 0.75 }}>
              {order.type === 'RETRAIT' ? '7 rue Anatole France, Pézenas' : order.address}
            </span>
          </motion.div>

          <ol className="timeline">
            {steps.map((step, idx) => {
              const complete = idx < currentIndex || done;
              const current = idx === currentIndex && !done;
              return (
                <motion.li
                  key={step.id}
                  className={`tl-step ${complete ? 'complete' : ''} ${current ? 'current' : ''}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.07, duration: 0.4, ease }}
                >
                  <span className="tl-dot">
                    {complete && <Check size={12} strokeWidth={3} />}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="tl-line">
                      <motion.span
                        className="tl-line-fill"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: complete ? 1 : 0 }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.4, ease }}
                      />
                    </span>
                  )}
                  <div className="col">
                    <span className="tl-label">{step.label}</span>
                    {current && <span className="muted small">{step.desc}</span>}
                  </div>
                </motion.li>
              );
            })}
          </ol>

          {order.status === 'LIVRAISON' && (
            <motion.div className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <MiniMap progress={progress} height={170} />
              <div className="row between" style={{ padding: '12px 14px' }}>
                <div className="row gap-3">
                  <span className="avatar">{(order.driver || 'Alex')[0]}</span>
                  <div className="col">
                    <span style={{ fontWeight: 700 }}>{order.driver || 'Alex'}</span>
                    <span className="muted small">Votre livreur</span>
                  </div>
                </div>
                <button className="icon-btn" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} aria-label="Appeler le livreur">
                  <Phone size={16} />
                </button>
              </div>
            </motion.div>
          )}

          <div className="card summary">
            {order.items.map((line, i) => (
              <div key={i} className="row between gap-3 small">
                <span>{line.cartName || line.name}</span>
                <span className="tnum">{formatPrice(line.price)}</span>
              </div>
            ))}
            <div className="divider" />
            <div className="row between">
              <span style={{ fontWeight: 700 }}>Total payé</span>
              <span className="price">{formatPrice(order.total)}</span>
            </div>
          </div>

          <a className="btn btn-ghost btn-block" href="tel:+33400000000">
            <Phone size={16} /> Appeler le restaurant
          </a>
        </div>
      </div>
    </div>
  );
}
