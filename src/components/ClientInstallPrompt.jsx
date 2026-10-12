import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Share, PlusSquare, Smartphone, Check, X, 
  Sparkles, Gift, Zap, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { useStore } from '../store';

const DISMISS_KEY = 'hoya_pwa_prompt_dismissed';

export default function ClientInstallPrompt({ forceOpen, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    // 3. Capture Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Auto-show popup after 2.5s if not installed and not dismissed recently
    if (!standalone) {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      const isRecent = dismissed && Date.now() - parseInt(dismissed, 10) < 24 * 60 * 60 * 1000;
      if (!isRecent) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Sync external forceOpen trigger (e.g. if user clicked a banner or button)
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const closePrompt = () => {
    setIsOpen(false);
    onOpenChange?.(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch (e) {}
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        closePrompt();
      }
      setDeferredPrompt(null);
    } else {
      closePrompt();
    }
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="loyalty-modal-overlay" onClick={closePrompt}>
          <motion.div
            className="loyalty-modal-card pwa-marketing-card"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            {/* Header */}
            <div className="pwa-card-header">
              <div className="row gap-3">
                <img 
                  src="/icon-192.png" 
                  alt="Hoya Poké" 
                  className="pwa-app-icon" 
                />
                <div>
                  <div className="row gap-2">
                    <span className="tag tag-gold" style={{ fontSize: 10, padding: '2px 8px' }}>
                      Application Hoya Poké
                    </span>
                  </div>
                  <h3 className="display" style={{ fontSize: 19, margin: '4px 0 0', color: 'var(--cream)' }}>
                    Ajoutez l'App sur votre téléphone
                  </h3>
                  <span className="small" style={{ color: 'rgba(250,245,240,0.75)' }}>
                    Pézenas · Vos pokés en 1 clic sur votre écran d'accueil
                  </span>
                </div>
              </div>

              <button className="icon-btn-light" onClick={closePrompt} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="pwa-card-body scroll">
              {/* Marketing Incentive Box */}
              <div className="pwa-reward-highlight">
                <div className="row gap-2">
                  <Sparkles size={22} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--green-900)' }}>
                      Commandez plus vite & profitez de -10% !
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(15,26,20,0.75)' }}>
                      Retrouvez vos recettes favorites en 1 clic et utilisez le code promo <strong>BIENVENUE10</strong> lors de votre commande.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits list */}
              <div className="pwa-benefits-grid">
                <div className="pwa-benefit-item">
                  <div className="pwa-benefit-icon">
                    <Zap size={16} />
                  </div>
                  <div className="col">
                    <strong style={{ fontSize: 13 }}>Commander en 1 tap</strong>
                    <span className="muted small">Plus besoin de taper l'adresse sur Google, l'icône est sur votre téléphone.</span>
                  </div>
                </div>

                <div className="pwa-benefit-item">
                  <div className="pwa-benefit-icon">
                    <Sparkles size={16} />
                  </div>
                  <div className="col">
                    <strong style={{ fontSize: 13 }}>-10% sur votre commande</strong>
                    <span className="muted small">Utilisez le code promo exclusif <strong>BIENVENUE10</strong> lors de votre paiement.</span>
                  </div>
                </div>

                <div className="pwa-benefit-item">
                  <div className="pwa-benefit-icon">
                    <Smartphone size={16} />
                  </div>
                  <div className="col">
                    <strong style={{ fontSize: 13 }}>Suivi en direct & Alertes</strong>
                    <span className="muted small">Suivez la préparation en cuisine et l'arrivée du livreur en temps réel.</span>
                  </div>
                </div>
              </div>

              {/* Step-by-step Installation Instructions */}
              <div className="pwa-instructions-box">
                {isIOS ? (
                  <div className="col gap-2">
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                      Installation rapide sur iPhone & iPad (Safari) :
                    </strong>
                    <div className="pwa-steps-list">
                      <div className="pwa-step-line">
                        <span className="pwa-step-num">1</span>
                        <span>
                          Touchez l'icône <strong>Partager</strong> <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px', color: '#007aff' }} /> (en bas de votre écran Safari).
                        </span>
                      </div>
                      <div className="pwa-step-line">
                        <span className="pwa-step-num">2</span>
                        <span>
                          Faites défiler puis touchez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.
                        </span>
                      </div>
                      <div className="pwa-step-line">
                        <span className="pwa-step-num">3</span>
                        <span>
                          Touchez <strong>« Ajouter »</strong> en haut à droite. C'est prêt !
                        </span>
                      </div>
                    </div>
                  </div>
                ) : deferredPrompt ? (
                  <div className="col gap-2">
                    <button
                      className="btn btn-primary btn-block row gap-2"
                      style={{ height: 46, fontSize: 14 }}
                      onClick={handleNativeInstall}
                    >
                      <Download size={18} />
                      <span>Installer l'App Hoya Poké maintenant</span>
                    </button>
                    <span className="muted small" style={{ textAlign: 'center', fontSize: 11 }}>
                      Installation 100% gratuite et instantanée, sans passer par le Play Store.
                    </span>
                  </div>
                ) : (
                  <div className="col gap-2">
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                      Sur Android, Chrome ou tablette :
                    </strong>
                    <div className="pwa-steps-list">
                      <div className="pwa-step-line">
                        <span className="pwa-step-num">1</span>
                        <span>Ouvrez le menu du navigateur (les <strong>3 petits points ⋮</strong> en haut à droite).</span>
                      </div>
                      <div className="pwa-step-line">
                        <span className="pwa-step-num">2</span>
                        <span>Appuyez sur <strong>« Installer l'application »</strong> ou « Ajouter à l'écran d'accueil ».</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pwa-card-footer">
              <button 
                className="btn btn-ghost" 
                onClick={closePrompt}
                style={{ fontSize: 13 }}
              >
                Plus tard
              </button>

              {deferredPrompt ? (
                <button 
                  className="btn btn-gold row gap-2"
                  onClick={handleNativeInstall}
                  style={{ minWidth: 180 }}
                >
                  <Download size={16} />
                  <span>Installer l'App</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary row gap-2"
                  onClick={closePrompt}
                  style={{ minWidth: 150 }}
                >
                  <Check size={16} />
                  <span>J'ai compris</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
