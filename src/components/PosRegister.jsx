import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Minus, Trash2, Search, Printer, Check, X, 
  CreditCard, Banknote, ShoppingBag, Utensils, RotateCcw, 
  Percent, Tag, DollarSign, ArrowRight, ShieldCheck, 
  Coins, History, Sparkles, ChefHat, FileText, CheckCircle2
} from 'lucide-react';
import { useStore } from '../store';
import { MENU } from '../data';
import { formatPrice } from '../format';
import { playNewOrderSound, playSuccessSound } from '../sound';
import TicketPrintModal from './TicketPrintModal';
import '../views/pos.css';

const POS_CATEGORIES = [
  { id: 'all', label: 'Tout' },
  { id: 'classiques', label: 'Pokés Classiques' },
  { id: 'sides', label: 'Sides & Entrées' },
  { id: 'formules', label: 'Formules Midi' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' }
];

export default function PosRegister() {
  const { menu, orders, addOrder } = useStore();

  // Cart / Current Ticket State
  const [ticketLines, setTicketLines] = useState([]);
  const [orderType, setOrderType] = useState('SUR_PLACE'); // 'SUR_PLACE' (TVA 10%) | 'A_EMPORTER' (TVA 5.5%/10%)
  const [tableRef, setTableRef] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0); // 0, 10, 20, 50

  // Modals & Sub-views
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Cash Drawer State (persisted locally)
  const [cashFloat, setCashFloat] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('hoya_pos_cash_float') || '150');
    } catch (e) {
      return 150;
    }
  });
  const [cashMovements, setCashMovements] = useState(() => {
    try {
      const saved = localStorage.getItem('hoya_pos_cash_movements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Payment Form State
  const [payMethod, setPayMethod] = useState('CB'); // 'CB' | 'ESPECES' | 'TITRE_RESTO' | 'MIXTE'
  const [cashReceived, setCashReceived] = useState('');
  const [trAmount, setTrAmount] = useState('25.00');
  const [splitCb, setSplitCb] = useState('');

  // Catalog items preparation
  const catalogItems = useMemo(() => {
    const list = [];
    (menu.classiques || []).forEach(p => list.push({ ...p, category: 'classiques', isPoke: true }));
    (menu.sides || []).forEach(s => list.push({ ...s, category: 'sides' }));
    (menu.desserts || []).forEach(d => list.push({ ...d, category: 'desserts' }));
    (menu.boissons || []).forEach(b => list.push({ ...b, category: 'boissons' }));
    
    // Add lunch combos directly
    list.push({
      id: 'f-midi-pos',
      name: 'Formule Midi Poké + Boisson + Cookie',
      price: 14.90,
      badge: 'Pack Midi',
      category: 'formules',
      isFormule: true,
      desc: 'Poké Classique M + Boisson au choix + Cookie artisanal'
    });

    return list;
  }, [menu]);

  // Filtered items
  const filteredProducts = useMemo(() => {
    return catalogItems.filter(p => {
      const matchCat = selectedCat === 'all' || p.category === selectedCat;
      const matchQuery = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [catalogItems, selectedCat, searchQuery]);

  // Ticket calculations
  const rawTotal = ticketLines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discountAmount = (rawTotal * discountPercent) / 100;
  const totalTTC = Math.max(0, rawTotal - discountAmount);
  
  // Tax breakdown (approx. 5.5% for cold takeaway, 10% for on-site / drinks)
  const vatRate = orderType === 'SUR_PLACE' ? 0.10 : 0.055;
  const totalHT = totalTTC / (1 + vatRate);
  const totalTVA = totalTTC - totalHT;

  // Add Item to ticket
  const handleAddItem = (item, customSize = 'M') => {
    playSuccessSound();
    setTicketLines(prev => {
      const itemPrice = customSize === 'L' && item.priceL ? item.priceL : (item.price || item.priceM || 11.90);
      const lineKey = `${item.id}-${customSize}`;
      const existing = prev.find(l => l.key === lineKey);
      
      if (existing) {
        return prev.map(l => l.key === lineKey ? { ...l, qty: l.qty + 1 } : l);
      }
      
      return [
        ...prev,
        {
          key: lineKey,
          id: item.id,
          name: item.name + (item.isPoke ? ` (${customSize})` : ''),
          price: itemPrice,
          qty: 1,
          size: customSize,
          category: item.category,
          composition: item.isPoke ? [item.name] : []
        }
      ];
    });
  };

  // Modify quantity
  const handleUpdateQty = (key, delta) => {
    setTicketLines(prev => prev.map(l => {
      if (l.key !== key) return l;
      const nextQty = l.qty + delta;
      return nextQty > 0 ? { ...l, qty: nextQty } : null;
    }).filter(Boolean));
  };

  // Clear Ticket
  const handleClearTicket = () => {
    if (ticketLines.length === 0) return;
    if (confirm('Voulez-vous réinitialiser et vider ce ticket ?')) {
      setTicketLines([]);
      setDiscountPercent(0);
      setTableRef('');
    }
  };

  // Open Checkout
  const handleStartCheckout = () => {
    if (ticketLines.length === 0) return;
    setCashReceived(totalTTC.toFixed(2));
    setSplitCb((totalTTC / 2).toFixed(2));
    setPayModalOpen(true);
  };

  // Finalize Payment and generate ticket
  const handleConfirmPayment = () => {
    const orderId = `C-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    let methodLabel = 'COMPTOIR (CB)';
    if (payMethod === 'ESPECES') methodLabel = 'COMPTOIR (ESPÈCES)';
    if (payMethod === 'TITRE_RESTO') methodLabel = 'COMPTOIR (TITRE RESTAURANT)';
    if (payMethod === 'MIXTE') methodLabel = `COMPTOIR (MIXTE : ${splitCb}€ CB + ${(totalTTC - parseFloat(splitCb || 0)).toFixed(2)}€ Espèces)`;

    const newOrder = {
      id: orderId,
      status: 'PREPARATION', // Directly in preparation for kitchen KDS
      type: orderType === 'SUR_PLACE' ? 'RETRAIT' : 'RETRAIT',
      orderChannel: 'CAISSE_COMPTOIR',
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      customerName: tableRef ? `Comptoir (${tableRef})` : 'Client Comptoir',
      customerPhone: 'Vente directe',
      address: orderType === 'SUR_PLACE' ? 'Sur place' : 'À emporter',
      total: totalTTC,
      subtotalHT: totalHT,
      tvaAmount: totalTVA,
      discount: discountAmount,
      paymentStatus: 'PAYÉ',
      paymentMethod: methodLabel,
      items: ticketLines.map(l => ({
        name: l.name,
        cartName: l.name,
        price: l.price,
        qty: l.qty,
        composition: l.composition || [l.name]
      }))
    };

    // Save cash movement if paid in cash
    if (payMethod === 'ESPECES') {
      const move = {
        id: Date.now(),
        type: 'VENTE',
        amount: totalTTC,
        label: `Vente comptoir #${orderId}`,
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      const updated = [move, ...cashMovements];
      setCashMovements(updated);
      try { localStorage.setItem('hoya_pos_cash_movements', JSON.stringify(updated)); } catch (e) {}
    }

    // Add to main store (triggers Kitchen KDS bell and updates sales journal)
    addOrder(newOrder);
    playNewOrderSound(true);

    setCompletedOrder(newOrder);
    setPayModalOpen(false);
    setTicketLines([]);
    setDiscountPercent(0);
    setTableRef('');
  };

  // Add Free custom item
  const handleAddCustomFreeItem = () => {
    const name = prompt("Nom de l'article libre :", "Café / Divers");
    if (!name) return;
    const priceStr = prompt("Prix TTC en euros :", "2.00");
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) return;

    setTicketLines(prev => [
      ...prev,
      {
        key: `libre-${Date.now()}`,
        id: `libre-${Date.now()}`,
        name: name,
        price: price,
        qty: 1,
        category: 'divers'
      }
    ]);
  };

  return (
    <div className="pos-container">
      {/* --- Left Catalog Pane --- */}
      <div className="pos-catalog-pane">
        <div className="pos-catalog-header">
          <div className="row between">
            <div className="pos-search-bar grow">
              <Search size={16} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Rechercher un plat, boisson, dessert..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="row gap-2" style={{ marginLeft: 12 }}>
              <button 
                className="btn btn-sm btn-ghost row gap-1"
                onClick={() => setCashDrawerOpen(true)}
                title="Tiroir-Caisse & Mouvements d'espèces"
              >
                <Coins size={14} style={{ color: 'var(--gold)' }} />
                <span>Tiroir</span>
              </button>
              <button 
                className="btn btn-sm btn-ghost row gap-1"
                onClick={() => setHistoryOpen(true)}
                title="Historique des tickets comptoir"
              >
                <History size={14} />
                <span>Tickets</span>
              </button>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="pos-cat-pills">
            {POS_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`pos-cat-pill ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick action shortcuts */}
        <div className="pos-quick-actions-bar">
          <button 
            className="pos-quick-btn"
            onClick={() => handleAddItem({ id: 'formule-midi', name: 'Formule Midi Poké + Boisson + Cookie', price: 14.90, category: 'formules' })}
          >
            <Sparkles size={13} style={{ color: 'var(--gold)' }} />
            <span>+ Formule Midi (14.90€)</span>
          </button>
          <button 
            className="pos-quick-btn"
            onClick={() => handleAddItem({ id: 'surmesure-pos', name: 'Poké Sur-Mesure Comptoir (M)', price: 12.90, category: 'classiques', isPoke: true })}
          >
            <Utensils size={13} style={{ color: 'var(--green-700)' }} />
            <span>+ Sur-Mesure M (12.90€)</span>
          </button>
          <button 
            className="pos-quick-btn"
            onClick={handleAddCustomFreeItem}
          >
            <Plus size={13} />
            <span>+ Article Libre (€)</span>
          </button>
        </div>

        {/* Product Grid */}
        <div className="pos-products-grid">
          {filteredProducts.map(p => (
            <motion.div
              key={p.id}
              className="pos-product-card"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddItem(p, 'M')}
            >
              {p.badge && <span className="pos-card-badge">{p.badge}</span>}
              <div 
                className="pos-card-swatch"
                style={{ backgroundImage: p.image ? `url(${p.image})` : 'none' }}
              />
              <span className="pos-card-title">{p.name}</span>
              <div className="row between" style={{ marginTop: 'auto', width: '100%' }}>
                <span className="pos-card-price">{formatPrice(p.price || p.priceM || 11.90)}</span>
                {p.isPoke && p.priceL && (
                  <button 
                    className="tag tag-gold" 
                    style={{ fontSize: 10, cursor: 'pointer', padding: '2px 6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddItem(p, 'L');
                    }}
                    title="Ajouter en format Grand (L)"
                  >
                    Format L
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* --- Right Ticket Pane --- */}
      <div className="pos-ticket-pane">
        <div className="pos-ticket-head">
          <div className="pos-order-type-tabs">
            <button
              className={`pos-type-btn ${orderType === 'SUR_PLACE' ? 'active' : ''}`}
              onClick={() => setOrderType('SUR_PLACE')}
            >
              <Utensils size={14} />
              <span>Sur place (TVA 10%)</span>
            </button>
            <button
              className={`pos-type-btn ${orderType === 'A_EMPORTER' ? 'active' : ''}`}
              onClick={() => setOrderType('A_EMPORTER')}
            >
              <ShoppingBag size={14} />
              <span>À emporter (TVA 5.5%)</span>
            </button>
          </div>

          <div className="pos-table-input-row">
            <input
              type="text"
              placeholder="Table / Chevalet / Nom client (facultatif)"
              value={tableRef}
              onChange={e => setTableRef(e.target.value)}
              className="pos-table-input"
            />
            {tableRef && (
              <button onClick={() => setTableRef('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Lines Scroll */}
        <div className="pos-lines-scroll">
          {ticketLines.length === 0 ? (
            <div className="pos-empty-receipt">
              <ShoppingBag size={36} strokeWidth={1.5} />
              <strong style={{ fontSize: 14 }}>Ticket en cours vide</strong>
              <span className="small">Cliquez sur un article à gauche pour l'ajouter au panier d'encaissement.</span>
            </div>
          ) : (
            ticketLines.map(line => (
              <div key={line.key} className="pos-ticket-line">
                <div className="pos-line-info">
                  <span className="pos-line-name">{line.name}</span>
                  <span className="pos-line-sub">{formatPrice(line.price)} / unité</span>
                </div>

                <div className="pos-line-qty-ctrl">
                  <button className="pos-qty-btn" onClick={() => handleUpdateQty(line.key, -1)} aria-label="Moins">
                    <Minus size={12} />
                  </button>
                  <span className="pos-qty-val">{line.qty}</span>
                  <button className="pos-qty-btn" onClick={() => handleUpdateQty(line.key, 1)} aria-label="Plus">
                    <Plus size={12} />
                  </button>
                </div>

                <span className="pos-line-price">{formatPrice(line.price * line.qty)}</span>

                <button className="pos-line-del" onClick={() => handleUpdateQty(line.key, -line.qty)} title="Supprimer la ligne">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Ticket Footer & Total */}
        <div className="pos-ticket-footer">
          {/* Quick Discounts Bar */}
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span className="small muted" style={{ fontSize: 11 }}>Remise :</span>
            {[0, 10, 20, 50].map(pct => (
              <button
                key={pct}
                className={`tag ${discountPercent === pct ? 'tag-green' : ''}`}
                style={{ cursor: 'pointer', fontSize: 11, padding: '3px 8px' }}
                onClick={() => setDiscountPercent(pct)}
              >
                {pct === 0 ? 'Aucune' : `-${pct}%`}
              </button>
            ))}
          </div>

          <div className="col gap-1">
            <div className="pos-recap-row">
              <span>Sous-total HT</span>
              <span>{formatPrice(totalHT)}</span>
            </div>
            <div className="pos-recap-row">
              <span>TVA ({orderType === 'SUR_PLACE' ? '10%' : '5.5%'})</span>
              <span>{formatPrice(totalTVA)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="pos-recap-row" style={{ color: '#c8463d', fontWeight: 600 }}>
                <span>Remise appliquée (-{discountPercent}%)</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="pos-total-row">
              <span className="pos-total-label">TOTAL TTC</span>
              <span className="pos-total-amount">{formatPrice(totalTTC)}</span>
            </div>
          </div>

          <div className="pos-actions-grid">
            <button 
              className="pos-btn-clear" 
              onClick={handleClearTicket}
              disabled={ticketLines.length === 0}
            >
              Annuler
            </button>
            <button 
              className="pos-btn-checkout" 
              onClick={handleStartCheckout}
              disabled={ticketLines.length === 0}
            >
              <span>Encaisser</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Payment Modal --- */}
      <AnimatePresence>
        {payModalOpen && (
          <div className="modal-centered-wrapper">
            <motion.div 
              className="modal-centered-backdrop" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setPayModalOpen(false)} 
            />
            <motion.div 
              className="pos-pay-modal"
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="pos-pay-header">
                <div className="row gap-2">
                  <CreditCard size={20} />
                  <strong style={{ fontSize: 16 }}>Encaissement Comptoir</strong>
                </div>
                <button className="icon-btn-light" onClick={() => setPayModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="pos-pay-body">
                {/* Total Display Banner */}
                <div className="pos-pay-total-banner">
                  <div>
                    <span className="muted small">Montant de la note</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {orderType === 'SUR_PLACE' ? 'Sur place' : 'À emporter'} · {ticketLines.length} article(s)
                    </div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--green-900)', fontFamily: 'var(--font-display)' }}>
                    {formatPrice(totalTTC)}
                  </div>
                </div>

                {/* Method selector */}
                <div className="pos-pay-method-grid">
                  <button 
                    className={`pos-method-tile ${payMethod === 'CB' ? 'active' : ''}`}
                    onClick={() => setPayMethod('CB')}
                  >
                    <CreditCard size={20} />
                    <span>Carte (CB)</span>
                  </button>
                  <button 
                    className={`pos-method-tile ${payMethod === 'ESPECES' ? 'active' : ''}`}
                    onClick={() => setPayMethod('ESPECES')}
                  >
                    <Banknote size={20} />
                    <span>Espèces</span>
                  </button>
                  <button 
                    className={`pos-method-tile ${payMethod === 'TITRE_RESTO' ? 'active' : ''}`}
                    onClick={() => setPayMethod('TITRE_RESTO')}
                  >
                    <Tag size={20} />
                    <span>Titre Resto</span>
                  </button>
                  <button 
                    className={`pos-method-tile ${payMethod === 'MIXTE' ? 'active' : ''}`}
                    onClick={() => setPayMethod('MIXTE')}
                  >
                    <Percent size={20} />
                    <span>Mixte / Partage</span>
                  </button>
                </div>

                {/* Cash change calculator */}
                {payMethod === 'ESPECES' && (
                  <div className="pos-cash-calc-box">
                    <span className="eyebrow" style={{ fontSize: 11 }}>Calculateur de rendu de monnaie</span>
                    
                    <div className="pos-bills-grid">
                      <button className="pos-bill-btn" onClick={() => setCashReceived(totalTTC.toFixed(2))}>Exact</button>
                      <button className="pos-bill-btn" onClick={() => setCashReceived('15.00')}>15 €</button>
                      <button className="pos-bill-btn" onClick={() => setCashReceived('20.00')}>20 €</button>
                      <button className="pos-bill-btn" onClick={() => setCashReceived('30.00')}>30 €</button>
                      <button className="pos-bill-btn" onClick={() => setCashReceived('50.00')}>50 €</button>
                    </div>

                    <div className="row between" style={{ background: 'var(--paper)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}>
                      <span className="small muted">Montant reçu :</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={cashReceived} 
                        onChange={e => setCashReceived(e.target.value)}
                        style={{ border: 'none', textAlign: 'right', fontWeight: 800, fontSize: 18, width: 120, outline: 'none' }}
                      />
                    </div>

                    {parseFloat(cashReceived) >= totalTTC ? (
                      <div className="pos-change-banner">
                        <span>Monnaie à rendre :</span>
                        <span className="pos-change-val">
                          {formatPrice(parseFloat(cashReceived) - totalTTC)}
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: '#c8463d', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>
                        Montant insuffisant (manque {formatPrice(totalTTC - (parseFloat(cashReceived) || 0))})
                      </div>
                    )}
                  </div>
                )}

                {/* Mixed payment inputs */}
                {payMethod === 'MIXTE' && (
                  <div className="col gap-2" style={{ background: 'var(--cream)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                    <div className="row between">
                      <span className="small">Montant en Carte Bancaire (CB) :</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={splitCb} 
                        onChange={e => setSplitCb(e.target.value)}
                        style={{ width: 100, padding: 6, textAlign: 'right', borderRadius: 6, border: '1px solid var(--line)', fontWeight: 700 }}
                      />
                    </div>
                    <div className="row between" style={{ fontWeight: 700, paddingTop: 6, borderTop: '1px dashed var(--line)' }}>
                      <span className="small">Reste à payer en Espèces :</span>
                      <span>{formatPrice(Math.max(0, totalTTC - parseFloat(splitCb || 0)))}</span>
                    </div>
                  </div>
                )}

                {/* Validation CTA */}
                <button
                  className="btn btn-primary btn-block"
                  style={{ height: 50, fontSize: 16 }}
                  onClick={handleConfirmPayment}
                >
                  <Check size={18} strokeWidth={2.5} />
                  <span>Valider l'encaissement ({formatPrice(totalTTC)})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Checkout Success & Print Dialog --- */}
      <AnimatePresence>
        {completedOrder && (
          <div className="modal-centered-wrapper">
            <motion.div className="modal-centered-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div 
              className="thermal-preview-modal" 
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', maxWidth: 440, padding: 0 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="pos-success-box">
                <div className="pos-success-icon">
                  <CheckCircle2 size={38} strokeWidth={2.5} />
                </div>
                <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Ticket Encaissé avec Succès !</h3>
                <p className="muted small" style={{ margin: 0 }}>
                  Ticket <strong>#{completedOrder.id}</strong> · {completedOrder.paymentMethod}
                </p>

                <div className="col gap-2" style={{ width: '100%', marginTop: 12 }}>
                  <button 
                    className="btn btn-primary btn-block row gap-2"
                    style={{ height: 46 }}
                    onClick={() => {
                      setShowPrintModal(true);
                    }}
                  >
                    <Printer size={18} />
                    <span>Imprimer Ticket Client 80mm</span>
                  </button>

                  <button 
                    className="btn btn-ghost btn-block"
                    onClick={() => setCompletedOrder(null)}
                  >
                    Nouveau Ticket Suivant
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Native 80mm Thermal Receipt Print Modal --- */}
      {showPrintModal && completedOrder && (
        <TicketPrintModal 
          order={completedOrder} 
          onClose={() => setShowPrintModal(false)} 
        />
      )}

      {/* --- Cash Drawer & Movements Modal --- */}
      <AnimatePresence>
        {cashDrawerOpen && (
          <div className="modal-centered-wrapper">
            <motion.div className="modal-centered-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCashDrawerOpen(false)} />
            <motion.div 
              className="thermal-preview-modal" 
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', maxWidth: 480 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="row gap-2">
                  <Coins size={20} style={{ color: 'var(--gold)' }} />
                  <strong style={{ fontSize: 16 }}>Gestion du Tiroir-Caisse</strong>
                </div>
                <button className="icon-btn" onClick={() => setCashDrawerOpen(false)}><X size={18} /></button>
              </div>

              <div className="col gap-3">
                <div className="row between" style={{ background: 'var(--cream-2)', padding: 12, borderRadius: 8, border: '1px solid var(--line)' }}>
                  <div>
                    <span className="small muted">Fond de caisse initial :</span>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{formatPrice(cashFloat)}</div>
                  </div>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      const newFloat = prompt("Nouveau fond de caisse le matin (€) :", cashFloat.toString());
                      if (newFloat && !isNaN(parseFloat(newFloat))) {
                        setCashFloat(parseFloat(newFloat));
                        localStorage.setItem('hoya_pos_cash_float', newFloat);
                      }
                    }}
                  >
                    Modifier
                  </button>
                </div>

                <div className="row gap-2">
                  <button 
                    className="btn btn-sm btn-ghost grow"
                    onClick={() => {
                      const amount = prompt("Montant de l'apport d'espèces (€) :");
                      const label = prompt("Motif de l'apport :", "Apport monnaie banque");
                      if (amount && !isNaN(parseFloat(amount))) {
                        const move = { id: Date.now(), type: 'ENTREE', amount: parseFloat(amount), label, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
                        const updated = [move, ...cashMovements];
                        setCashMovements(updated);
                        localStorage.setItem('hoya_pos_cash_movements', JSON.stringify(updated));
                      }
                    }}
                  >
                    + Entrée espèces
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost grow"
                    onClick={() => {
                      const amount = prompt("Montant de la sortie d'espèces (€) :");
                      const label = prompt("Motif du retrait :", "Achat dépannage");
                      if (amount && !isNaN(parseFloat(amount))) {
                        const move = { id: Date.now(), type: 'SORTIE', amount: -parseFloat(amount), label, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
                        const updated = [move, ...cashMovements];
                        setCashMovements(updated);
                        localStorage.setItem('hoya_pos_cash_movements', JSON.stringify(updated));
                      }
                    }}
                  >
                    - Sortie espèces
                  </button>
                </div>

                <div className="scroll" style={{ maxHeight: 180, border: '1px solid var(--line)', borderRadius: 8, padding: 8 }}>
                  <span className="eyebrow" style={{ fontSize: 10 }}>Mouvements du jour ({cashMovements.length})</span>
                  {cashMovements.length === 0 ? (
                    <div className="muted small" style={{ textAlign: 'center', padding: 12 }}>Aucun mouvement enregistré aujourd'hui.</div>
                  ) : (
                    cashMovements.map(m => (
                      <div key={m.id} className="row between" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)', fontSize: 12 }}>
                        <div>
                          <strong>{m.label}</strong>
                          <div className="muted small">{m.time}</div>
                        </div>
                        <span style={{ fontWeight: 800, color: m.amount >= 0 ? 'var(--ok)' : '#c8463d' }}>
                          {m.amount >= 0 ? `+${formatPrice(m.amount)}` : formatPrice(m.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button className="btn btn-primary btn-block" onClick={() => setCashDrawerOpen(false)}>
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Tickets History Modal --- */}
      <AnimatePresence>
        {historyOpen && (
          <div className="modal-centered-wrapper">
            <motion.div className="modal-centered-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHistoryOpen(false)} />
            <motion.div 
              className="thermal-preview-modal" 
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', maxWidth: 540 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="row gap-2">
                  <History size={20} />
                  <strong style={{ fontSize: 16 }}>Journal des Ventes & Tickets</strong>
                </div>
                <button className="icon-btn" onClick={() => setHistoryOpen(false)}><X size={18} /></button>
              </div>

              <div className="scroll" style={{ maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {orders.map(ord => (
                  <div key={ord.id} className="card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="row gap-2">
                        <strong style={{ fontSize: 13 }}>Ticket #{ord.id}</strong>
                        <span className="tag" style={{ fontSize: 10 }}>{ord.time}</span>
                        <span className="tag tag-green" style={{ fontSize: 10 }}>{ord.paymentMethod || 'CB'}</span>
                      </div>
                      <span className="muted small">{ord.customerName} · {(ord.items || []).length} article(s)</span>
                    </div>

                    <div className="row gap-2">
                      <span style={{ fontWeight: 800, fontFamily: 'var(--font-display)' }}>{formatPrice(ord.total)}</span>
                      <button 
                        className="icon-btn" 
                        style={{ width: 32, height: 32 }}
                        onClick={() => {
                          setCompletedOrder(ord);
                          setShowPrintModal(true);
                        }}
                        title="Réimprimer le ticket"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => setHistoryOpen(false)}>
                Fermer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
