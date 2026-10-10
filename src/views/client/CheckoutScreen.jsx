import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { DELIVERY_ZONES } from '../../data';
import { formatPrice } from '../../format';
import { list, item } from '../../motion';

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
  const { cart, orderType, addOrder, clearCart } = useStore();
  const isDelivery = orderType === 'LIVRAISON';

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const [deliveryZone, setDeliveryZone] = useState(null);
  const [addressError, setAddressError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', instructions: '', time: 'ASAP' });

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

  const deliveryFee = isDelivery && deliveryZone ? deliveryZone.fee : 0;
  const total = cartTotal + deliveryFee;
  const belowMin = isDelivery && deliveryZone && cartTotal < deliveryZone.min;
  const canPay = cart.length > 0 && (!isDelivery || (deliveryZone && !belowMin));

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
      paymentStatus: 'PAYÉ',
      items: cart
    };

    // Short delay so the payment step reads as a real action
    setTimeout(() => {
      addOrder(newOrder);
      clearCart();
      navigate('/tracking', { state: { orderId: newOrder.id } });
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
        <motion.div className="col gap-6 section" variants={list} initial="initial" animate="animate">
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
                <button
                  key={s.value}
                  className={`slot ${formData.time === s.value ? 'active' : ''}`}
                  onClick={() => setFormData(f => ({ ...f, time: s.value }))}
                >
                  <span>{s.label}</span>
                  {s.sub && <span style={{ opacity: 0.7 }}>{s.sub}</span>}
                </button>
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

          <motion.section variants={item} className="col gap-2">
            <h3 className="eyebrow">Récapitulatif</h3>
            <div className="card summary">
              {cart.map(line => (
                <div key={line.id} className="row between gap-3 small">
                  <span>{line.cartName}</span>
                  <span className="tnum">{formatPrice(line.price)}</span>
                </div>
              ))}
              {isDelivery && deliveryZone && (
                <div className="row between small muted">
                  <span>Livraison</span>
                  <span className="tnum">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="divider" />
              <div className="row between">
                <span style={{ fontWeight: 700 }}>Total</span>
                <span className="price" style={{ fontSize: 18 }}>{formatPrice(total)}</span>
              </div>
            </div>
            {!isDelivery && <p className="muted small">Titres-restaurant acceptés au comptoir.</p>}
          </motion.section>
        </motion.div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={!canPay}>
          {submitting ? (
            <motion.span className="spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
          ) : (
            <><Lock size={16} /> Payer {formatPrice(total)}</>
          )}
        </button>
      </div>
    </div>
  );
}
