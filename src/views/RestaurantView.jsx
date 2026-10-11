import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Clock, Phone, Bike, MapPin, SlidersHorizontal, X, ShoppingBag, Volume2, VolumeX, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import { MENU } from '../data';
import { formatPrice } from '../format';
import { ease } from '../motion';
import { playNewOrderSound, playSuccessSound, isSoundEnabled, setSoundEnabled, unlockAudio, getAudioStatus } from '../sound';
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

function OrderCard({ order }) {
  const updateOrderStatus = useStore(s => s.updateOrderStatus);
  const isNew = order.status === 'NOUVELLE';
  const done = order.status === 'TERMINEE';

  const action = (label, status, variant = 'btn-primary', icon = null) => (
    <button className={`btn btn-sm ${variant}`} onClick={() => {
      playSuccessSound();
      updateOrderStatus(order.id, status);
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
        <span className="ticket-id tnum">#{order.id}</span>
        <span className={`ticket-time tnum ${order.isLate && !done ? 'text-danger' : ''}`}>
          <Clock size={13} /> {order.time}
        </span>
      </header>

      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <span className={`tag ${order.type === 'LIVRAISON' ? 'tag-green' : 'tag-gold'}`}>
          {order.type === 'LIVRAISON' ? <Bike size={11} /> : <ShoppingBag size={11} />}
          {order.type === 'LIVRAISON' ? 'Livraison' : 'Retrait'}
        </span>
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
          <span className={`small ${order.paymentStatus === 'PAYÉ' ? 'muted' : 'text-danger'}`} style={{ fontSize: 11, fontWeight: 600 }}>
            {order.paymentStatus === 'PAYÉ' ? 'Payé en ligne' : 'À encaisser'}
          </span>
        </div>
        <div className="row gap-2">
          {isNew && (
            <>
              {action('Refuser', 'REFUSEE', 'btn-ghost')}
              {action('Accepter', 'PREPARATION')}
            </>
          )}
          {order.status === 'PREPARATION' && action('Prête', 'PRETE')}
          {order.status === 'PRETE' && order.type === 'LIVRAISON' && action('Confier au livreur', 'LIVRAISON', 'btn-primary', <Bike size={14} />)}
          {order.status === 'PRETE' && order.type === 'RETRAIT' && action('Remise au client', 'TERMINEE', 'btn-ok')}
          {order.status === 'LIVRAISON' && action('Livrée', 'TERMINEE', 'btn-ok')}
        </div>
      </footer>
    </motion.article>
  );
}

function EmptyColumn() {
  return <div className="col-empty">Rien pour l'instant</div>;
}

export default function RestaurantView() {
  const { orders, restaurantOpen, setRestaurantOpen, outOfStock, toggleStock } = useStore();
  const navigate = useNavigate();
  const [hideRevenue, setHideRevenue] = useState(() => localStorage.getItem('hoya_hide_ca') === 'true');
  const [activeTab, setActiveTab] = useState('NOUVELLE');
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [audioReady, setAudioReady] = useState(() => getAudioStatus() === 'running');
  const [today] = useState(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const rootRef = useRef(null);
  const width = useContainerWidth(rootRef);
  const wide = width >= 760;

  const toggleHideRevenue = () => {
    setHideRevenue(prev => {
      const next = !prev;
      localStorage.setItem('hoya_hide_ca', String(next));
      return next;
    });
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
        <div className="row gap-3">
          <div className="col">
            <span className="display" style={{ fontSize: 24, color: 'var(--green-700)' }}>Hoya Poké</span>
            <span className="muted small">Cuisine · {today}</span>
          </div>
          <div className="row gap-2" style={{ marginLeft: 8 }}>
            <button 
              className="btn btn-sm btn-ghost row gap-1"
              style={{ height: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() => navigate('/')}
              title="Voir le site client"
            >
              <ShoppingBag size={13} />
              <span>Site client</span>
            </button>
            <button 
              className="btn btn-sm btn-ghost row gap-1"
              style={{ height: 32, padding: '0 10px', fontSize: 12 }}
              onClick={() => navigate('/livreur')}
              title="Ouvrir l'interface livreur"
            >
              <Bike size={13} />
              <span>Livreur</span>
            </button>
          </div>
        </div>

        {wide && (
          <div className="kitchen-stats">
            <div><span className="tnum">{newCount}</span><span>en attente</span></div>
            <div><span className="tnum">{inProgress}</span><span>en cours</span></div>
            <div 
              onClick={toggleHideRevenue}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
              title={hideRevenue ? "Chiffre d'affaires masqué (cliquez pour afficher)" : "Cliquez pour masquer le CA aux employés"}
            >
              <span className="tnum row gap-1" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                {hideRevenue ? '•••• €' : formatPrice(revenue)}
                {hideRevenue ? <EyeOff size={13} className="muted" /> : <Eye size={13} className="muted" />}
              </span>
              <span>{hideRevenue ? 'CA masqué' : 'encaissé'}</span>
            </div>
          </div>
        )}

        <div className="row gap-3">
          <button
            className="icon-btn"
            style={{
              boxShadow: 'inset 0 0 0 1px var(--line)',
              color: soundOn ? 'var(--green-700)' : 'var(--muted)',
              background: soundOn ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
              position: 'relative'
            }}
            onClick={handleToggleSound}
            title={soundOn ? 'Carillon des commandes activé (cliquez pour couper ou tester)' : 'Carillon coupé (cliquez pour activer)'}
            aria-label="Alerte sonore commandes"
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {soundOn && (
              <span
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--green-700)'
                }}
              />
            )}
          </button>
          <button className="service-toggle" onClick={() => setRestaurantOpen(!restaurantOpen)}>
            <span className={`switch ${restaurantOpen ? 'on' : ''}`}>
              <motion.span layout transition={spring} className="switch-knob" />
            </span>
            <span>{restaurantOpen ? 'En service' : 'Fermé'}</span>
          </button>
          <button className="icon-btn" style={{ boxShadow: 'inset 0 0 0 1px var(--line)' }} onClick={() => setShowSettings(true)} aria-label="Réglages">
            <SlidersHorizontal size={18} />
          </button>
        </div>
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
            <span>Autorisation requise par votre navigateur : Cliquez ici pour activer le carillon de commande 🔔</span>
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
                className="btn btn-sm btn-ghost"
                style={{ color: 'var(--cream)', borderColor: 'rgba(255,255,255,0.3)', padding: '3px 10px', height: 'auto', fontSize: 12 }}
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
                      {colOrders.map(o => <OrderCard key={o.id} order={o} />)}
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
                  {byStatus(activeTab).map(o => <OrderCard key={o.id} order={o} />)}
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
                  <h3 className="eyebrow">Confidentialité Équipe</h3>
                  <div className="stock-row" style={{ cursor: 'pointer' }} onClick={toggleHideRevenue}>
                    <div className="col">
                      <span>Masquer le Chiffre d'Affaires</span>
                      <span className="muted small">Mode employés : cache le CA de l'écran en cuisine.</span>
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
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
