import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, CreditCard, Banknote, Check, Sparkles, Gift, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { DELIVERY_ZONES, PROMO_CODES } from '../../data';
import { formatPrice } from '../../format';
import { list, item } from '../../motion';
import { playSuccessSound } from '../../sound';

const DEMO_ADDRESSES = [
  { label: 'Pézenas', value: '7 rue Anatole France, Pézenas' },
  { label: 'Tourbes', value: 'Mairie, Tourbes' },
  { label: 'Béziers', value: 'Centre, Béziers' }
];

const SLOTS = [
  { value: 'ASAP', label: 'Au plus tôt', sub: '~30 min' },
  { value: '19:00', label: '19:00' },
  { value: '19:15', label: '19:15' },
  { value: '19:30', label: '19:30' }
];

const fade = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.25 }
};

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const { 
    cart, 
    orderType, 
    addOrder, 
    clearCart,
    loyaltyStamps,
    addLoyaltyStamp,
    claimLoyaltyReward,
    activePromo,
    applyPromo,
    removePromo
  } = useStore();
  const isDelivery = orderType === 'LIVRAISON';

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const [deliveryZone, setDeliveryZone] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' | 'ON_SITE'
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', instructions: '', time: 'ASAP' });
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState(null);
  const [useLoyaltyReward, setUseLoyaltyReward] = useState(false);

  const update = (key) => (e) => setFormData(f => ({ ...f, [key]: e.target.value }));

  const checkAddress = (address) => {
    const l = address.toLowerCase();
    if (l.includes('pézenas') || l.includes('pezenas')) {
      setDeliveryZone(DELIVERY_ZONES[0]);
      setAddressError('');
    } else if (['tourbes', 'caux', 'nezignan', 'nézignan', 'castelnau'].some(c => l.includes(c))) {
      setDeliveryZone(DELIVERY_ZONES[1]);
      setAddressError('');
    } else if (address.length > 5) {
      setDeliveryZone(null);
      setAddressError('Cette adresse est en dehors de notre zone de livraison.');
    } else {
      setDeliveryZone(null);
      setAddressError('');
    }
  };

  const setAddress = (value) => {
    setFormData(f => ({ ...f, address: value }));
    checkAddress(value);
  };

  // Promo calculation
  let promoDiscount = 0;
  if (activePromo) {
    if (activePromo.type === 'percent') {
      promoDiscount = (cartTotal * activePromo.value) / 100;
    } else if (activePromo.type === 'fixed') {
      promoDiscount = Math.min(cartTotal, activePromo.value);
    }
  }

  // Loyalty reward calculation (1 free bowl up to 12.90€)
  const isLoyaltyReady = loyaltyStamps >= 10;
  const loyaltyDiscount = useLoyaltyReward && isLoyaltyReady ? Math.min(12.90, cartTotal - promoDiscount) : 0;

  // Delivery fee calculation (waived if LIVRAISONFREE promo)
  const isFreeDelivery = activePromo?.type === 'free_delivery';
  const deliveryFee = isDelivery && deliveryZone ? (isFreeDelivery ? 0 : deliveryZone.fee) : 0;
  
  const total = Math.max(0, cartTotal - promoDiscount - loyaltyDiscount) + deliveryFee;
  const belowMin = isDelivery && deliveryZone && cartTotal < deliveryZone.min;
  const canPay = cart.length > 0 && (!isDelivery || (deliveryZone && !belowMin));

  const handleApplyPromo = (codeToApply) => {
    const code = codeToApply || promoCodeInput;
    const res = applyPromo(code);
    setPromoFeedback(res);
    if (res.success) setPromoCodeInput('');
  };

  const handleSubmit = () => {
    if (!canPay || submitting) return;
    setSubmitting(true);

    const newOrder = {
      id: (Math.floor(Math.random() * 9000) + 1000).toString(),
      status: 'NOUVELLE',
      type: orderType,
      time: formData.time === 'ASAP'
        ? new Date(Date.now() + 30 * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : formData.time,
      customerName: formData.name || 'Client web',
      customerPhone: formData.phone || '06 00 00 00 00',
      address: isDelivery ? formData.address : 'Retrait sur place',
      zone: deliveryZone ? deliveryZone.id : null,
      deliveryFee,
      total,
      promoCode: activePromo?.code || null,
      discount: promoDiscount + loyaltyDiscount,
      paymentStatus: paymentMethod === 'ONLINE' ? 'PAYÉ' : 'A_ENCAISSER',
      paymentMethod: paymentMethod === 'ONLINE' ? 'EN LIGNE (CB)' : (isDelivery ? 'SUR PLACE (LIVREUR)' : 'SUR PLACE (COMPTOIR)'),
      items: cart
    };

    // Credit loyalty stamps
    const bowlsOrdered = cart.filter(i => i.composition?.length > 0 || i.isFormule).length || 1;
    if (useLoyaltyReward) {
      claimLoyaltyReward();
    } else {
      addLoyaltyStamp(bowlsOrdered);
    }

    // Short delay so the payment step reads as a real action
    setTimeout(() => {
      playSuccessSound();
      addOrder(newOrder);
      clearCart();
      removePromo();
      navigate('/tracking', { state: { orderId: newOrder.id, earnedStamps: useLoyaltyReward ? 0 : bowlsOrdered } });
    }, 700);
  };

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <span className="topbar-title">Finaliser</span>
        <span />
      </div>

      <div className="scroll">
        <motion.div className="checkout-grid section" variants={list} initial="initial" animate="animate">
          <div className="checkout-main">
            <motion.section variants={item} className="col gap-3">
              <h3 className="eyebrow">{isDelivery ? 'Adresse de livraison' : 'Retrait'}</h3>
              {isDelivery ? (
                <>
                  <input
                    placeholder="10 rue de la Foire, Pézenas"
                    value={formData.address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                    <span className="muted small">Essayer :</span>
                    {DEMO_ADDRESSES.map(a => (
                      <button key={a.label} className="chip" onClick={() => setAddress(a.value)}>{a.label}</button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {addressError && (
                      <motion.p key="err" className="notice danger" {...fade}>{addressError}</motion.p>
                    )}
                    {deliveryZone && (
                      <motion.p key={`zone-${deliveryZone.id}-${belowMin}`} className={`notice ${belowMin ? 'danger' : 'ok'}`} {...fade}>
                        {belowMin
                          ? `Minimum de ${formatPrice(deliveryZone.min)} pour ${deliveryZone.name}. Il manque ${formatPrice(deliveryZone.min - cartTotal)}.`
                          : `Livré à ${deliveryZone.name} · frais ${formatPrice(deliveryZone.fee)}`}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="card" style={{ padding: 14 }}>
                  <p style={{ fontWeight: 700 }}>Hoya Poké</p>
                  <p className="muted small">7 rue Anatole France, 34120 Pézenas</p>
                </div>
              )}
            </motion.section>

            <motion.section variants={item} className="col gap-3">
              <h3 className="eyebrow">{isDelivery ? 'Heure de livraison' : 'Heure de retrait'}</h3>
              <div className="slot-grid">
                {SLOTS.map(s => (
                  <motion.button
                    key={s.value}
                    whileTap={{ scale: 0.96 }}
                    className={`slot ${formData.time === s.value ? 'active' : ''}`}
                    onClick={() => setFormData(f => ({ ...f, time: s.value }))}
                  >
                    <span>{s.label}</span>
                    {s.sub && <span style={{ opacity: 0.7 }}>{s.sub}</span>}
                  </motion.button>
                ))}
              </div>
            </motion.section>

            <motion.section variants={item} className="col gap-3">
              <h3 className="eyebrow">Coordonnées</h3>
              <input placeholder="Nom" value={formData.name} onChange={update('name')} autoComplete="name" />
              <input type="tel" placeholder="Téléphone" value={formData.phone} onChange={update('phone')} autoComplete="tel" />
              {isDelivery && (
                <textarea placeholder="Digicode, étage, indications" value={formData.instructions} onChange={update('instructions')} rows={2} />
              )}
            </motion.section>

            <motion.section variants={item} className="col gap-3">
              <h3 className="eyebrow">Mode de règlement</h3>
              <div className="col gap-2">
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: paymentMethod === 'ONLINE' ? '2px solid var(--green-700)' : '1px solid var(--line)',
                    background: paymentMethod === 'ONLINE' ? 'var(--cream-2)' : 'var(--paper)',
                    borderRadius: 'var(--r)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setPaymentMethod('ONLINE')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-100)', color: 'var(--green-700)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <CreditCard size={18} />
                  </div>
                  <div className="col" style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>Payer en ligne</strong>
                    <span className="muted small">Carte bancaire, Apple Pay ou Google Pay sécurisé</span>
                  </div>
                  <span className={`switch ${paymentMethod === 'ONLINE' ? 'on' : ''}`} style={{ flexShrink: 0 }}>
                    <motion.span layout className="switch-knob" />
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: paymentMethod === 'ON_SITE' ? '2px solid var(--green-700)' : '1px solid var(--line)',
                    background: paymentMethod === 'ON_SITE' ? 'var(--cream-2)' : 'var(--paper)',
                    borderRadius: 'var(--r)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => setPaymentMethod('ON_SITE')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-soft)', color: 'var(--gold-ink)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Banknote size={18} />
                  </div>
                  <div className="col" style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14 }}>Payer sur place</strong>
                    <span className="muted small">
                      {isDelivery 
                        ? 'CB ou Espèces auprès du livreur lors de la livraison' 
                        : 'CB, Espèces ou Titres-resto au retrait en boutique'}
                    </span>
                  </div>
                  <span className={`switch ${paymentMethod === 'ON_SITE' ? 'on' : ''}`} style={{ flexShrink: 0 }}>
                    <motion.span layout className="switch-knob" />
                  </span>
                </button>
              </div>
            </motion.section>
          </div>

          <motion.section variants={item} className="col gap-3 checkout-aside">
            <h3 className="eyebrow">Récapitulatif & Avantages</h3>

            {/* Loyalty Free Bowl Option if 10 stamps */}
            {isLoyaltyReady && (
              <div 
                className="card"
                style={{
                  background: useLoyaltyReward ? 'rgba(200, 140, 50, 0.15)' : 'var(--paper)',
                  border: '1.5px solid var(--gold)',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
                onClick={() => setUseLoyaltyReward(!useLoyaltyReward)}
              >
                <div className="row between">
                  <div className="row gap-2">
                    <Gift size={18} style={{ color: 'var(--gold)' }} />
                    <div className="col">
                      <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Bol offert fidélité débloqué !</strong>
                      <span className="small muted">Économisez 12,90 € sur votre commande</span>
                    </div>
                  </div>
                  <span className={`switch ${useLoyaltyReward ? 'on' : ''}`}>
                    <motion.span layout className="switch-knob" />
                  </span>
                </div>
              </div>
            )}

            {/* Promo Code Box */}
            <div className="promo-box">
              <div className="row between">
                <div className="row gap-2">
                  <Tag size={15} style={{ color: 'var(--green-700)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Code promo</span>
                </div>
                {activePromo && (
                  <button 
                    className="link-btn danger" 
                    style={{ fontSize: 11 }} 
                    onClick={() => { removePromo(); setPromoFeedback(null); }}
                  >
                    Retirer
                  </button>
                )}
              </div>

              {activePromo ? (
                <div className="row between" style={{ background: 'rgba(58, 122, 64, 0.1)', padding: '8px 10px', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#2d6232' }}>
                    ✓ Code {activePromo.code} appliqué ({activePromo.label})
                  </span>
                  <span className="tag tag-gold" style={{ fontSize: 10 }}>Valide</span>
                </div>
              ) : (
                <>
                  <div className="promo-input-row">
                    <input 
                      type="text" 
                      placeholder="Ex: BIENVENUE10" 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase', fontSize: 13 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-sm btn-primary" 
                      onClick={() => handleApplyPromo()}
                      disabled={!promoCodeInput.trim()}
                    >
                      Appliquer
                    </button>
                  </div>

                  <div className="promo-tags-row">
                    <span className="small muted" style={{ fontSize: 11 }}>Codes du moment :</span>
                    {['BIENVENUE10', 'HOYA5', 'LIVRAISONFREE'].map(c => (
                      <button 
                        key={c} 
                        type="button" 
                        className="promo-chip" 
                        onClick={() => handleApplyPromo(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {promoFeedback && (
                    <span className={`small ${promoFeedback.success ? 'discount-line' : 'text-danger'}`} style={{ fontSize: 11 }}>
                      {promoFeedback.message}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="card summary">
              <span className="eyebrow" style={{ fontSize: 11, marginBottom: 4 }}>Détail de la commande</span>
              {cart.map(line => (
                <div key={line.id} className="row between gap-3 small">
                  <span>{line.cartName}</span>
                  <span className="tnum">{formatPrice(line.price)}</span>
                </div>
              ))}

              {promoDiscount > 0 && (
                <div className="row between small discount-line">
                  <span>Remise promo ({activePromo?.code})</span>
                  <span className="tnum">- {formatPrice(promoDiscount)}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="row between small discount-line">
                  <span>Poké offert, carte de fidélité complète</span>
                  <span className="tnum">- {formatPrice(loyaltyDiscount)}</span>
                </div>
              )}

              <AnimatePresence initial={false}>
              {isDelivery && deliveryZone && (
                <motion.div {...fade} className="row between small muted">
                  <span>Livraison {isFreeDelivery ? '(Offerte !)' : ''}</span>
                  <span className="tnum">{isFreeDelivery ? '0,00 €' : formatPrice(deliveryFee)}</span>
                </motion.div>
              )}
              </AnimatePresence>
              <div className="divider" />
              <div className="row between">
                <span style={{ fontWeight: 700 }}>Total</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={total.toFixed(2)}
                    className="price"
                    style={{ fontSize: 20 }}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {formatPrice(total)}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
            {!isDelivery && <p className="muted small">Titres-restaurant acceptés au comptoir.</p>}
          </motion.section>
        </motion.div>
      </div>

      <div className="bottom-bar end">
        <motion.button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={!canPay} whileTap={{ scale: 0.98 }}>
          {submitting ? (
            <motion.span className="spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
          ) : paymentMethod === 'ONLINE' ? (
            <><Lock size={16} /> Payer en ligne · {formatPrice(total)}</>
          ) : (
            <><Check size={16} /> Confirmer la commande · {formatPrice(total)} ({isDelivery ? 'Paiement au livreur' : 'Au comptoir'})</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
