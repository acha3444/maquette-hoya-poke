import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Phone, Check, Share2, Copy, Sparkles, Gift, Heart } from 'lucide-react';
import HoyaMark from '../../components/brand/HoyaMark';
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
  const { orders, loyaltyStamps, toggleFavorite, favorites, currentUser, featuresConfig } = useStore();

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

          {/* Loyalty stamp earned */}
          <motion.div
            className="track-stamp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="track-stamp-mark"
              initial={{ scale: 1.8, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: -6 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 380, damping: 18 }}
            >
              <HoyaMark size={26} />
            </motion.span>
            <div className="col">
              <strong>+{earnedStamps} tampon{earnedStamps > 1 ? 's' : ''} sur votre carte</strong>
              <span className="small">{loyaltyStamps}/10 · le 11ᵉ poké est offert</span>
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

          {/* Post-order Account Creation Prompt for Guest Customers */}
          {!currentUser && featuresConfig?.accounts && (
            <motion.div 
              className="card" 
              style={{ background: 'linear-gradient(135deg, var(--green-900) 0%, #1e3325 100%)', color: 'var(--cream)', padding: 18 }}
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="row gap-2" style={{ marginBottom: 6 }}>
                <Sparkles size={18} style={{ color: 'var(--curry)' }} />
                <strong style={{ fontSize: 14, color: 'var(--cream)' }}>Gardez votre tampon de fidélité !</strong>
              </div>
              <p style={{ fontSize: 12, opacity: 0.85, margin: '0 0 12px 0', lineHeight: 1.4 }}>
                Créez votre compte en un clic pour sauvegarder vos points de fidélité (10 tampons = 11ᵉ bol offert) et suivre toutes vos commandes.
              </p>
              <button 
                className="btn btn-sm" 
                onClick={() => navigate('/compte')}
                style={{ background: 'var(--curry)', color: 'var(--ink)', fontWeight: 800, border: 'none', width: '100%' }}
              >
                Créer mon compte en 1 clic
              </button>
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
              Ajouté à vos favoris
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
