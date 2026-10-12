import React, { useState, useMemo } from 'react';
import { 
  Search, Download, Plus, Minus, Gift, 
  CheckCircle2, XCircle, User, ShieldAlert, Sparkles, Filter 
} from 'lucide-react';
import { useStore } from '../../store';
import { loyaltyEngine } from '../../services/loyaltyEngine';
import { formatPrice } from '../../format';

export default function AdminClientsTab() {
  const { orders } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'OPTED_IN' | 'INACTIVE_30' | 'LOYAL_5'
  
  // Modal ajustement comptoir
  const [adjustModalClient, setAdjustModalClient] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Achat bol sur place au comptoir');
  const [adjustSuccess, setAdjustSuccess] = useState('');

  // 1. Extraire et agréger les clients depuis les commandes réelles et les profils
  const clientList = useMemo(() => {
    const map = new Map();

    orders.forEach(order => {
      const email = (order.customerEmail || order.customer_email || '').toLowerCase().trim();
      const phone = order.customerPhone || order.customer_phone || '';
      const key = email || phone || `client_${order.id}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: order.customerName || order.customer_name || 'Client',
          email: email || '—',
          phone: phone || '—',
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.created_at || order.time || 'Récemment',
          marketingConsent: Boolean(order.emailMarketingConsent || order.email_marketing_consent),
          stamps: 3 // Estimation ou lu depuis loyalty_cards
        });
      }

      const client = map.get(key);
      client.ordersCount += 1;
      client.totalSpent += Number(order.total || 0);
    });

    return Array.from(map.values());
  }, [orders]);

  // 2. Filtrage et Recherche
  const filteredClients = useMemo(() => {
    return clientList.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);

      if (!matchSearch) return false;

      if (filter === 'OPTED_IN') return c.marketingConsent;
      if (filter === 'LOYAL_5') return c.ordersCount >= 3;
      return true;
    });
  }, [clientList, search, filter]);

  // 3. Export CSV RGPD
  const handleExportCsv = () => {
    const headers = ['Nom', 'Email', 'Telephone', 'Nombre_Commandes', 'Total_Depense_EUR', 'OptIn_Marketing', 'Derniere_Commande'];
    const rows = filteredClients.map(c => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      c.ordersCount,
      c.totalSpent.toFixed(2),
      c.marketingConsent ? 'OUI' : 'NON',
      `"${c.lastOrderDate}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hoya-poke-fichier-clients-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Exécuter un ajustement fidélité au comptoir
  const handleExecuteAdjust = async () => {
    if (!adjustReason.trim()) {
      alert('Veuillez indiquer un motif obligatoire pour l\'audit caisse.');
      return;
    }

    try {
      await loyaltyEngine.manualAdjustStamps(adjustModalClient.id, adjustDelta, adjustReason.trim(), '1234');
      setAdjustSuccess(`Ajustement enregistré (${adjustDelta > 0 ? '+' : ''}${adjustDelta} tampon(s)).`);
      setTimeout(() => {
        setAdjustSuccess('');
        setAdjustModalClient(null);
      }, 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="col gap-4">
      {/* Top Controls */}
      <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="row gap-2 grow" style={{ maxWidth: 400 }}>
          <div className="search-box grow" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, téléphone, email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid var(--line)', background: '#fff' }}
            />
          </div>
        </div>

        <div className="row gap-2">
          {/* Filtres */}
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid var(--line)', background: '#fff', fontSize: 13, fontWeight: 600 }}
          >
            <option value="ALL">Tous les clients ({clientList.length})</option>
            <option value="OPTED_IN">Abonnés Newsletter</option>
            <option value="LOYAL_5">Clients réguliers (3+ commandes)</option>
          </select>

          <button 
            className="btn btn-sm btn-ghost" 
            onClick={handleExportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
            title="Exporter la liste filtrée au format CSV pour Excel"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Clients */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Client</th>
                <th style={{ padding: '12px 16px' }}>Coordonnées</th>
                <th style={{ padding: '12px 16px' }}>Commandes</th>
                <th style={{ padding: '12px 16px' }}>Total Dépensé</th>
                <th style={{ padding: '12px 16px' }}>Opt-in Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Fidélité Comptoir</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                    Aucun client trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--ink)' }}>
                      <div className="row gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cream)', display: 'grid', placeItems: 'center', color: 'var(--green-800)' }}>
                          <User size={16} />
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div>{c.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                      {c.ordersCount} commande{c.ordersCount > 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--green-900)' }}>
                      {formatPrice(c.totalSpent)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.marketingConsent ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 700, fontSize: 11, background: '#dcfce7', padding: '3px 8px', borderRadius: 20 }}>
                          <CheckCircle2 size={12} /> Abonné
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6b7280', fontSize: 11, background: '#f3f4f6', padding: '3px 8px', borderRadius: 20 }}>
                          Non abonné
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => setAdjustModalClient(c)}
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        <Sparkles size={13} style={{ color: 'var(--curry)', marginRight: 4 }} />
                        Gérer tampons
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajustement Fidélité au comptoir */}
      {adjustModalClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: 'var(--green-900)' }}>
              Ajustement Fidélité Comptoir
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px 0' }}>
              Client : <strong>{adjustModalClient.name}</strong> ({adjustModalClient.phone || adjustModalClient.email})
            </p>

            <div className="col gap-3">
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Nombre de tampons à ajuster :
                </label>
                <div className="row gap-2">
                  <button 
                    className={`btn btn-sm ${adjustDelta === 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAdjustDelta(1)}
                  >
                    +1 Tampon (1 bol)
                  </button>
                  <button 
                    className={`btn btn-sm ${adjustDelta === 2 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAdjustDelta(2)}
                  >
                    +2 Tampons (2 bols)
                  </button>
                  <button 
                    className={`btn btn-sm ${adjustDelta === -10 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAdjustDelta(-10)}
                  >
                    Utiliser 1 récompense (-10)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Motif d'ajustement (journalisé dans l'audit) :
                </label>
                <input 
                  type="text" 
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ex: Achat bol sur place en espèces au comptoir"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 13 }}
                />
              </div>

              {adjustSuccess && (
                <p style={{ color: 'var(--green-700)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {adjustSuccess}
                </p>
              )}

              <div className="row end gap-2" style={{ marginTop: 12 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => setAdjustModalClient(null)}>
                  Annuler
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleExecuteAdjust}>
                  Valider l'ajustement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
