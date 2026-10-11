import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { MENU } from '../data';
import { formatPrice } from '../format';

export default function FormuleModal({ formule, isOpen, onClose }) {
  const { addToCart, menu: storeMenu } = useStore();
  const currentMenu = storeMenu || MENU;

  const [size, setSize] = useState('M');
  const [selectedPoke, setSelectedPoke] = useState(currentMenu.classiques?.[0]?.name || 'Le Saumon');
  const [selectedBoisson, setSelectedBoisson] = useState(currentMenu.boissons?.[0]?.name || 'Thé pétillant artisanal');
  const [selectedDessert, setSelectedDessert] = useState(currentMenu.desserts?.[0]?.name || 'Tiramisu spéculoos');
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen || !formule) return null;

  const hasDessert = formule.includes?.some(inc => inc.toLowerCase().includes('dessert'));
  const price = size === 'L' ? (formule.priceL || formule.priceM + 3.00) : formule.priceM;

  const handleConfirm = () => {
    const compo = [
      `${selectedPoke} (${size})`,
      selectedBoisson,
      ...(hasDessert ? [selectedDessert] : [])
    ];

    addToCart({
      cartName: `${formule.name} (${size})`,
      name: formule.name,
      size,
      price,
      isFormule: true,
      composition: compo
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <AnimatePresence>
      <div className="loyalty-modal-overlay" onClick={onClose}>
        <motion.div 
          className="formule-modal-card" 
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="formule-modal-header">
            <div>
              <span className="formule-badge">{formule.badge || 'Formule Midi'}</span>
              <h3 className="display" style={{ fontSize: 20, margin: '6px 0 2px', color: 'var(--cream)' }}>
                {formule.name}
              </h3>
              <span className="small" style={{ color: 'rgba(250,245,240,0.75)' }}>
                {formule.description}
              </span>
            </div>
            <button className="icon-btn-light" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          <div className="formule-modal-body scroll">
            {/* 1. Taille */}
            <div className="formule-step-group">
              <span className="formule-step-label">1. Choisissez la taille du bol</span>
              <div className="formule-size-pills">
                <button 
                  className={`size-btn ${size === 'M' ? 'active' : ''}`}
                  onClick={() => setSize('M')}
                >
                  <strong>Taille M</strong>
                  <span className="small muted">Idéal pour le midi · {formatPrice(formule.priceM)}</span>
                </button>
                <button 
                  className={`size-btn ${size === 'L' ? 'active' : ''}`}
                  onClick={() => setSize('L')}
                >
                  <strong>Taille L</strong>
                  <span className="small muted">Grosse faim (+3 €) · {formatPrice(formule.priceL)}</span>
                </button>
              </div>
            </div>

            {/* 2. Choix du Poké */}
            <div className="formule-step-group">
              <span className="formule-step-label">2. Votre Poké Bowl</span>
              <div className="formule-item-grid">
                {(currentMenu.classiques || []).map((c) => (
                  <button 
                    key={c.id}
                    className={`formule-choice-pill ${selectedPoke === c.name ? 'active' : ''}`}
                    onClick={() => setSelectedPoke(c.name)}
                  >
                    <div className="row gap-2">
                      <span className="choice-check">
                        {selectedPoke === c.name && <Check size={12} strokeWidth={3} />}
                      </span>
                      <strong>{c.name}</strong>
                    </div>
                    <span className="small muted" style={{ fontSize: 11, textAlign: 'left' }}>
                      {c.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Choix de la Boisson */}
            <div className="formule-step-group">
              <span className="formule-step-label">3. Votre boisson fraîche</span>
              <div className="formule-item-grid">
                {(currentMenu.boissons || []).map((b) => (
                  <button 
                    key={b.id}
                    className={`formule-choice-pill ${selectedBoisson === b.name ? 'active' : ''}`}
                    onClick={() => setSelectedBoisson(b.name)}
                  >
                    <div className="row gap-2">
                      <span className="choice-check">
                        {selectedBoisson === b.name && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span>{b.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Choix du Dessert (si inclus) */}
            {hasDessert && (
              <div className="formule-step-group">
                <span className="formule-step-label">4. Votre dessert artisanal</span>
                <div className="formule-item-grid">
                  {(currentMenu.desserts || []).map((d) => (
                    <button 
                      key={d.id}
                      className={`formule-choice-pill ${selectedDessert === d.name ? 'active' : ''}`}
                      onClick={() => setSelectedDessert(d.name)}
                    >
                      <div className="row gap-2">
                        <span className="choice-check">
                          {selectedDessert === d.name && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span>{d.name}</span>
                        {d.bestseller && <span className="tag tag-gold" style={{ fontSize: 9 }}>Top</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Price and Confirmation */}
          <div className="formule-modal-footer">
            <div className="col">
              <span className="eyebrow" style={{ fontSize: 11 }}>Prix formule</span>
              <span className="price" style={{ fontSize: 22 }}>{formatPrice(price)}</span>
            </div>

            <button 
              className={`btn btn-primary row gap-2 ${addedSuccess ? 'btn-success' : ''}`}
              onClick={handleConfirm}
              disabled={addedSuccess}
              style={{ minWidth: 200 }}
            >
              {addedSuccess ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Ajouté au panier !</span>
                </>
              ) : (
                <>
                  <span>Ajouter au panier</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
