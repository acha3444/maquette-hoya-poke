import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffBrand from '../components/brand/StaffBrand';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Check, TriangleAlert, Navigation, Bike, ChefHat, ShoppingBag, LockKeyhole, Smartphone } from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';
import { ease } from '../motion';
import MiniMap from '../components/MiniMap';
import { lockStaffApp } from '../components/StaffGuard';
import InstallPwaModal from '../components/InstallPwaModal';

const TRIP_SECONDS = 45;

export default function DeliveryView() {
  const { orders } = useStore();
  const [selectedId, setSelectedId] = useState(null);

  // All orders meant for delivery
  const deliveryOrders = orders.filter(o => o.type === 'LIVRAISON');
  const activeOrders = deliveryOrders.filter(o => ['LIVRAISON', 'PRETE'].includes(o.status));

  // Find the current order to show:
  const order = (selectedId && deliveryOrders.find(o => o.id === selectedId))
    || activeOrders[0]
    || deliveryOrders[0];

  if (!order) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
          <Bike size={28} className="muted" />
        </div>
        <h2 style={{ fontSize: 18 }}>Aucune course pour l'instant</h2>
        <p className="muted small">Dès que la cuisine confie une commande en livraison, elle apparaîtra directement ici.</p>
      </div>
    );
  }

  return (
    <Trip
      key={`${order.id}-${order.status}`}
      order={order}
      deliveryOrders={deliveryOrders}
      onSelectOrder={(id) => setSelectedId(id)}
    />
  );
}

