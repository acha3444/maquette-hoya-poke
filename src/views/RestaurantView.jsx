import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Clock, Phone, Bike, MapPin, SlidersHorizontal, X, ShoppingBag, Volume2, VolumeX, ArrowLeft, Eye, EyeOff, Lock, Delete, Printer, LockKeyhole, FileText, Sparkles, KeyRound, Smartphone } from 'lucide-react';
import { useStore } from '../store';
import { MENU } from '../data';
import { formatPrice } from '../format';
import { ease } from '../motion';
import { playNewOrderSound, playSuccessSound, isSoundEnabled, setSoundEnabled, unlockAudio, getAudioStatus } from '../sound';
import TicketPrintModal from '../components/TicketPrintModal';
import CaisseClotureModal from '../components/CaisseClotureModal';
import ChangePinModal from '../components/ChangePinModal';
import InstallPwaModal from '../components/InstallPwaModal';
import { lockStaffApp, isStaffPinValid, getStaffPin } from '../components/StaffGuard';
import StaffBrand from '../components/brand/StaffBrand';
import './restaurant.css';

const STATUS_COLUMNS = [
  { id: 'NOUVELLE', title: 'Nouvelles' },
  { id: 'PREPARATION', title: 'En préparation' },
  { id: 'PRETE', title: 'Prêtes' },
  { id: 'LIVRAISON', title: 'En livraison' },
  { id: 'TERMINEE', title: 'Terminées' }
];

const STOCK_ITEMS = [
  ...MENU.proteines,
  MENU.fruitsLegumes.find(i => i.name === 'Avocat'),
  MENU.fruitsLegumes.find(i => i.name === 'Mangue'),
  ...MENU.desserts.slice(0, 4)
];

const spring = { type: 'spring', stiffness: 420, damping: 38 };

function useContainerWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function OrderCard({ order, onPrint, autoPrintOnAccept = true }) {
  const updateOrderStatus = useStore(s => s.updateOrderStatus);
  const isNew = order.status === 'NOUVELLE';
  const done = order.status === 'TERMINEE';

  const action = (label, status, variant = 'btn-primary', icon = null, printTicket = false) => (
    <button className={`btn btn-sm ${variant}`} onClick={() => {
      playSuccessSound();
      updateOrderStatus(order.id, status);
      if (printTicket && autoPrintOnAccept && onPrint) {
        onPrint({ ...order, status, triggerPrint: true });
      }
    }}>
      {icon}{label}
    </button>
  );

  return (
    <motion.article
      layoutId={`order-${order.id}`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={spring}
      className={`ticket ${isNew ? 'is-new' : ''} ${order.isLate && !done ? 'is-late' : ''} ${done ? 'is-done' : ''}`}
    >
      <header className="ticket-head">
        <div className="row gap-2">
          {order.dailyNumber && (
            <span className="ticket-id tnum" style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 900 }}>
              {order.dailyNumber}
            </span>
          )}
          <span className="ticket-id tnum">#{order.id}</span>
          {onPrint && (
            <button
              className="icon-btn"
              style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--cream-2)', color: 'var(--ink)' }}
              onClick={(e) => {
                e.stopPropagation();
                onPrint(order);
              }}
              title="Imprimer le bon de commande (ticket thermique)"
              aria-label="Imprimer le bon"
            >
              <Printer size={13} />
            </button>
          )}
        </div>
        <span className={`ticket-time tnum ${order.isLate && !done ? 'text-danger' : ''}`}>
          <Clock size={13} /> {order.time}
        </span>
      </header>

      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {(order.source === 'TABLE' || order.tableName) && (
          <span className="tag" style={{ background: '#7c3aed', color: '#fff', fontWeight: 800 }}>
            🍽️ {order.tableName || 'Table'} · Sur place
          </span>
        )}

        {(order.source === 'BORNE' || order.kioskId || String(order.id).startsWith('B-')) && (
          <span className="tag" style={{ background: '#059669', color: '#fff', fontWeight: 800 }}>
            🖥️ {order.kioskId || 'Borne'} · Sur place
          </span>
        )}

        {!order.tableName && !order.kioskId && !String(order.id).startsWith('B-') && order.source !== 'TABLE' && order.source !== 'BORNE' && (
          <span className={`tag ${order.type === 'LIVRAISON' ? 'tag-green' : 'tag-gold'}`}>
            {order.type === 'LIVRAISON' ? <Bike size={11} /> : <ShoppingBag size={11} />}
            {order.type === 'LIVRAISON' ? 'Livraison' : 'Retrait'}
          </span>
        )}

        {order.paymentStatus !== 'PAYÉ' && !done && (
          <span className="tag" style={{ fontWeight: 800, background: '#ef4444', color: '#fff' }}>
            ⚠️ À ENCAISSER
          </span>
        )}

        {order.isLate && !done && <span className="tag tag-danger">En retard</span>}
      </div>

      {!done && (
        <div className="ticket-client">
          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{order.customerName}</span>
          <span className="row gap-1"><Phone size={12} /> {order.customerPhone}</span>
          {order.type === 'LIVRAISON' && (
            <span className="row gap-1" style={{ alignItems: 'flex-start' }}><MapPin size={12} style={{ marginTop: 3, flexShrink: 0 }} /> {order.address}</span>
          )}
        </div>
      )}

      {!done && (
        <ul className="ticket-items">
          {order.items.map((it, idx) => (
            <li key={idx}>
              <span className="ticket-item-name">{it.cartName || it.name}</span>
              {it.composition && it.composition.length > 1 && (
                <span className="ticket-compo">{it.composition.join(' · ')}</span>
              )}
              {it.removedIngredients?.length > 0 && (
                <span className="ticket-without">Sans {it.removedIngredients.join(', ').toLowerCase()}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer className="ticket-foot">
        <div className="col">
          <span className="price">{formatPrice(order.total)}</span>
          {order.paymentStatus === 'PAYÉ' ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ✓ En ligne (CB)
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-ink)', background: 'var(--gold-soft)', padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Sur place ({order.type === 'LIVRAISON' ? 'livreur' : 'comptoir'})
            </span>
          )}
        </div>
        <div className="row gap-2">
          {isNew && (
            <>
              {action('Refuser', 'REFUSEE', 'btn-ghost')}
              {action('Accepter', 'PREPARATION', 'btn-primary', <Printer size={13} />, true)}
            </>
          )}
          {order.status === 'PREPARATION' && action('Prête', 'PRETE')}
          {order.status === 'PRETE' && order.type === 'LIVRAISON' && action('Confier au livreur', 'LIVRAISON', 'btn-primary', <Bike size={14} />)}
          {order.status === 'PRETE' && (order.source === 'TABLE' || order.tableName) && action('Servie à table', 'TERMINEE', 'btn-ok')}
          {order.status === 'PRETE' && order.type === 'RETRAIT' && !(order.source === 'TABLE' || order.tableName) && action('Remise au client', 'TERMINEE', 'btn-ok')}
          {order.status === 'LIVRAISON' && action('Livrée', 'TERMINEE', 'btn-ok')}
        </div>
      </footer>
    </motion.article>
  );
}

function EmptyColumn() {
  return <div className="col-empty">Rien pour l'instant</div>;
}

function CaUnlockModal({ onClose, onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      if (isStaffPinValid(next)) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      else if (e.key === "'") handleDigit("'");
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pin]);

  return (
    <div className="modal-centered-wrapper">
      <motion.div 
        className="modal-centered-backdrop" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        style={{
          position: 'relative',
          zIndex: 10000,
          background: 'var(--paper)',
          borderRadius: 24,
          padding: 24,
          width: 'min(340px, 92vw)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
          pointerEvents: 'auto'
        }}
      >
        <div className="row between" style={{ width: '100%' }}>
          <div className="row gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gold-soft)', color: 'var(--gold-ink)', display: 'grid', placeItems: 'center' }}>
              <Lock size={16} />
            </div>
            <strong style={{ fontSize: 16 }}>Code Manager Requis</strong>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <p className="muted small" style={{ margin: 0 }}>
          Saisissez votre code PIN pour afficher le chiffre d'affaires.
        </p>

        {/* PIN Indicators */}
        <motion.div
          animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          style={{ display: 'flex', gap: 14, margin: '6px 0' }}
        >
          {[0, 1, 2, 3].map(i => {
            const filled = pin.length > i;
            return (
              <div
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: error ? '#c8463d' : filled ? 'var(--gold)' : 'var(--cream-2)',
                  border: error ? '2px solid #c8463d' : filled ? '2px solid var(--gold)' : '2px solid var(--line-strong)',
                  boxShadow: filled && !error ? '0 0 8px rgba(227, 163, 69, 0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            );
          })}
        </motion.div>

        {error && (
          <span style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 700 }}>
            Code PIN incorrect {getStaffPin() === '1234' ? '(par défaut : 1234)' : ''}
          </span>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 240 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              style={{
                height: 48,
                borderRadius: 12,
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={onClose}
            style={{
              height: 48,
              borderRadius: 12,
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => handleDigit('0')}
            style={{
              height: 48,
              borderRadius: 12,
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            style={{
              height: 48,
              borderRadius: 12,
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
            aria-label="Effacer"
          >
            <Delete size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function RestaurantView() {
  const { orders, restaurantOpen, setRestaurantOpen, outOfStock, toggleStock } = useStore();
  const navigate = useNavigate();
  const [hideRevenue, setHideRevenue] = useState(() => localStorage.getItem('hoya_hide_ca') !== 'false');
  const [showCaPinModal, setShowCaPinModal] = useState(false);
  const [showZModal, setShowZModal] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState(null);
  const [activeTab, setActiveTab] = useState('NOUVELLE');
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [printingOrder, setPrintingOrder] = useState(null);
  const [autoPrintOnAccept, setAutoPrintOnAccept] = useState(() => localStorage.getItem('hoya_auto_print_accept') !== 'false');
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [audioReady, setAudioReady] = useState(() => getAudioStatus() === 'running');
  const [today] = useState(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const rootRef = useRef(null);
  const width = useContainerWidth(rootRef);
  const wide = width >= 760;

  const handleRevenueClick = () => {
    if (hideRevenue) {
      // Require PIN to reveal
      setPendingPinAction(null);
      setShowCaPinModal(true);
    } else {
      // Hide instantly without code
      setHideRevenue(true);
      localStorage.setItem('hoya_hide_ca', 'true');
    }
  };

  const handleOpenCaisse = () => {
    if (hideRevenue) {
      setPendingPinAction(() => () => setShowZModal(true));
      setShowCaPinModal(true);
    } else {
      setShowZModal(true);
    }
  };

  const handleUnlockCa = () => {
    setHideRevenue(false);
    localStorage.setItem('hoya_hide_ca', 'false');
    setShowCaPinModal(false);
    if (pendingPinAction) {
      pendingPinAction();
      setPendingPinAction(null);
    }
  };

  // Auto unlock audio on any user interaction
  useEffect(() => {
    const handleInteract = () => {
      unlockAudio().then(() => {
        setAudioReady(getAudioStatus() === 'running');
      });
    };
    window.addEventListener('click', handleInteract, { passive: true });
    window.addEventListener('touchstart', handleInteract, { passive: true });
    return () => {
      window.removeEventListener('click', handleInteract);
      window.removeEventListener('touchstart', handleInteract);
    };
  }, []);

  const byStatus = (status) => orders.filter(o => o.status === status);
  const newCount = byStatus('NOUVELLE').length;
  const inProgress = orders.filter(o => ['PREPARATION', 'PRETE', 'LIVRAISON'].includes(o.status)).length;
  const finished = byStatus('TERMINEE');
  const revenue = finished.reduce((s, o) => s + o.total, 0);

  // Sound & automatic focus on "Nouvelles" tab when a new order arrives
  const isFirstMount = useRef(true);
  const prevNew = useRef(newCount);
  const knownOrderIds = useRef(new Set(orders.map(o => o.id)));

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      knownOrderIds.current = new Set(orders.map(o => o.id));
      prevNew.current = newCount;
      return;
    }

    // Detect if a brand new order arrived
    const hasBrandNewOrder = orders.some(o => !knownOrderIds.current.has(o.id) && o.status === 'NOUVELLE');
    if (hasBrandNewOrder || newCount > prevNew.current) {
      if (soundOn) {
        playNewOrderSound();
      }
      setActiveTab('NOUVELLE');
      // Note: Ne pas imprimer automatiquement à la réception. L'impression se lance au clic sur 'Accepter'.
    }

    knownOrderIds.current = new Set(orders.map(o => o.id));
    prevNew.current = newCount;
  }, [orders, newCount, soundOn]);

  const handleToggleSound = async () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) {
      await unlockAudio();
      setAudioReady(true);
      playNewOrderSound(true); // play sample chime so user hears it and browser audio context unlocks
    }
  };

  const swipe = (dir) => {
    const i = STATUS_COLUMNS.findIndex(c => c.id === activeTab);
    const next = STATUS_COLUMNS[i + dir];
    if (next) setActiveTab(next.id);
  };

  return (
    <div className="screen kitchen" ref={rootRef}>
      <header className="kitchen-head">
        <div className="kitchen-head-top">
          <StaffBrand label="Cuisine" sub={today} compact={!wide} />

          <div className="row gap-2">
            <button
              className="icon-btn"
              style={{
                boxShadow: 'inset 0 0 0 1px var(--line)',
                color: soundOn ? 'var(--green-700)' : 'var(--muted)',
                background: soundOn ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                position: 'relative'
              }}
              onClick={handleToggleSound}
              title={soundOn ? 'Carillon des commandes activé' : 'Carillon coupé'}
              aria-label="Alerte sonore commandes"
            >
              {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
              {soundOn && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--green-700)'
                  }}
                />
              )}
            </button>

            <button 
              className="icon-btn" 
              style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} 
              onClick={() => setShowSettings(true)} 
              aria-label="Réglages" 
              title="Réglages du service"
            >
              <SlidersHorizontal size={17} />
            </button>

            <button
              className="icon-btn"
              style={{ 
                boxShadow: 'inset 0 0 0 1px var(--line)', 
                color: 'var(--danger)',
                background: 'rgba(200, 70, 61, 0.05)'
              }}
              onClick={lockStaffApp}
              title="Verrouiller l'écran cuisine"
              aria-label="Verrouiller l'écran cuisine"
            >
              <LockKeyhole size={16} />
            </button>
          </div>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="kitchen-head-nav">
          <button className="service-toggle" onClick={() => setRestaurantOpen(!restaurantOpen)} style={{ marginRight: 6 }}>
            <span className={`switch ${restaurantOpen ? 'on' : ''}`}>
              <motion.span layout transition={spring} className="switch-knob" />
            </span>
            <span style={{ fontSize: 12 }}>{restaurantOpen ? 'En service' : 'Fermé'}</span>
          </button>

          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/')}
            title="Voir le site client"
          >
            <ShoppingBag size={13} />
            <span>Site client</span>
          </button>

          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/livreur')}
            title="Ouvrir l'interface livreur"
          >
            <Bike size={13} />
            <span>Livreur</span>
          </button>

          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/admin')}
            title="Gérer la carte des produits et clôturer la caisse"
          >
            <Sparkles size={13} style={{ color: 'var(--gold)' }} />
            <span>Admin / Carte</span>
          </button>

          {!wide && (
            <button
              className="btn btn-sm btn-ghost row gap-1"
              onClick={handleRevenueClick}
              style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
            >
              {hideRevenue ? <Lock size={12} style={{ color: 'var(--gold)' }} /> : <Eye size={12} />}
              <span>{hideRevenue ? 'CA protégé' : `${formatPrice(revenue)}`}</span>
            </button>
          )}

          {!wide && (
            <button
              className="btn btn-sm btn-ghost row gap-1"
              onClick={handleOpenCaisse}
              style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
            >
              <FileText size={12} style={{ color: 'var(--gold-ink)' }} />
              <span>Ticket Z</span>
            </button>
          )}
        </div>

        {wide && (
          <div className="kitchen-stats">
            <div><span className="tnum">{newCount}</span><span>en attente</span></div>
            <div><span className="tnum">{inProgress}</span><span>en cours</span></div>
            <div 
              onClick={handleRevenueClick}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
              title={hideRevenue ? "Chiffre d'affaires protégé par code PIN (cliquez pour déverrouiller)" : "Cliquez pour masquer immédiatement le CA aux employés"}
            >
              <span className="tnum row gap-1" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                {hideRevenue ? '•••• €' : formatPrice(revenue)}
                {hideRevenue ? <Lock size={12} style={{ color: 'var(--gold)' }} /> : <EyeOff size={13} className="muted" />}
              </span>
              <span>{hideRevenue ? 'CA protégé' : 'encaissé'}</span>
            </div>
            <button
              className="btn btn-sm btn-ghost row gap-1"
              style={{ height: 32, padding: '0 8px', fontSize: 11, border: '1px solid var(--line)', background: 'var(--paper)', borderRadius: 'var(--r-sm)' }}
              onClick={handleOpenCaisse}
              title="Clôture de caisse & Impression du Ticket Z (Code PIN requis)"
            >
              <FileText size={13} style={{ color: 'var(--gold-ink)' }} />
              <span>Ticket Z</span>
            </button>
          </div>
        )}
      </header>

      {!audioReady && soundOn && (
        <div
          style={{
            background: 'var(--gold-soft)',
            borderBottom: '1px solid rgba(217, 165, 79, 0.4)',
            color: 'var(--gold-ink)',
            padding: '9px 18px',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={async () => {
            await unlockAudio();
            setAudioReady(true);
            playNewOrderSound(true);
          }}
        >
          <div className="row gap-2">
            <Volume2 size={16} />
            <span>Autorisation requise par votre navigateur : Cliquez ici pour activer le carillon de commande</span>
          </div>
          <span className="btn btn-sm btn-ghost" style={{ padding: '3px 10px', height: 'auto', fontSize: 11, borderColor: 'var(--gold-ink)', color: 'var(--gold-ink)' }}>
            Activer le son
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {newCount > 0 && (
          <motion.div
            className="new-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="row gap-2 between" style={{ padding: '10px 20px', flexWrap: 'wrap' }}>
              <div className="row gap-2">
                <span className="live-dot" style={{ background: 'var(--gold)' }} />
                <span>
                  {newCount === 1 ? '1 commande attend votre validation' : `${newCount} commandes attendent votre validation`}
                </span>
              </div>
              <button
                className="btn btn-sm btn-gold"
                style={{ padding: '0 14px', height: 30, fontSize: 12, borderRadius: 999 }}
                onClick={() => playNewOrderSound(true)}
                title="Faire retentir le carillon"
              >
                <Volume2 size={13} /> Rejouer carillon
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup>
        {width === 0 ? null : wide ? (
          <div className="board">
            {STATUS_COLUMNS.map(col => {
              const colOrders = byStatus(col.id);
              return (
                <section key={col.id} className={`board-col ${col.id === 'TERMINEE' ? 'muted-col' : ''}`}>
                  <div className="board-col-head">
                    <h3>{col.title}</h3>
                    <motion.span key={colOrders.length} className="count" initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                      {colOrders.length}
                    </motion.span>
                  </div>
                  <div className="board-col-body scroll">
                    <AnimatePresence mode="popLayout">
                      {colOrders.map(o => <OrderCard key={o.id} order={o} onPrint={setPrintingOrder} autoPrintOnAccept={autoPrintOnAccept} />)}
                    </AnimatePresence>
                    {colOrders.length === 0 && <EmptyColumn />}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="col" style={{ flex: 1, minHeight: 0 }}>
            <div className="tabs">
              {STATUS_COLUMNS.map(col => {
                const count = byStatus(col.id).length;
                return (
                  <button key={col.id} className={activeTab === col.id ? 'active' : ''} onClick={() => setActiveTab(col.id)}>
                    {col.title}
                    {count > 0 && <span className="count">{count}</span>}
                    {activeTab === col.id && <motion.span layoutId="tab-underline" className="tab-underline" transition={spring} />}
                  </button>
                );
              })}
            </div>
            <motion.div
              className="scroll"
              style={{ padding: 16 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              dragDirectionLock
              onDragEnd={(_, { offset }) => {
                if (offset.x < -60) swipe(1);
                else if (offset.x > 60) swipe(-1);
              }}
            >
              <div className="col gap-3">
                <AnimatePresence mode="popLayout">
                  {byStatus(activeTab).map(o => <OrderCard key={o.id} order={o} onPrint={setPrintingOrder} autoPrintOnAccept={autoPrintOnAccept} />)}
                </AnimatePresence>
                {byStatus(activeTab).length === 0 && <EmptyColumn />}
              </div>
            </motion.div>
          </div>
        )}
      </LayoutGroup>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} />
            <motion.aside
              className="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            >
              <div className="row between" style={{ padding: '18px 20px' }}>
                <h2 className="display" style={{ fontSize: 22 }}>Service</h2>
                <button className="icon-btn" onClick={() => setShowSettings(false)} aria-label="Fermer"><X size={20} /></button>
              </div>
              <div className="scroll col gap-6" style={{ padding: '0 20px 20px' }}>
                <section className="col gap-2">
                  <h3 className="eyebrow">Notifications sonores</h3>
                  <p className="muted small">Une alerte carillon retentit automatiquement dès qu'un client passe commande.</p>
                  <div className="stock-row" style={{ cursor: 'pointer' }} onClick={handleToggleSound}>
                    <span>Carillon nouvelle commande</span>
                    <span className={`switch ${soundOn ? 'on' : ''}`}>
                      <motion.span layout transition={spring} className="switch-knob" />
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost row gap-2"
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                    onClick={() => playNewOrderSound(true)}
                  >
                    <Volume2 size={14} /> Tester le carillon
                  </button>
                </section>

                <section className="col gap-2">
                  <h3 className="eyebrow">Ruptures</h3>
                  <p className="muted small">Un produit en rupture disparaît immédiatement de la carte client.</p>
                  <div className="col" style={{ marginTop: 4 }}>
                    {STOCK_ITEMS.map(it => {
                      const available = !outOfStock.includes(it.id);
                      return (
                        <button key={it.id} className="stock-row" onClick={() => toggleStock(it.id)}>
                          <span className={available ? '' : 'muted'} style={{ textDecoration: available ? 'none' : 'line-through' }}>{it.name}</span>
                          <span className={`switch ${available ? 'on' : ''}`}>
                            <motion.span layout transition={spring} className="switch-knob" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="col gap-2">
                  <h3 className="eyebrow">Impression des Bons (KDS)</h3>
                  <p className="muted small">Impression thermique standard 80mm pour la cuisine.</p>
                  <div 
                    className="stock-row" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setAutoPrintOnAccept(prev => {
                        const next = !prev;
                        localStorage.setItem('hoya_auto_print_accept', String(next));
                        return next;
                      });
                    }}
                  >
                    <div className="col">
                      <span>Imprimer à l'acceptation</span>
                      <span className="muted small">Lance le bon dès que vous appuyez sur "Accepter".</span>
                    </div>
                    <span className={`switch ${autoPrintOnAccept ? 'on' : ''}`}>
                      <motion.span layout transition={spring} className="switch-knob" />
                    </span>
                  </div>
                </section>

                <section className="col gap-2">
                  <h3 className="eyebrow">Confidentialité Équipe</h3>
                  <div className="stock-row" style={{ cursor: 'pointer' }} onClick={handleRevenueClick}>
                    <div className="col">
                      <span>Protéger le Chiffre d'Affaires</span>
                      <span className="muted small">{hideRevenue ? 'Actuellement masqué (Code 1234 requis pour voir)' : 'Affiché (Cliquez pour masquer)'}</span>
                    </div>
                    <span className={`switch ${hideRevenue ? 'on' : ''}`}>
                      <motion.span layout transition={spring} className="switch-knob" />
                    </span>
                  </div>
                </section>

                <section className="col gap-2">
                  <h3 className="eyebrow">Aujourd'hui</h3>
                  <div className="stat-grid">
                    <div className="card"><span className="tnum">{finished.length}</span><span className="muted small">commandes terminées</span></div>
                    <div className="card"><span className="tnum">{hideRevenue ? '•••• €' : formatPrice(revenue)}</span><span className="muted small">chiffre d'affaires</span></div>
                  </div>
                </section>

                <section className="col gap-2">
                  <h3 className="eyebrow">Gestion & Clôture</h3>
                  <div className="col gap-2">
                    <button
                      className="btn btn-sm btn-ghost row gap-2"
                      style={{
                        background: 'var(--gold-soft)',
                        color: 'var(--gold-ink)',
                        borderColor: 'rgba(217, 165, 79, 0.4)',
                        justifyContent: 'flex-start',
                        padding: '10px 14px'
                      }}
                      onClick={() => {
                        setShowSettings(false);
                        handleOpenCaisse();
                      }}
                    >
                      <FileText size={16} />
                      <div className="col" style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: 13 }}>Clôture de Caisse (Ticket Z)</strong>
                        <span className="small" style={{ opacity: 0.8 }}>Bilan du CA, encaissements et impression ticket 80mm</span>
                      </div>
                    </button>

                    <button
                      className="btn btn-sm btn-ghost row gap-2"
                      style={{
                        background: 'var(--cream-2)',
                        borderColor: 'var(--line)',
                        justifyContent: 'flex-start',
                        padding: '10px 14px'
                      }}
                      onClick={() => {
                        setShowSettings(false);
                        navigate('/admin');
                      }}
                    >
                      <SlidersHorizontal size={16} />
                      <div className="col" style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: 13 }}>Gérer la Carte & Produits</strong>
                        <span className="muted small">Ajouter des produits, photos, modifier les prix</span>
                      </div>
                    </button>
                  </div>
                </section>

                <section className="col gap-2" style={{ marginTop: 8 }}>
                  <h3 className="eyebrow">Sécurité & Session Staff</h3>
                  <button
                    className="btn btn-ghost row gap-2"
                    style={{
                      background: 'var(--cream-2)',
                      borderColor: 'var(--line)',
                      justifyContent: 'center',
                      padding: '11px 16px',
                      fontWeight: 600,
                      borderRadius: 'var(--r)'
                    }}
                    onClick={() => {
                      setShowSettings(false);
                      setShowInstallModal(true);
                    }}
                  >
                    <Smartphone size={16} />
                    <span>Installer l'app sur la tablette</span>
                  </button>
                  <button
                    className="btn btn-ghost row gap-2"
                    style={{
                      background: 'var(--cream-2)',
                      borderColor: 'var(--line)',
                      justifyContent: 'center',
                      padding: '11px 16px',
                      fontWeight: 600,
                      borderRadius: 'var(--r)'
                    }}
                    onClick={() => {
                      setShowSettings(false);
                      setShowChangePinModal(true);
                    }}
                  >
                    <KeyRound size={16} />
                    <span>Modifier le code PIN staff</span>
                  </button>
                  <button
                    className="btn btn-ghost row gap-2"
                    style={{
                      color: '#c8463d',
                      borderColor: 'rgba(200, 70, 61, 0.3)',
                      background: 'rgba(200, 70, 61, 0.05)',
                      justifyContent: 'center',
                      padding: '12px 16px',
                      fontWeight: 700,
                      borderRadius: 'var(--r)'
                    }}
                    onClick={() => {
                      setShowSettings(false);
                      lockStaffApp();
                    }}
                  >
                    <LockKeyhole size={16} />
                    <span>Verrouiller l'écran cuisine</span>
                  </button>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCaPinModal && (
          <CaUnlockModal 
            onClose={() => setShowCaPinModal(false)} 
            onUnlock={handleUnlockCa} 
          />
        )}
        {showChangePinModal && (
          <ChangePinModal onClose={() => setShowChangePinModal(false)} />
        )}
        {showInstallModal && (
          <InstallPwaModal onClose={() => setShowInstallModal(false)} type="cuisine" />
        )}
        {printingOrder && (
          <TicketPrintModal
            order={printingOrder}
            onClose={() => setPrintingOrder(null)}
            onAdvanceStatus={(id, st) => {
              updateOrderStatus(id, st);
              setPrintingOrder(null);
            }}
          />
        )}
        {showZModal && (
          <CaisseClotureModal onClose={() => setShowZModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
