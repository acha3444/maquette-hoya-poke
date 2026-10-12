import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, X, Check, ShieldCheck, TrendingUp, ShoppingBag, 
  CreditCard, Banknote, Bike, Utensils, Calendar, Clock, 
  Archive, FileText, ChevronRight, QrCode, Tv
} from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';

export default function CaisseClotureModal({ onClose }) {
  const { orders, caisseHistory, saveCaisseCloture } = useStore();
  const [activeTab, setActiveTab] = useState('recap'); // 'recap' | 'articles' | 'historique'
  const [archived, setArchived] = useState(false);

  // Compute Daily Statistics
  const validOrders = orders.filter(o => o.status !== 'REFUSEE');
  const finishedOrders = validOrders.filter(o => o.status === 'TERMINEE');
  const totalCA = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const orderCount = validOrders.length;
  const panierMoyen = orderCount > 0 ? (totalCA / orderCount) : 0;

  // Payments breakdown
  const onlineOrders = validOrders.filter(o => o.paymentStatus === 'PAYÉ');
  const onlineTotal = onlineOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const onSiteOrders = validOrders.filter(o => o.paymentStatus !== 'PAYÉ');
  const onSiteTotal = onSiteOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const onSiteComptoir = onSiteOrders.filter(o => o.type !== 'LIVRAISON');
  const onSiteComptoirTotal = onSiteComptoir.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const onSiteLivreur = onSiteOrders.filter(o => o.type === 'LIVRAISON');
  const onSiteLivreurTotal = onSiteLivreur.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Channel breakdown
  const tableOrders = validOrders.filter(o => o.source === 'TABLE' || Boolean(o.tableName));
  const tableTotal = tableOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const kioskOrders = validOrders.filter(o => o.source === 'BORNE' || Boolean(o.kioskId) || String(o.id).startsWith('B-'));
  const kioskTotal = kioskOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const deliveryOrders = validOrders.filter(o => o.type === 'LIVRAISON');
  const deliveryTotal = deliveryOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveryFeesTotal = deliveryOrders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);

  const takeawayOrders = validOrders.filter(o => o.type !== 'LIVRAISON' && o.source !== 'TABLE' && o.source !== 'BORNE' && !o.tableName && !o.kioskId && !String(o.id).startsWith('B-'));
  const takeawayTotal = takeawayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Item sales breakdown
  const itemMap = {};
  validOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const name = it.cartName || it.name || 'Article';
      if (!itemMap[name]) {
        itemMap[name] = { count: 0, revenue: 0, price: it.price || 0 };
      }
      itemMap[name].count += 1;
      itemMap[name].revenue += (it.price || 0);
    });
  });
  const itemSales = Object.entries(itemMap).sort((a, b) => b[1].count - a[1].count);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  const handleCloturer = () => {
    if (archived) return;
    const clotureRecord = {
      id: String(Date.now()),
      dateStr: `${dateFormatted} à ${timeFormatted}`,
      timestamp: Date.now(),
      totalCA,
      orderCount,
      panierMoyen,
      onlineTotal,
      onSiteTotal,
      onSiteComptoirTotal,
      onSiteLivreurTotal,
      deliveryTotal,
      takeawayTotal
    };
    saveCaisseCloture(clotureRecord);
    setArchived(true);
  };

  return (
    <>
      <div className="modal-centered-wrapper">
        <motion.div
          className="modal-centered-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="thermal-preview-modal"
          style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', maxWidth: 540 }}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          {/* Header */}
          <div className="row between" style={{ padding: '16px 20px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
            <div className="row gap-2">
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--green-700)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                <FileText size={18} />
              </div>
              <div>
                <strong style={{ fontSize: 16 }}>Clôture de Caisse · Ticket Z</strong>
                <div className="row gap-1 muted small" style={{ fontSize: 11 }}>
                  <ShieldCheck size={12} style={{ color: 'var(--green-700)' }} />
                  <span>Accès Manager sécurisé · {timeFormatted}</span>
                </div>
              </div>
            </div>
            <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          {/* Subheader Navigation Tabs */}
          <div className="tabs" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '0 16px' }}>
            <button className={activeTab === 'recap' ? 'active' : ''} onClick={() => setActiveTab('recap')}>
              Récapitulatif & Caisse
            </button>
            <button className={activeTab === 'articles' ? 'active' : ''} onClick={() => setActiveTab('articles')}>
              Articles ({itemSales.length})
            </button>
            <button className={activeTab === 'historique' ? 'active' : ''} onClick={() => setActiveTab('historique')}>
              Historique ({caisseHistory.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="scroll" style={{ padding: '20px', maxHeight: '65vh', background: 'var(--cream-2)' }}>
            {activeTab === 'recap' && (
              <div className="col gap-4">
                {/* Highlight Stats Banner */}
                <div style={{ background: 'var(--paper)', padding: 18, borderRadius: 'var(--r)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="row between" style={{ alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <span className="eyebrow" style={{ color: 'var(--green-700)' }}>Chiffre d'Affaires Total (TTC)</span>
                      <h1 className="price" style={{ fontSize: 32, margin: '4px 0 0', color: 'var(--ink)' }}>{formatPrice(totalCA)}</h1>
                    </div>
                    <span className="tag tag-green" style={{ fontSize: 12, padding: '4px 8px' }}>
                      {orderCount} commande{orderCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <div style={{ background: 'var(--cream-2)', padding: '10px 12px', borderRadius: 'var(--r-sm)' }}>
                      <span className="muted small">Panier Moyen</span>
                      <strong style={{ display: 'block', fontSize: 16 }}>{formatPrice(panierMoyen)}</strong>
                    </div>
                    <div style={{ background: 'var(--gold-soft)', padding: '10px 12px', borderRadius: 'var(--r-sm)' }}>
                      <span className="small" style={{ color: 'var(--gold-ink)' }}>Espèces / Sur place à compter</span>
                      <strong style={{ display: 'block', fontSize: 16, color: 'var(--gold-ink)' }}>{formatPrice(onSiteTotal)}</strong>
                    </div>
                  </div>
                </div>

                {/* Ventilation Encaissements */}
                <div style={{ background: 'var(--paper)', padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
                  <h3 className="eyebrow" style={{ marginBottom: 12 }}>Ventilation des Règlements</h3>
                  <div className="col gap-2">
                    <div className="row between" style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--cream-2)' }}>
                      <div className="row gap-2">
                        <CreditCard size={16} style={{ color: 'var(--green-700)' }} />
                        <div>
                          <strong style={{ fontSize: 13 }}>Paiements en Ligne (CB / Apple Pay)</strong>
                          <div className="muted small">{onlineOrders.length} commande{onlineOrders.length > 1 ? 's' : ''} encaissée{onlineOrders.length > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <strong className="price" style={{ fontSize: 15 }}>{formatPrice(onlineTotal)}</strong>
                    </div>

                    <div className="row between" style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--gold-soft)' }}>
                      <div className="row gap-2">
                        <Banknote size={16} style={{ color: 'var(--gold-ink)' }} />
                        <div>
                          <strong style={{ fontSize: 13, color: 'var(--gold-ink)' }}>Sur Place · Comptoir (CB / Espèces)</strong>
                          <div className="small" style={{ color: 'var(--gold-ink)', opacity: 0.8 }}>{onSiteComptoir.length} commande{onSiteComptoir.length > 1 ? 's' : ''} au retrait</div>
                        </div>
                      </div>
                      <strong className="price" style={{ fontSize: 15, color: 'var(--gold-ink)' }}>{formatPrice(onSiteComptoirTotal)}</strong>
                    </div>

                    <div className="row between" style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--cream-2)' }}>
                      <div className="row gap-2">
                        <Bike size={16} className="muted" />
                        <div>
                          <strong style={{ fontSize: 13 }}>Sur Place · Remise Livreur</strong>
                          <div className="muted small">{onSiteLivreur.length} commande{onSiteLivreur.length > 1 ? 's' : ''} en livraison</div>
                        </div>
                      </div>
                      <strong className="price" style={{ fontSize: 15 }}>{formatPrice(onSiteLivreurTotal)}</strong>
                    </div>
                  </div>
                </div>

                {/* Ventilation Canaux */}
                <div style={{ background: 'var(--paper)', padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
                  <h3 className="eyebrow" style={{ marginBottom: 12 }}>Canaux de Vente</h3>
                  <div className="col gap-2">
                    <div className="row between small">
                      <span className="row gap-2"><ShoppingBag size={14} className="muted" /> Ventes Web / Caisse Comptoir ({takeawayOrders.length})</span>
                      <strong className="tnum">{formatPrice(takeawayTotal)}</strong>
                    </div>
                    <div className="row between small">
                      <span className="row gap-2" style={{ color: 'var(--green-700)', fontWeight: 600 }}><Tv size={14} /> Borne Tactile Kiosque ({kioskOrders.length})</span>
                      <strong className="tnum" style={{ color: 'var(--green-700)' }}>{formatPrice(kioskTotal)}</strong>
                    </div>
                    <div className="row between small">
                      <span className="row gap-2" style={{ color: '#5d4766', fontWeight: 600 }}><QrCode size={14} /> Commandes à Table QR ({tableOrders.length})</span>
                      <strong className="tnum" style={{ color: '#5d4766' }}>{formatPrice(tableTotal)}</strong>
                    </div>
                    <div className="row between small">
                      <span className="row gap-2"><Bike size={14} className="muted" /> Livraisons à Domicile ({deliveryOrders.length})</span>
                      <strong className="tnum">{formatPrice(deliveryTotal)}</strong>
                    </div>
                    {deliveryFeesTotal > 0 && (
                      <div className="row between small muted" style={{ paddingLeft: 22 }}>
                        <span>Dont frais de livraison perçus</span>
                        <span className="tnum">+{formatPrice(deliveryFeesTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date info footer */}
                <div className="muted small" style={{ textAlign: 'center' }}>
                  Établi pour le service du {dateFormatted} · Hoya Poké Pézenas
                </div>
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="col gap-3">
                <div style={{ background: 'var(--paper)', padding: 14, borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
                  <span className="eyebrow">Détail des Ventes par Produit</span>
                  <div className="col gap-2" style={{ marginTop: 10 }}>
                    {itemSales.length === 0 ? (
                      <p className="muted small" style={{ textAlign: 'center', padding: 20 }}>Aucun article vendu aujourd'hui.</p>
                    ) : (
                      itemSales.map(([name, data], idx) => (
                        <div key={idx} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                          <div className="col">
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
                            <span className="muted small">{data.count} vendus</span>
                          </div>
                          <span className="price small">{formatPrice(data.revenue)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historique' && (
              <div className="col gap-3">
                {caisseHistory.length === 0 ? (
                  <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 'var(--r)', textAlign: 'center' }}>
                    <p className="muted small">Aucune clôture archivée pour le moment. Cliquez sur "Clôturer la journée" ci-dessous pour archiver ce bilan.</p>
                  </div>
                ) : (
                  caisseHistory.map((rec) => (
                    <div key={rec.id} style={{ background: 'var(--paper)', padding: 14, borderRadius: 'var(--r)', border: '1px solid var(--line)' }}>
                      <div className="row between">
                        <div>
                          <strong style={{ fontSize: 14 }}>{rec.dateStr}</strong>
                          <div className="muted small">{rec.orderCount} commandes · Panier moy. {formatPrice(rec.panierMoyen)}</div>
                        </div>
                        <strong className="price" style={{ fontSize: 16, color: 'var(--green-700)' }}>{formatPrice(rec.totalCA)}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="col gap-2" style={{ padding: '16px 20px', background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
            <div className="row gap-2">
              <button
                className="btn btn-primary grow row gap-2"
                onClick={handlePrint}
                style={{ justifyContent: 'center' }}
              >
                <Printer size={16} />
                <span>Imprimer le Ticket Z (80mm)</span>
              </button>
              <button className="btn btn-ghost" onClick={onClose}>
                Fermer
              </button>
            </div>

            <div className="row between" style={{ marginTop: 4 }}>
              <button
                className="btn btn-sm btn-ghost row gap-1"
                style={{ color: archived ? 'var(--ok)' : 'var(--muted)', fontSize: 12 }}
                onClick={handleCloturer}
                disabled={archived}
              >
                {archived ? <Check size={14} /> : <Archive size={14} />}
                <span>{archived ? 'Clôture archivée avec succès ✓' : 'Archiver la clôture de cette journée'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Hidden Thermal Print Receipt for 80mm roll printer */}
      <div className="thermal-print-area">
        <div style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '12px', lineHeight: 1.35, color: '#000' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>HOYA POKÉ</div>
            <div>7 Rue Anatole France, 34120 Pézenas</div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>Tél: 04 67 21 42 98 · SIREN 981 349 723</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px' }}>*** CLOTURE DE CAISSE (TICKET Z) ***</div>
            <div style={{ fontSize: '11px' }}>Date : {dateFormatted} {timeFormatted}</div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
              <span>TOTAL CA JOURNEE (TTC) :</span>
              <span>{formatPrice(totalCA)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
              <span>Nombre de commandes :</span>
              <span>{orderCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
              <span>Panier moyen :</span>
              <span>{formatPrice(panierMoyen)}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>VENTILATION REGLEMENTS :</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CB EN LIGNE / WEB :</span>
              <span>{formatPrice(onlineTotal)} ({onlineOrders.length})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUR PLACE / COMPTOIR :</span>
              <span>{formatPrice(onSiteComptoirTotal)} ({onSiteComptoir.length})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUR PLACE / LIVREURS :</span>
              <span>{formatPrice(onSiteLivreurTotal)} ({onSiteLivreur.length})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px dotted #000', paddingTop: '4px' }}>
              <span>TOTAL ESPECES/SUR PLACE :</span>
              <span>{formatPrice(onSiteTotal)}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CANAUX DE VENTE :</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>A EMPORTER / RETRAIT :</span>
              <span>{formatPrice(takeawayTotal)} ({takeawayOrders.length})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LIVRAISONS :</span>
              <span>{formatPrice(deliveryTotal)} ({deliveryOrders.length})</span>
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>DETAIL ARTICLES VENDUS :</div>
            {itemSales.map(([name, data], idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                <span>{data.count}x {name}</span>
                <span>{formatPrice(data.revenue)}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', borderTop: '2px dashed #000', paddingTop: '8px', marginTop: '10px', fontSize: '10px' }}>
            --------------------------------<br />
            SIGNATURE DU RESPONSABLE :<br /><br /><br />
            ................................<br />
            *** FIN DE SERVICE HOYA POKE ***
          </div>
        </div>
      </div>
    </>
  );
}
