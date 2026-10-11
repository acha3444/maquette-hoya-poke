import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Phone, Check, Share2, Copy, Sparkles, Gift, Heart } from 'lucide-react';
import { useStore } from '../../store';
import { formatPrice } from '../../format';
import { ease } from '../../motion';
import MiniMap from '../../components/MiniMap';

const STATUS_ORDER = ['NOUVELLE', 'PREPARATION', 'PRETE', 'LIVRAISON', 'TERMINEE'];

const getSteps = (type) => [
  { id: 'NOUVELLE', label: 'Commande reçue', desc: 'Le restaurant va la confirmer' },
  { id: 'PREPARATION', label: 'En préparation', desc: 'Votre bol est en cours de préparation minute' },
  { id: 'PRETE', label: 'Prête', desc: type === 'RETRAIT' ? 'Vous pouvez venir la récupérer' : 'En attente du livreur' },
  ...(type === 'LIVRAISON' ? [{ id: 'LIVRAISON', label: 'En route', desc: 'Le livreur arrive chez vous' }] : []),
  { id: 'TERMINEE', label: type === 'RETRAIT' ? 'Récupérée' : 'Livrée', desc: 'Bon appétit !' }
];

export default function TrackingScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, loyaltyStamps, toggleFavorite, favorites } = useStore();

  const orderId = location.state?.orderId || orders[0]?.id;
  const earnedStamps = location.state?.earnedStamps || 1;
  const order = orders.find(o => o.id === orderId);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [favSaved, setFavSaved] = useState(false);

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

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Suivi de ma commande Hoya Poké n°${order.id} (${order.type === 'RETRAIT' ? 'Retrait' : 'Livraison'} prévu à ${order.time}) : ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveFavorite = (line) => {
    toggleFavorite({
      name: line.cartName || line.name,
      price: line.price,
      size: line.size || 'M',
      composition: line.composition || [line.name]
    });
    setFavSaved(true);
    setTimeout(() => setFavSaved(false), 2000);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Fermer">
          <X size={20} />
        </button>
        <span className="topbar-title">Commande n° {order.id}</span>
        <button className="icon-btn" onClick={handleCopyLink} title="Copier le lien de suivi">
          <Share2 size={18} />
        </button>
      </div>

      <div className="scroll">
        <div className="col gap-5 section">
          {/* Estimated Time Badge */}
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

          {/* Loyalty Stamp Reward Celebration Card */}
          <motion.div 
            className="card"
            style={{
              background: 'linear-gradient(135deg, #1b3524 0%, #284c33 100%)',
              color: 'var(--cream)',
              padding: '14px 16px',
              borderRadius: 'var(--r)'
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="row between">
              <div className="row gap-2">
                <Gift size={20} style={{ color: 'var(--gold)' }} />
                <div>
                  <div className="row gap-2">
                    <strong style={{ fontSize: 13 }}>+{earnedStamps} tampon(s) crédité(s) !</strong>
                    <span className="tag tag-gold" style={{ fontSize: 10 }}>Poké Pass</span>
                  </div>
                  <span className="small" style={{ opacity: 0.8, fontSize: 12 }}>
                    Vous avez <strong>{loyaltyStamps}/10 tampons</strong>. Prochain bol offert à 10 !
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline Status */}
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

          {/* Live Delivery MiniMap */}
          {order.status === 'LIVRAISON' && (
            <motion.div className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <MiniMap progress={progress} height={170} />
              <div className="row between" style={{ padding: '12px 14px' }}>
                <div className="row gap-3">
                  <span className="avatar">{(order.driver || 'Alex')[0]}</span>
                  <div className="col">
                    <span style={{ fontWeight: 700 }}>{order.driver || 'Alex'}</span>
                    <span className="muted small">Votre livreur Hoya</span>
                  </div>
                </div>
                <button className="icon-btn" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} aria-label="Appeler le livreur">
                  <Phone size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Order Summary & Favorites */}
          <div className="card summary">
            <span className="eyebrow" style={{ fontSize: 11, marginBottom: 4 }}>Articles commandés</span>
            {order.items.map((line, i) => (
              <div key={i} className="col gap-1 small" style={{ padding: '4px 0', borderBottom: i < order.items.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div className="row between gap-3">
                  <span style={{ fontWeight: 600 }}>{line.cartName || line.name}</span>
                  <span className="tnum">{formatPrice(line.price)}</span>
                </div>
                {line.composition?.length > 1 && (
                  <span className="muted" style={{ fontSize: 11 }}>{line.composition.join(' · ')}</span>
                )}
                <div className="row" style={{ marginTop: 2 }}>
                  <button 
                    className="link-btn" 
                    style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleSaveFavorite(line)}
                  >
                    <Heart size={12} fill="#e05353" color="#e05353" />
                    <span>Sauvegarder en favori</span>
                  </button>
                </div>
              </div>
            ))}
            <div className="divider" />
            <div className="row between">
              <span style={{ fontWeight: 700 }}>Total réglé</span>
              <span className="price">{formatPrice(order.total)}</span>
            </div>
          </div>

          {favSaved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tag tag-gold" style={{ justifyContent: 'center', padding: '8px 12px' }}>
              ❤️ Article sauvegardé dans votre Poké Club !
            </motion.div>
          )}

          {/* Social Share & Quick Actions */}
          <div className="col gap-2">
            <button className="btn btn-ghost btn-block row gap-2" onClick={handleShareWhatsApp}>
              <Share2 size={16} />
              <span>Partager le suivi sur WhatsApp</span>
            </button>
            <a className="btn btn-ghost btn-block" href="tel:+33400000000">
              <Phone size={16} /> Appeler le restaurant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
