import React, { useState } from 'react';
import { 
  SlidersHorizontal, CheckCircle2, ShieldCheck, 
  Sparkles, Mail, UserCheck, AlertTriangle, RefreshCw 
} from 'lucide-react';
import { useStore } from '../../store';

export default function AdminFeaturesTab() {
  const { featuresConfig, setFeaturesConfig, loyaltyRules, setLoyaltyRules } = useStore();
  const [rulesState, setRulesState] = useState(() => ({
    stampsNeeded: loyaltyRules?.stampsNeeded || 10,
    rewardName: loyaltyRules?.rewardName || '11ᵉ bol offert',
    maxRewardValue: loyaltyRules?.maxRewardValue || 12.90,
    includeFormules: loyaltyRules?.includeFormules ?? true
  }));
  const [retentionYears, setRetentionYears] = useState(3);
  const [savedFeedback, setSavedFeedback] = useState('');

  const toggleFeature = (key) => {
    const next = { ...featuresConfig };
    if (key === 'accounts') {
      const willEnable = !next.accounts;
      next.accounts = willEnable;
      if (!willEnable) {
        // La fidélité requiert obligatoirement les comptes
        next.loyalty = false;
      }
    } else if (key === 'loyalty') {
      if (!featuresConfig.accounts) {
        alert('Le module Carte de fidélité requiert l\'activation préalable des Comptes clients.');
        return;
      }
      next.loyalty = !next.loyalty;
    } else if (key === 'emailing') {
      next.emailing = !next.emailing;
    }

    setFeaturesConfig(next);
    setSavedFeedback('Options enregistrées.');
    setTimeout(() => setSavedFeedback(''), 2500);
  };

  const handleSaveRules = () => {
    setLoyaltyRules(rulesState);
    setSavedFeedback('Règles de fidélité enregistrées.');
    setTimeout(() => setSavedFeedback(''), 2500);
  };

  return (
    <div className="col gap-4">
      {/* 1. Feature Flags Switcher */}
      <div className="card" style={{ padding: 22, background: '#fff' }}>
        <div className="row gap-2" style={{ marginBottom: 14 }}>
          <SlidersHorizontal size={20} style={{ color: 'var(--green-800)' }} />
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--green-900)' }}>
            Modules & Options du Restaurant (Feature Flags)
          </h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px 0', lineHeight: 1.5 }}>
          Activez ou désactivez chaque module vendu en option. Si un module est désactivé, <strong>aucune mention ni bouton n'apparaît côté client</strong> et le site fonctionne normalement en mode commande direct.
        </p>

        <div className="col gap-3">
          {/* Option 1 : Comptes Clients */}
          <div className="admin-feature-card">
            <div className="col gap-1">
              <div className="row gap-2">
                <UserCheck size={18} style={{ color: 'var(--green-800)', flexShrink: 0 }} />
                <strong style={{ fontSize: 14, color: 'var(--ink)' }}>Module 1 · Comptes Clients</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Connexion sans mot de passe (Magic Link), historique des commandes, bouton Recommander, adresses enregistrées.
              </span>
            </div>
            <button 
              className={`btn btn-sm ${featuresConfig?.accounts ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleFeature('accounts')}
              style={{ minWidth: 110 }}
            >
              {featuresConfig?.accounts ? 'Activé ✅' : 'Désactivé'}
            </button>
          </div>

          {/* Option 2 : Carte de Fidélité */}
          <div className="admin-feature-card" style={{ opacity: featuresConfig?.accounts ? 1 : 0.6 }}>
            <div className="col gap-1">
              <div className="row gap-2">
                <Sparkles size={18} style={{ color: 'var(--curry)', flexShrink: 0 }} />
                <strong style={{ fontSize: 14, color: 'var(--ink)' }}>Module 2 · Carte de Fidélité en ligne</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Grille 10 tampons, calcul automatique au paiement, bol offert à 0 €, fidélité comptoir en caisse. (Nécessite les comptes).
              </span>
            </div>
            <button 
              className={`btn btn-sm ${featuresConfig?.loyalty ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleFeature('loyalty')}
              disabled={!featuresConfig?.accounts}
              style={{ minWidth: 110 }}
            >
              {featuresConfig?.loyalty ? 'Activé ✅' : 'Désactivé'}
            </button>
          </div>

          {/* Option 3 : Fichier Clients & Emailing Resend */}
          <div className="admin-feature-card">
            <div className="col gap-1">
              <div className="row gap-2">
                <Mail size={18} style={{ color: '#1e40af', flexShrink: 0 }} />
                <strong style={{ fontSize: 14, color: 'var(--ink)' }}>Module 3 · Fichier Clients & Emailing (Resend)</strong>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Case consentement RGPD non cochée, campagnes marketing ciblées, respect quota journalier, désinscription 1-clic.
              </span>
            </div>
            <button 
              className={`btn btn-sm ${featuresConfig?.emailing ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleFeature('emailing')}
              style={{ minWidth: 110 }}
            >
              {featuresConfig?.emailing ? 'Activé ✅' : 'Désactivé'}
            </button>
          </div>
        </div>

        {savedFeedback && (
          <p style={{ color: 'var(--green-700)', fontSize: 13, fontWeight: 700, margin: '14px 0 0 0' }}>
            {savedFeedback}
          </p>
        )}
      </div>

      {/* 2. Paramètres des règles de fidélité */}
      {featuresConfig?.loyalty && (
        <div className="card" style={{ padding: 22, background: '#fff' }}>
          <div className="row gap-2" style={{ marginBottom: 14 }}>
            <Sparkles size={20} style={{ color: 'var(--curry)' }} />
            <h3 style={{ margin: 0, fontSize: 17, color: 'var(--green-900)' }}>
              Paramètres des règles de fidélité
            </h3>
          </div>

          <div className="admin-features-grid">
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Nombre de tampons requis pour la récompense :
              </label>
              <input 
                type="number" 
                min={1} 
                max={20}
                value={rulesState.stampsNeeded}
                onChange={e => setRulesState({ ...rulesState, stampsNeeded: parseInt(e.target.value, 10) || 10 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                Plafond de valeur du bol offert (€) :
              </label>
              <input 
                type="number" 
                step="0.10"
                value={rulesState.maxRewardValue}
                onChange={e => setRulesState({ ...rulesState, maxRewardValue: parseFloat(e.target.value) || 12.90 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={rulesState.includeFormules}
                onChange={e => setRulesState({ ...rulesState, includeFormules: e.target.checked })}
                style={{ accentColor: 'var(--green-800)' }}
              />
              <span>Attribuer également 1 tampon lors de l'achat d'une Formule Midi (bol + boisson/dessert)</span>
            </label>
          </div>

          <button className="btn btn-sm btn-primary" onClick={handleSaveRules} style={{ marginTop: 14 }}>
            Enregistrer les règles de fidélité
          </button>
        </div>
      )}

      {/* 3. Paramètres RGPD & Conservation */}
      <div className="card" style={{ padding: 22, background: '#fff' }}>
        <div className="row gap-2" style={{ marginBottom: 14 }}>
          <ShieldCheck size={20} style={{ color: 'var(--green-800)' }} />
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--green-900)' }}>
            Conformité RGPD & Durées de conservation
          </h3>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
          Conformément aux recommandations de la CNIL, les clients inactifs sans commande pendant plus de <strong>3 ans</strong> sont automatiquement purgés ou anonymisés.
        </p>

        <div className="admin-retention-row">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
              Délai d'inactivité avant anonymisation :
            </label>
            <select 
              value={retentionYears} 
              onChange={e => setRetentionYears(parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', fontSize: 13 }}
            >
              <option value={1}>1 an</option>
              <option value={2}>2 ans</option>
              <option value={3}>3 ans (Recommandé CNIL)</option>
              <option value={5}>5 ans</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={() => alert(`Règle appliquée : conservation fixée à ${retentionYears} ans.`)}
              style={{ height: 42 }}
            >
              Appliquer la durée
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
