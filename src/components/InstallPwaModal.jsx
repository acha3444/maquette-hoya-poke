import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, Smartphone, Check, X, Sparkles } from 'lucide-react';

export default function InstallPwaModal({ onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone (installed app) mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    // Capture standard PWA install event (Android / Chromium)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

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
        className="thermal-preview-modal"
        style={{ maxWidth: 420, padding: 0 }}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        {/* Header */}
        <div className="row between" style={{ padding: '16px 20px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
          <div className="row gap-2">
            <img src="/apple-touch-icon.png" alt="Hoya" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)' }} />
            <div>
              <strong style={{ fontSize: 15 }}>Installer sur l'écran d'accueil</strong>
              <div className="muted small" style={{ fontSize: 11 }}>Accès direct plein écran</div>
            </div>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24 }} className="col gap-3">
          {isStandalone ? (
            <div className="col gap-2" style={{ textAlign: 'center', padding: '16px 0', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center' }}>
                <Check size={28} strokeWidth={3} />
              </div>
              <strong style={{ fontSize: 16 }}>Application déjà installée !</strong>
              <p className="muted small" style={{ margin: 0 }}>
                Vous utilisez actuellement l'application en mode plein écran autonome.
              </p>
            </div>
          ) : (
            <>
              <p className="muted small" style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                Transformez l'espace <strong>Hoya Admin & Cuisine</strong> en véritable application autonome sur votre iPad, tablette Android ou smartphone :
              </p>

              {/* Benefits list */}
              <div className="col gap-2" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                <div className="row gap-2" style={{ fontSize: 12 }}>
                  <Sparkles size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span><strong>Plein écran sans navigateur</strong> (pas de barre d'adresse ni d'onglets)</span>
                </div>
                <div className="row gap-2" style={{ fontSize: 12 }}>
                  <Smartphone size={15} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
                  <span><strong>Icône sur l'écran d'accueil</strong> pour ouvrir en 1 tap</span>
                </div>
              </div>

              {/* iOS instructions */}
              {isIOS ? (
                <div className="col gap-2" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Sur iPhone & iPad (Safari) :</strong>
                  <div className="col gap-2" style={{ fontSize: 12, color: 'var(--ink)' }}>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'var(--green-700)', color: 'var(--cream)', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>1</span>
                      <span>Touchez l'icône <strong>Partager</strong> <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> (en bas sur iPhone, en haut sur iPad).</span>
                    </div>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'var(--green-700)', color: 'var(--cream)', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>2</span>
                      <span>Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.</span>
                    </div>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'var(--green-700)', color: 'var(--cream)', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>3</span>
                      <span>Touchez <strong>« Ajouter »</strong> en haut à droite.</span>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                /* Android / Chrome native prompt button */
                <button
                  className="btn btn-primary btn-block row gap-2"
                  style={{ justifyContent: 'center', height: 44, marginTop: 4 }}
                  onClick={handleNativeInstall}
                >
                  <Download size={16} />
                  <span>Installer l'application maintenant</span>
                </button>
              ) : (
                /* Chrome/Edge Desktop or general instructions */
                <div className="col gap-2" style={{ marginTop: 4 }}>
                  <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Sur Android, Chrome ou tablette :</strong>
                  <div className="col gap-2" style={{ fontSize: 12 }}>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'var(--green-700)', color: 'var(--cream)', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>1</span>
                      <span>Ouvrez le menu du navigateur (les <strong>3 petits points ⋮</strong> en haut à droite).</span>
                    </div>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <span className="badge" style={{ background: 'var(--green-700)', color: 'var(--cream)', width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>2</span>
                      <span>Appuyez sur <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <button className="btn btn-ghost btn-block" style={{ marginTop: 4 }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
