import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart, Trash2, Plus, ArrowRight } from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';
import HoyaMark from './brand/HoyaMark';

export default function LoyaltyModal({ isOpen, onClose }) {
  const { 
    loyaltyStamps, 
    addLoyaltyStamp, 
    claimLoyaltyReward, 
    favorites, 
    toggleFavorite, 
    addToCart 
  } = useStore();

  if (!isOpen) return null;

  const stampsNeeded = 10;
  const remaining = Math.max(0, stampsNeeded - loyaltyStamps);
  const isRewardReady = loyaltyStamps >= stampsNeeded;

  const handleAddFavoriteToCart = (fav) => {
    addToCart({
      cartName: fav.name,
      name: fav.name,
      price: fav.price,
      size: fav.size || 'M',
      composition: fav.composition || [fav.name]
    });
  };

  return (
    <AnimatePresence>
      <div className="loyalty-modal-overlay" onClick={onClose}>
        <motion.div 
          className="loyalty-modal-card" 
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="loyalty-header">
            <div className="row gap-2">
              <span className="loyalty-badge-icon">
                <HoyaMark size={20} />
              </span>
              <div>
                <h3 className="display" style={{ fontSize: 20, color: 'var(--cream)', margin: 0 }}>
                  Carte de fidélité
                </h3>
                <span className="small" style={{ color: 'rgba(250,245,240,0.7)' }}>
                  Hoya Poké Pézenas
                </span>
              </div>
            </div>
            <button className="icon-btn-light" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          <div className="loyalty-body scroll">
            {/* Loyalty Stamp Card */}
            <div className="stamp-card">
              <div className="row between" style={{ marginBottom: 12 }}>
                <div>
                  <span className="eyebrow" style={{ color: 'var(--gold)', fontSize: 11 }}>
                    Le 11ᵉ poké est offert
                  </span>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                    {isRewardReady 
                      ? 'Votre prochain poké est offert' 
                      : `Encore ${remaining} bol${remaining > 1 ? 's' : ''} pour votre bol offert`}
                  </div>
                </div>
                <div className="stamp-counter-badge">
                  {loyaltyStamps} / {stampsNeeded}
                </div>
              </div>

              {/* 10 Stamps Grid */}
              <div className="stamp-grid">
                {Array.from({ length: stampsNeeded }).map((_, i) => {
                  const stamped = i < loyaltyStamps;
                  return (
                    <div key={i} className={`stamp-slot ${stamped ? 'stamped' : ''}`}>
                      {stamped ? (
                        <motion.div
                          initial={{ scale: 1.8, opacity: 0, rotate: -30 }}
                          animate={{ scale: 1, opacity: 1, rotate: i % 2 ? 4 : -5 }}
                          transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 380, damping: 18 }}
                          className="stamp-icon"
                        >
                          <HoyaMark size={26} />
                        </motion.div>
                      ) : (
                        <span className="stamp-number">{i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="stamp-footer">
                <span className="small muted">
                  1 bol commandé = 1 tampon. Valable à emporter et en livraison.
                </span>
                {isRewardReady && (
                  <div className="reward-banner">
                    <Sparkles size={16} style={{ color: 'var(--gold)' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gold)' }}>
                      Bol offert disponible au paiement (-12,90 €)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mes Favoris Section */}
            <div className="favorites-section">
              <div className="row between" style={{ marginBottom: 10 }}>
                <div className="row gap-2">
                  <Heart size={18} style={{ color: '#e05353', fill: '#e05353' }} />
                  <strong style={{ fontSize: 15 }}>Mes Poké Favoris</strong>
                </div>
                <span className="small muted">{favorites.length} enregistré(s)</span>
              </div>

              {favorites.length === 0 ? (
                <div className="empty-fav-box">
                  <p className="small muted" style={{ margin: 0 }}>
                    Vous n'avez pas encore de bol favori. Cliquez sur le cœur lors de votre composition pour le retrouver ici et recommander en 1 clic !
                  </p>
                </div>
              ) : (
                <div className="fav-list">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="fav-item-row">
                      <div className="grow col gap-1">
                        <div className="row gap-2">
                          <strong style={{ fontSize: 14 }}>{fav.name}</strong>
                          <span className="tag tag-gold" style={{ fontSize: 10 }}>Taille {fav.size}</span>
                        </div>
                        <span className="small muted" style={{ fontSize: 12, lineHeight: 1.3 }}>
                          {fav.composition?.join(', ')}
                        </span>
                        <span className="price small" style={{ marginTop: 2 }}>{formatPrice(fav.price)}</span>
                      </div>
                      
                      <div className="row gap-2">
                        <button 
                          className="btn btn-sm btn-primary row gap-1"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleAddFavoriteToCart(fav)}
                          title="Ajouter au panier"
                        >
                          <Plus size={14} />
                          <span>Recommander</span>
                        </button>
                        <button 
                          className="icon-btn-sm"
                          style={{ color: 'var(--muted)' }}
                          onClick={() => toggleFavorite(fav)}
                          title="Retirer des favoris"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local perk reminder */}
            <div className="loyalty-perk-box">
              <div className="row gap-2">
                <Sparkles size={16} style={{ color: 'var(--green-700)' }} />
                <span className="small" style={{ fontWeight: 600, color: 'var(--green-900)' }}>
                  Avantage Pézenas & Alentours
                </span>
              </div>
              <p className="small muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                Votre carte de fidélité se conserve automatiquement sur votre téléphone sans création de mot de passe compliqué.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
