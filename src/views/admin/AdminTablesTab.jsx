import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Plus, Trash2, RefreshCw, Printer, Check, X, 
  ExternalLink, QrCode, AlertCircle, ShieldCheck, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';
import { useStore } from '../../store';
import { generateTableToken } from '../../services/tableService';
import HoyaMark from '../../components/brand/HoyaMark';

export default function AdminTablesTab() {
  const { tables, tablesConfig, updateTables, updateTablesConfig } = useStore();
  const [newTableName, setNewTableName] = useState('');
  const [newTableZone, setNewTableZone] = useState('Salle');
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState({});

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hoyapoke.fr';

  // Generate QR Code data URLs for all tables
  useEffect(() => {
    let isMounted = true;
    const generateAllQr = async () => {
      const urls = {};
      for (const t of tables) {
        try {
          const tableUrl = `${baseUrl}/t/${t.token}`;
          const dataUrl = await QRCode.toDataURL(tableUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f1a14',
              light: '#ffffff'
            }
          });
          urls[t.id] = dataUrl;
        } catch (e) {
          console.error('Error generating QR code for', t.name, e);
        }
      }
      if (isMounted) setQrCodeDataUrls(urls);
    };

    generateAllQr();
    return () => { isMounted = false; };
  }, [tables, baseUrl]);

  // Handlers
  const handleToggleGlobal = () => {
    updateTablesConfig({
      ...tablesConfig,
      enabled: !tablesConfig.enabled
    });
  };

  const handlePaymentModeChange = (mode) => {
    updateTablesConfig({
      ...tablesConfig,
      paymentMode: mode
    });
  };

  const handleMaxOrdersChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 1 && val <= 10) {
      updateTablesConfig({
        ...tablesConfig,
        maxUnpaidOrdersPerTable: val
      });
    }
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    const id = `tbl-${Date.now()}`;
    const prefix = newTableZone.toLowerCase().includes('terrasse') ? 'tr' : 't';
    const token = generateTableToken(prefix);

    const newTable = {
      id,
      name: newTableName.trim(),
      token,
      zone: newTableZone,
      isActive: true
    };

    updateTables([...tables, newTable]);
    setNewTableName('');
  };

  const handleToggleTableActive = (tableId) => {
    const next = tables.map(t => t.id === tableId ? { ...t, isActive: !t.isActive } : t);
    updateTables(next);
  };

  const handleRegenerateToken = (tableId) => {
    if (!confirm('Régénérer le QR Code de cette table ? L’ancien QR code ne fonctionnera plus immédiatement.')) return;
    const next = tables.map(t => {
      if (t.id === tableId) {
        const prefix = (t.name || '').toLowerCase().includes('terrasse') ? 'tr' : 't';
        return { ...t, token: generateTableToken(prefix) };
      }
      return t;
    });
    updateTables(next);
  };

  const handleDeleteTable = (tableId) => {
    if (!confirm('Supprimer cette table définitivement ?')) return;
    const next = tables.filter(t => t.id !== tableId);
    updateTables(next);
  };

  return (
    <div className="scroll" style={{ padding: '24px' }}>
      {/* 1. Global Controls Banner */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 20, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="row gap-2">
              <QrCode size={22} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ fontSize: 18, margin: 0 }}>Commande à Table par QR Code</h2>
            </div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Les clients scannent le chevalet de table, commandent et choisissent leur mode de règlement.
            </p>
          </div>

          <div className="row gap-2">
            <button 
              className={`btn btn-sm ${tablesConfig.enabled ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleToggleGlobal}
              style={{ fontWeight: 700 }}
            >
              {tablesConfig.enabled ? '● Service Actif' : '○ Service Suspendu'}
            </button>

            <button 
              className="btn btn-sm btn-ghost"
              onClick={() => setShowPrintSheet(true)}
              style={{ gap: 6 }}
            >
              <Printer size={15} />
              <span>Planche A4 Chevalets QR</span>
            </button>
          </div>
        </div>

        <div className="divider" style={{ margin: '16px 0' }} />

        {/* Global Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Modes de règlement autorisés</label>
            <select 
              className="input" 
              value={tablesConfig.paymentMode || 'BOTH'} 
              onChange={(e) => handlePaymentModeChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
            >
              <option value="BOTH">Au choix (CB en ligne & Comptoir)</option>
              <option value="ONLINE">Paiement CB en ligne seul</option>
              <option value="COMPTOIR">Paiement au comptoir seul</option>
            </select>
          </div>

          <div>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Limite anti-spam (commandes en cours / table)</label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              className="input"
              value={tablesConfig.maxUnpaidOrdersPerTable || 3}
              onChange={handleMaxOrdersChange}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
            />
          </div>
        </div>
      </div>

      {/* 2. Add New Table Card */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 18, marginBottom: 24 }}>
        <form onSubmit={handleAddTable} className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Ex: Table 7, Terrasse 5..." 
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8 }}
            />
          </div>

          <div style={{ width: 140 }}>
            <select 
              className="input" 
              value={newTableZone}
              onChange={(e) => setNewTableZone(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8 }}
            >
              <option value="Salle">Salle</option>
              <option value="Terrasse">Terrasse</option>
              <option value="Bar">Bar</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', height: 40 }}>
            <Plus size={16} /> Ajouter la table
          </button>
        </form>
      </div>

      {/* 3. Tables List Table */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '12px 16px' }}>QR Code</th>
                <th style={{ padding: '12px 16px' }}>Nom</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px' }}>Lien direct</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 16px', width: 64 }}>
                    {qrCodeDataUrls[t.id] ? (
                      <img 
                        src={qrCodeDataUrls[t.id]} 
                        alt={t.name} 
                        style={{ width: 44, height: 44, borderRadius: 6, border: '1px solid var(--line)' }} 
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, background: '#eee', borderRadius: 6 }} />
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <strong style={{ fontSize: 14 }}>{t.name}</strong>
                    <div className="muted small" style={{ fontSize: 11 }}>Jeton : {t.token}</div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button 
                      onClick={() => handleToggleTableActive(t.id)}
                      className={`tag ${t.isActive ? 'tag-green' : 'tag-muted'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {t.isActive ? 'Active' : 'Désactivée'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <a 
                      href={`/t/${t.token}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="row gap-1"
                      style={{ color: 'var(--green-700)', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}
                    >
                      <span>/t/{t.token}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <div className="row gap-1" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        title="Régénérer le jeton de sécurité"
                        onClick={() => handleRegenerateToken(t.id)}
                        style={{ padding: '4px 8px' }}
                      >
                        <RefreshCw size={13} /> Régénérer
                      </button>
                      <button 
                        className="icon-btn" 
                        title="Supprimer la table"
                        onClick={() => handleDeleteTable(t.id)}
                        style={{ width: 30, height: 30, color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Printable A4 QR Code Sheet */}
      {showPrintSheet && (
        <div className="modal-centered-wrapper" style={{ zIndex: 10000 }}>
          <div className="modal-centered-backdrop" onClick={() => setShowPrintSheet(false)} />
          <div 
            style={{ 
              position: 'relative', 
              zIndex: 10001, 
              background: '#fff', 
              borderRadius: 16, 
              width: '95%', 
              maxWidth: 900, 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              padding: 24 
            }}
          >
            <div className="row between" style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, margin: 0 }}>Planche A4 — Chevalets QR Codes</h2>
                <p className="muted small" style={{ margin: '4px 0 0' }}>Prêt à imprimer et découper pour disposer sur les tables du restaurant.</p>
              </div>
              <div className="row gap-2">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimer la planche
                </button>
                <button className="icon-btn" onClick={() => setShowPrintSheet(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div 
              id="qr-print-area" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: 20 
              }}
            >
              {tables.filter(t => t.isActive).map(t => (
                <div 
                  key={t.id} 
                  style={{ 
                    border: '2px dashed #0f1a14', 
                    borderRadius: 16, 
                    padding: 24, 
                    textAlign: 'center', 
                    background: '#faf8f5',
                    pageBreakInside: 'avoid'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <HoyaMark size={24} />
                    <strong style={{ fontSize: 16, letterSpacing: 0.5 }}>HOYA POKÉ</strong>
                  </div>
                  <h1 style={{ fontSize: 28, margin: '6px 0 12px', fontWeight: 900, color: '#0f1a14' }}>
                    {t.name}
                  </h1>

                  {qrCodeDataUrls[t.id] && (
                    <img 
                      src={qrCodeDataUrls[t.id]} 
                      alt={`QR Code ${t.name}`} 
                      style={{ width: 180, height: 180, margin: '0 auto', display: 'block', borderRadius: 12, border: '1px solid #e0ded9' }}
                    />
                  )}

                  <p style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 4px', color: '#1b382b' }}>
                    Scannez pour commander & payer
                  </p>
                  <span style={{ fontSize: 11, color: '#6f7872', display: 'block' }}>
                    Service direct à votre table · Frais & Fait minute
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
