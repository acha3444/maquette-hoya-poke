import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Delete } from 'lucide-react';
import HoyaMark from './brand/HoyaMark';
import Branch from './brand/Branch';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../supabase';

const PIN_STORAGE_KEY = 'hoya_staff_authenticated';
const PIN_CODE_KEY = 'hoya_staff_pin';
export const DEFAULT_PIN = '1234';

// Cloud Sync initialization: fetch and listen for PIN changes across all devices
if (typeof window !== 'undefined') {
  // 1. Initial fetch from Cloud
  supabase
    .from('orders')
    .select('customer_phone')
    .eq('id', '__pin_config__')
    .maybeSingle()
    .then(({ data, error }) => {
      if (!error && data?.customer_phone && data.customer_phone.length === 4) {
        localStorage.setItem(PIN_CODE_KEY, data.customer_phone);
        window.dispatchEvent(new CustomEvent('hoya_pin_changed', { detail: data.customer_phone }));
      }
    })
    .catch(() => {});

  // 2. Realtime listener for PIN changes across all devices
  try {
    supabase
      .channel('public:pin_config_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'id=eq.__pin_config__' }, (payload) => {
        const cloudPin = payload.new?.customer_phone;
        if (cloudPin && cloudPin.length === 4) {
          localStorage.setItem(PIN_CODE_KEY, cloudPin);
          window.dispatchEvent(new CustomEvent('hoya_pin_changed', { detail: cloudPin }));
        }
      })
      .subscribe();
  } catch (e) {}
}

export function getStaffPin() {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  return localStorage.getItem(PIN_CODE_KEY) || DEFAULT_PIN;
}

export function setStaffPin(newPin, syncCloud = true) {
  if (typeof window !== 'undefined') {
    const pinStr = String(newPin);
    localStorage.setItem(PIN_CODE_KEY, pinStr);
    window.dispatchEvent(new CustomEvent('hoya_pin_changed', { detail: pinStr }));

    if (syncCloud) {
      supabase
        .from('orders')
        .upsert({
          id: '__pin_config__',
          status: 'SYSTEM',
          customer_name: 'STAFF_PIN',
          customer_phone: pinStr,
          total: 0,
          items: []
        })
        .then(() => {})
        .catch(err => console.warn('Cloud PIN sync error:', err));
    }
  }
}

export function isStaffPinValid(inputPin) {
  const currentPin = getStaffPin();
  const quoteVariant = currentPin.slice(0, -1) + "'";
  return inputPin === currentPin || inputPin === quoteVariant;
}

export default function StaffGuard({ children, title = 'Accès Équipe Cuisine', defaultPin = '1234' }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
  });
  const [enteredPin, setEnteredPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const handleKeyPress = (num) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + num;
    setEnteredPin(next);
    setHasError(false);

    if (next.length === 4) {
      if (isStaffPinValid(next)) {
        if (rememberMe) {
          localStorage.setItem(PIN_STORAGE_KEY, 'true');
        } else {
          sessionStorage.setItem(PIN_STORAGE_KEY, 'true');
        }
        setTimeout(() => setIsAuthenticated(true), 150);
      } else {
        setHasError(true);
        setTimeout(() => {
          setEnteredPin('');
          setHasError(false);
        }, 800);
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setHasError(false);
  };

  // Keyboard support for desktop / laptops
  useEffect(() => {
    if (isAuthenticated) return;

    const onKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === "'") {
        handleKeyPress("'");
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enteredPin, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setEnteredPin('');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const handleLockEvent = () => {
      handleLogout();
    };
    window.addEventListener('hoya_lock_staff', handleLockEvent);
    return () => window.removeEventListener('hoya_lock_staff', handleLockEvent);
  }, []);

  if (!isAuthenticated) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return (
      <div className="pin-screen">
        <Branch className="pin-branch" />
        <motion.div
          className="pin-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pin-brand">
            <span className="pin-mark"><HoyaMark size={34} /></span>
            <span className="pin-word">Hoya Poké</span>
          </div>

          <div>
            <h1 className="pin-title">{title}</h1>
            <p className="pin-sub">Accès réservé à l'équipe. Saisissez votre code à 4 chiffres.</p>
          </div>

          <motion.div
            className="pin-dots"
            animate={hasError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {[0, 1, 2, 3].map(index => (
              <span key={index} className={`pin-dot ${hasError ? 'error' : enteredPin.length > index ? 'on' : ''}`} />
            ))}
          </motion.div>

          {hasError && (
            <motion.div className="pin-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <ShieldAlert size={14} />
              <span>Code incorrect {getStaffPin() === DEFAULT_PIN ? '(par défaut : 1234)' : ''}</span>
            </motion.div>
          )}

          <div className="pin-pad">
            {keys.map(num => (
              <button key={num} className="pin-key" onClick={() => handleKeyPress(num)}>{num}</button>
            ))}
            <button className="pin-key ghost" onClick={() => navigate('/')} title="Retour au site client">
              <ArrowLeft size={16} />
              <span>Retour</span>
            </button>
            <button className="pin-key" onClick={() => handleKeyPress('0')}>0</button>
            <button className="pin-key" onClick={handleDelete} aria-label="Effacer"><Delete size={20} /></button>
          </div>

          <label className="pin-remember">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            <span>Rester connecté sur cet appareil</span>
          </label>
        </motion.div>
      </div>
    );
  }

  return children;
}

export function lockStaffApp() {
  localStorage.removeItem(PIN_STORAGE_KEY);
  sessionStorage.removeItem(PIN_STORAGE_KEY);
  window.dispatchEvent(new Event('hoya_lock_staff'));
}
