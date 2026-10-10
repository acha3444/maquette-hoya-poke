import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Check, TriangleAlert, Navigation } from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';
import { ease } from '../motion';
import MiniMap from '../components/MiniMap';

const TRIP_SECONDS = 45;

export default function DeliveryView() {
  const { orders, deliveryActiveOrderId } = useStore();
  const order = orders.find(o => o.id === deliveryActiveOrderId);

  if (!order) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, textAlign: 'center' }}>
        <Navigation size={28} className="muted" />
        <h2 style={{ fontSize: 18 }}>Aucune course</h2>
        <p className="muted small">Les courses confiées par la cuisine apparaissent ici.</p>
      </div>
    );
  }

  // Remount the trip when the order is reset back to "en livraison"
  return <Trip key={`${order.id}-${order.status === 'TERMINEE'}`} order={order} />;
}

function Trip({ order }) {
  const updateOrderStatus = useStore(s => s.updateOrderStatus);
  const [progress, setProgress] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (!isStarted || progress >= 1) return;
    const timer = setTimeout(() => setProgress(p => Math.min(1, p + 1 / TRIP_SECONDS)), 1000);
    return () => clearTimeout(timer);
  }, [isStarted, progress]);

  const delivered = order.status === 'TERMINEE';
  const arrived = progress >= 1;
  const remaining = Math.ceil((1 - progress) * TRIP_SECONDS);

  return (
    <div className="screen">
      <div className="topbar" style={{ gridTemplateColumns: '1fr auto' }}>
        <div className="row gap-2" style={{ paddingLeft: 6 }}>
          <span className="live-dot" />
          <span style={{ fontWeight: 700 }}>Alex</span>
          <span className="muted small">· en ligne</span>
        </div>
        <span className="tag">Course n° {order.id}</span>
      </div>

      <div className="scroll">
        <MiniMap progress={delivered ? 1 : progress} started={isStarted || delivered} height={260} />

        <motion.div
          className="card col gap-4"
          style={{ margin: '-24px 16px 24px', padding: 18, position: 'relative', boxShadow: 'var(--shadow)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div className="col">
              <span className="eyebrow">Client</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{order.customerName}</span>
              <span className="muted small">{order.items.length} article{order.items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="col" style={{ alignItems: 'flex-end' }}>
              <span className="eyebrow">Distance</span>
              <span className="tnum" style={{ fontSize: 20, fontWeight: 800 }}>1,2 km</span>
            </div>
          </div>

          <div className="divider" />

          <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
            <MapPin size={18} className="muted" style={{ marginTop: 2, flexShrink: 0 }} />
            <div className="col gap-1">
              <span style={{ fontWeight: 700 }}>{order.address}</span>
              <span className="muted small">Digicode 1234 · 2e étage</span>
            </div>
          </div>

          <div className="row between" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: order.paymentStatus === 'PAYÉ' ? 'var(--ok-soft)' : 'var(--gold-soft)' }}>
            <span className="small" style={{ fontWeight: 600 }}>Paiement</span>
            <span className="small" style={{ fontWeight: 800, color: order.paymentStatus === 'PAYÉ' ? 'var(--ok)' : 'var(--gold-ink)' }}>
              {order.paymentStatus === 'PAYÉ' ? 'Déjà payé' : `${formatPrice(order.total)} à encaisser`}
            </span>
          </div>

          <div className="row gap-2">
            <a className="btn btn-ghost btn-md grow" href={`tel:${order.customerPhone.replace(/\s/g, '')}`}>
              <Phone size={16} /> Appeler
            </a>
            <button className="btn btn-ghost btn-md grow" style={{ color: 'var(--danger)' }}>
              <TriangleAlert size={16} /> Signaler
            </button>
          </div>
        </motion.div>
      </div>

      <div className="bottom-bar">
        <AnimatePresence mode="wait" initial={false}>
          {delivered ? (
            <motion.div key="done" className="row gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <motion.span
                className="check on"
                style={{ width: 36, height: 36, background: 'var(--ok)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              >
                <Check size={18} strokeWidth={3} />
              </motion.span>
              <div className="col">
                <span style={{ fontWeight: 800 }}>Course terminée</span>
                <span className="muted small">En attente de la prochaine commande</span>
              </div>
            </motion.div>
          ) : !isStarted ? (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="btn btn-primary btn-block" onClick={() => setIsStarted(true)}>
                <Navigation size={16} /> Démarrer l'itinéraire
              </button>
            </motion.div>
          ) : !arrived ? (
            <motion.div key="route" className="col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="row between small">
                <span style={{ fontWeight: 700 }}>En route</span>
                <span className="muted tnum">Arrivée dans {remaining} s</span>
              </div>
              <div className="progress-track" style={{ height: 4, borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  className="progress-fill"
                  animate={{ scaleX: progress }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <button className="btn btn-ghost btn-md btn-block" onClick={() => setProgress(1)}>Passer le trajet</button>
            </motion.div>
          ) : (
            <motion.div key="arrived" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button className="btn btn-ok btn-block" onClick={() => updateOrderStatus(order.id, 'TERMINEE')}>
                <Check size={18} strokeWidth={2.5} /> Confirmer la livraison
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
