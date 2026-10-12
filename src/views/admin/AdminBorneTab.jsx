import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tv, ExternalLink, Settings, ShieldCheck, Clock, 
  CreditCard, Banknote, Sparkles, AlertCircle, Smartphone, Check
} from 'lucide-react';
import { useStore } from '../../store';
import { getKioskDeviceId, setKioskDeviceId } from '../../services/kioskService';

export default function AdminBorneTab() {
  const navigate = useNavigate();
  const { kioskConfig, updateKioskConfig } = useStore();
  const [deviceId, setDeviceIdState] = useState(getKioskDeviceId());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleToggleKiosk = () => {
    updateKioskConfig({
      ...kioskConfig,
      enabled: !kioskConfig.enabled
    });
  };

  const handleUpdate = (patch) => {
    updateKioskConfig({
      ...kioskConfig,
      ...patch
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleSaveDeviceId = (e) => {
    e.preventDefault();
    setKioskDeviceId(deviceId);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="scroll" style={{ padding: '24px' }}>
      {/* 1. Header & Launch Card */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 20, marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="row gap-2">
              <Tv size={22} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ fontSize: 18, margin: 0 }}>Borne de Commande Tactile (/borne)</h2>
            </div>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              Mode kiosque autonome pour tablette 10"-13" installée dans le restaurant.
            </p>
          </div>

          <div className="row gap-2">
            <button 
              className={`btn btn-sm ${kioskConfig.enabled ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleToggleKiosk}
              style={{ fontWeight: 700 }}
            >
              {kioskConfig.enabled ? '● Borne Active' : '○ Borne Désactivée'}
            </button>

            <button 
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/borne')}
              style={{ gap: 6 }}
            >
              <ExternalLink size={15} />
              <span>Lancer la Borne</span>
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="row gap-1" style={{ color: '#059669', fontSize: 12, fontWeight: 700, marginTop: 10 }}>
            <Check size={14} /> Modifications enregistrées et synchronisées en temps réel !
          </div>
        )}
      </div>

      {/* 2. Configuration Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Device ID Settings */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 18 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Identifiant de la tablette</span>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Permet de distinguer plusieurs bornes sur l'écran cuisine (ex: Borne 1, Borne 2).
          </p>
          <form onSubmit={handleSaveDeviceId} className="row gap-2">
            <input 
              type="text" 
              className="input" 
              value={deviceId}
              onChange={(e) => setDeviceIdState(e.target.value)}
              placeholder="Ex: Borne 1"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8 }}
            />
            <button type="submit" className="btn btn-sm btn-ghost">
              Valider
            </button>
          </form>
        </div>

        {/* Inactivity Timeout */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 18 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Délai d'inactivité (Écran de veille)</span>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Temps sans toucher l'écran avant d'afficher l'alerte de retour automatique à l'accueil.
          </p>
          <select 
            className="input" 
            value={kioskConfig.idleTimeout || 60}
            onChange={(e) => handleUpdate({ idleTimeout: parseInt(e.target.value, 10) })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
          >
            <option value={30}>30 secondes</option>
            <option value={45}>45 secondes</option>
            <option value={60}>60 secondes (Recommandé)</option>
            <option value={90}>90 secondes</option>
            <option value={120}>2 minutes</option>
          </select>
        </div>

        {/* Preparation Timing */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 18 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Déclenchement de la préparation</span>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Quand la commande doit-elle apparaître sur l'écran cuisine ?
          </p>
          <select 
            className="input" 
            value={kioskConfig.prepTiming || 'BEFORE_PAYMENT'}
            onChange={(e) => handleUpdate({ prepTiming: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
          >
            <option value="BEFORE_PAYMENT">Immédiatement dès validation borne (Gain de temps)</option>
            <option value="AFTER_PAYMENT">Seulement après encaissement au comptoir</option>
          </select>
        </div>

        {/* Payment Modes */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 18 }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>Paiement sur la borne</span>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Mode proposé aux clients en fin de parcours.
          </p>
          <select 
            className="input" 
            value={kioskConfig.paymentModes || 'COMPTOIR'}
            onChange={(e) => handleUpdate({ paymentModes: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8 }}
          >
            <option value="COMPTOIR">Payer au comptoir (Ticket B-XXX généré, statut À encaisser)</option>
            <option value="BOTH">Au choix : TPE CB Borne & Comptoir</option>
          </select>
        </div>
      </div>

      {/* 3. Setup Guide Box for Hardware Tablet */}
      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', padding: 20 }}>
        <h3 style={{ fontSize: 16, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Smartphone size={18} style={{ color: 'var(--green-700)' }} />
          <span>Guide d'installation tablette en salle (Accès Verrouillé)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 12 }}>
            <strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Sur iPad (Apple iOS)</strong>
            <ol style={{ fontSize: 12, lineHeight: 1.6, paddingLeft: 18, margin: 0, color: 'var(--ink)' }}>
              <li>Ouvrez Safari et allez sur <code>/borne</code>.</li>
              <li>Touchez <strong>Partager</strong> → <strong>Sur l'écran d'accueil</strong>.</li>
              <li>Allez dans Réglages iPad → <strong>Accessibilité</strong> → <strong>Accès guidé</strong> (Activez-le).</li>
              <li>Lancez l'icône Hoya Borne, appuyez <strong>3 fois sur le bouton Marche</strong> pour verrouiller la tablette.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 12 }}>
            <strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Sur Tablette Android</strong>
            <ol style={{ fontSize: 12, lineHeight: 1.6, paddingLeft: 18, margin: 0, color: 'var(--ink)' }}>
              <li>Ouvrez Chrome et allez sur <code>/borne</code>.</li>
              <li>Touchez le menu (3 points) → <strong>Installer l'application</strong>.</li>
              <li>Allez dans Paramètres Android → <strong>Sécurité</strong> → <strong>Épinglage d'application</strong>.</li>
              <li>Activez le plein écran pour empêcher les clients de quitter l'application.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 12 }}>
            <strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>Sortie Secrète Staff</strong>
            <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: 'var(--ink)' }}>
              Pour quitter le mode Borne sur la tablette, appuyez de manière prolongée pendant <strong>5 secondes sur le logo Hoya Poké</strong> en haut à gauche, puis entrez le <strong>code PIN staff (1234)</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
