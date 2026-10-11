import React from 'react';
import { motion } from 'framer-motion';
import { Printer, X, Check, Clock, Bike, ShoppingBag, MapPin, Phone, ArrowRight } from 'lucide-react';
import { formatPrice } from '../format';

export default function TicketPrintModal({ order, onClose, onAdvanceStatus }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePrintAndAdvance = () => {
    window.print();
    if (onAdvanceStatus) {
      setTimeout(() => {
        onAdvanceStatus(order.id, 'PREPARATION');
      }, 500);
    }
  };

  const isDelivery = order.type === 'LIVRAISON';

  return (
    <>
      {/* Background backdrop */}
      <motion.div
        className="thermal-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* On-screen Preview Dialog */}
      <motion.div
        className="thermal-preview-modal"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        {/* Header */}
        <div className="row between" style={{ padding: '16px 20px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
          <div className="row gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--green-700)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
              <Printer size={16} />
            </div>
            <div>
              <strong style={{ fontSize: 15 }}>Bon de Commande #{order.id}</strong>
              <div className="muted small" style={{ fontSize: 11 }}>Format standard ticket thermique 80mm</div>
            </div>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="scroll" style={{ padding: '20px', background: '#ece5da' }}>
          <div className="thermal-ticket">
            {/* Ticket Header */}
            <div className="thermal-ticket-header">
              <div className="thermal-ticket-title">HOYA POKÉ</div>
              <div style={{ fontSize: 11, color: '#444' }}>7 rue Anatole France, 34120 Pézenas</div>
              <div style={{ fontSize: 11, color: '#444' }}>Tél: 04 67 XX XX XX · hoyapoke.fr</div>
            </div>

            {/* Order Number & Type */}
            <div className="thermal-ticket-order">
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>COMMANDE #{order.id}</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Heure : {order.time}</div>
              </div>
              <div className="thermal-ticket-badge">
                {isDelivery ? 'LIVRAISON' : 'À EMPORTER'}
              </div>
            </div>

            {/* Client Info */}
            <div style={{ background: '#f5f5f5', padding: '8px 10px', borderRadius: 4, marginBottom: 12, fontSize: 12 }}>
              <div><strong>Client :</strong> {order.customerName}</div>
              <div><strong>Tél :</strong> {order.customerPhone}</div>
              {isDelivery && (
                <div style={{ marginTop: 4 }}>
                  <strong>Adresse livraison :</strong><br />
                  {order.address}
                </div>
              )}
            </div>

            {/* Items List */}
            <div style={{ borderTop: '1px dashed #000', paddingTop: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', marginBottom: 6 }}>
                ARTICLES À PRÉPARER :
              </div>
              {order.items.map((it, idx) => (
                <div key={idx} className="thermal-item">
                  <div className="thermal-item-title">
                    <span>1x {it.cartName || it.name}</span>
                    <span>{formatPrice(it.price)}</span>
                  </div>

                  {it.composition && it.composition.length > 0 && (
                    <div className="thermal-item-detail">
                      • {it.composition.join(', ')}
                    </div>
                  )}

                  {it.removedIngredients && it.removedIngredients.length > 0 && (
                    <div className="thermal-item-without">
                      ⚠ SANS : {it.removedIngredients.join(', ').toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total & Payment */}
            <div className="thermal-total">
              <span>TOTAL TTC</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4, fontWeight: 700 }}>
              <span>STATUT RÈGLEMENT :</span>
              <span>{order.paymentStatus === 'PAYÉ' ? 'PAYÉ EN LIGNE (CB)' : 'À ENCAISSER'}</span>
            </div>

            {/* Ticket Footer */}
            <div style={{ textAlign: 'center', borderTop: '1px dashed #888', marginTop: 14, paddingTop: 10, fontSize: 11 }}>
              <div>*** CUISINE & PRÉPARATION ***</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                Imprimé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="col gap-2" style={{ padding: '16px 20px', background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
          <div className="row gap-2">
            <button
              className="btn btn-primary grow row gap-2"
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Imprimer le Bon (AirPrint / USB)</span>
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Fermer
            </button>
          </div>

          {order.status === 'NOUVELLE' && onAdvanceStatus && (
            <button
              className="btn btn-sm btn-ghost row gap-1"
              style={{ justifyContent: 'center', fontSize: 12, color: 'var(--green-700)' }}
              onClick={handlePrintAndAdvance}
            >
              <span>Imprimer et passer en préparation</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Hidden Thermal Print Area (Printed directly via window.print) */}
      <div className="thermal-print-area">
        <div style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: '12px', lineHeight: 1.35, color: '#000' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>HOYA POKÉ</div>
            <div>7 rue Anatole France, 34120 Pézenas</div>
            <div>hoyapoke.fr</div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>COMMANDE #{order.id}</div>
            <div>TYPE : {isDelivery ? '*** LIVRAISON ***' : '*** A EMPORTER ***'}</div>
            <div>HEURE : {order.time}</div>
            <div>CLIENT : {order.customerName} ({order.customerPhone})</div>
            {isDelivery && <div>ADRESSE : {order.address}</div>}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ARTICLES :</div>
            {order.items.map((it, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold' }}>1x {it.cartName || it.name} - {formatPrice(it.price)}</div>
                {it.composition && it.composition.length > 0 && (
                  <div style={{ fontSize: '11px', paddingLeft: '8px' }}>• {it.composition.join(', ')}</div>
                )}
                {it.removedIngredients && it.removedIngredients.length > 0 && (
                  <div style={{ fontSize: '11px', fontWeight: 'bold', paddingLeft: '8px' }}>
                    SANS : {it.removedIngredients.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '2px dashed #000', paddingTop: '6px', marginTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL :</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              PAIEMENT : {order.paymentStatus === 'PAYÉ' ? 'PAYE EN LIGNE' : 'A ENCAISSER'}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
            --------------------------------<br />
            *** BON DE PREPARATION CUISINE ***<br />
            {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
    </>
  );
}