function Trip({ order, deliveryOrders, onSelectOrder }) {
  const updateOrderStatus = useStore(s => s.updateOrderStatus);
  const [progress, setProgress] = useState(0);
  const [isStarted, setIsStarted] = useState(order.status === 'LIVRAISON');
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (!isStarted || progress >= 1) return;
    const timer = setTimeout(() => setProgress(p => Math.min(1, p + 1 / TRIP_SECONDS)), 1000);
    return () => clearTimeout(timer);
  }, [isStarted, progress]);

  const delivered = order.status === 'TERMINEE';
  const arrived = progress >= 1;
  const remaining = Math.ceil((1 - progress) * TRIP_SECONDS);

  const handleStart = () => {
    setIsStarted(true);
    if (order.status !== 'LIVRAISON') {
      updateOrderStatus(order.id, 'LIVRAISON');
    }
  };

  const handleFinish = () => {
    updateOrderStatus(order.id, 'TERMINEE');
  };

  const navigate = useNavigate();

  return (
    <div className="screen">
      <div className="topbar" style={{ gridTemplateColumns: '1fr auto' }}>
        <StaffBrand label="Livreur" sub="Alex · en service" compact />
        <div className="row gap-2 staff-actions">
          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => setShowInstallModal(true)}
            title="Installer l'App Livreur sur l'écran d'accueil"
          >
            <Smartphone size={12} style={{ color: 'var(--green-700)' }} />
            <span className="staff-action-label">App Livreur</span>
          </button>
          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/cuisine')}
            title="Aller à la cuisine"
          >
            <ChefHat size={12} />
            <span className="staff-action-label">Cuisine</span>
          </button>
          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/')}
            title="Aller au site client"
          >
            <ShoppingBag size={12} />
            <span className="staff-action-label">Client</span>
          </button>
          <button 
            className="btn btn-sm btn-ghost row gap-1" 
            style={{ color: 'var(--danger)' }}
            onClick={lockStaffApp}
            title="Verrouiller l'espace livreur (Code PIN 1234)"
          >
            <LockKeyhole size={12} />
            <span className="staff-action-label">Verrouiller</span>
          </button>
          <span className="tag staff-action-label">Course n° {order.id}</span>
        </div>
      </div>

      {deliveryOrders.length > 1 && (
        <div className="tabs" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '0 12px' }}>
          {deliveryOrders.map(d => {
            const isCurrent = d.id === order.id;
            return (
              <button
                key={d.id}
                className={isCurrent ? 'active' : ''}
                style={{ padding: '8px 10px', fontSize: 13 }}
                onClick={() => onSelectOrder(d.id)}
              >
                <span>#{d.id}</span>
                <span className={`tag ${d.status === 'LIVRAISON' ? 'tag-green' : d.status === 'TERMINEE' ? '' : 'tag-gold'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                  {d.status === 'LIVRAISON' ? 'En cours' : d.status === 'TERMINEE' ? 'Livré' : 'Prête'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="scroll">
        <MiniMap progress={delivered ? 1 : progress} started={isStarted || delivered} height={220} />

        <motion.div
          className="card col gap-4"
          style={{ margin: '-20px 16px 24px', padding: 18, position: 'relative', boxShadow: 'var(--shadow)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div className="col">
              <span className="eyebrow">Client</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{order.customerName}</span>
              <span className="muted small">{order.items?.length || 1} article{order.items?.length > 1 ? 's' : ''}</span>
            </div>
            <div className="col" style={{ alignItems: 'flex-end' }}>
              <span className="eyebrow">Destination</span>
              <span className="tnum" style={{ fontSize: 16, fontWeight: 800, color: 'var(--green-700)' }}>
                {order.address.split(',')[1] || 'Pézenas'}
              </span>
            </div>
          </div>

          <div className="divider" />

          <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
            <MapPin size={18} className="muted" style={{ marginTop: 2, flexShrink: 0 }} />
            <div className="col gap-1">
              <span style={{ fontWeight: 700, fontSize: 15 }}>{order.address}</span>
              <span className="muted small">Indications : {order.instructions || 'Sonner à l’interphone'}</span>
            </div>
          </div>

          <div className="row between" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: order.paymentStatus === 'PAYÉ' ? 'var(--ok-soft)' : 'var(--gold-soft)' }}>
            <span className="small" style={{ fontWeight: 600 }}>Règlement</span>
            <span className="small" style={{ fontWeight: 800, color: order.paymentStatus === 'PAYÉ' ? 'var(--ok)' : 'var(--gold-ink)' }}>
              {order.paymentStatus === 'PAYÉ' ? '✓ Payé en ligne' : `${formatPrice(order.total)} à encaisser`}
            </span>
          </div>

          <div className="row gap-2">
            <a
              className="btn btn-primary btn-md grow"
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ justifyContent: 'center' }}
            >
              <Navigation size={16} /> Itinéraire
            </a>
            <a
              className="btn btn-ghost btn-md grow"
              href={`tel:${(order.customerPhone || '').replace(/\s/g, '')}`}
              style={{ justifyContent: 'center' }}
            >
              <Phone size={16} /> Appeler
            </a>
          </div>

          <details style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, color: 'var(--ink)' }}>Détail des articles du sac</summary>
            <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: 'disc' }}>
              {order.items?.map((it, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{it.cartName || it.name}</span>
                </li>
              ))}
            </ul>
          </details>
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
                <span style={{ fontWeight: 800 }}>Commande livrée !</span>
                <span className="muted small">Le client a été notifié. En attente de la prochaine course.</span>
              </div>
            </motion.div>
          ) : !isStarted ? (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="btn btn-primary btn-block" onClick={handleStart}>
                <Navigation size={16} /> Démarrer la livraison
              </button>
            </motion.div>
          ) : !arrived ? (
            <motion.div key="route" className="col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="row between small">
                <span style={{ fontWeight: 700 }}>En route vers {order.customerName}</span>
                <span className="muted tnum">Arrivée estimée : {remaining} s</span>
              </div>
              <div className="progress-track" style={{ height: 5, borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  className="progress-fill"
                  animate={{ scaleX: progress }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <button className="btn btn-ghost btn-sm btn-block" onClick={() => setProgress(1)}>Arrivé sur place (Simuler)</button>
            </motion.div>
          ) : (
            <motion.div key="arrived" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button className="btn btn-ok btn-block" onClick={handleFinish}>
                <Check size={18} strokeWidth={2.5} /> Confirmer la remise au client
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showInstallModal && (
          <InstallPwaModal onClose={() => setShowInstallModal(false)} type="livreur" />
        )}
      </AnimatePresence>
    </div>
  );
}
