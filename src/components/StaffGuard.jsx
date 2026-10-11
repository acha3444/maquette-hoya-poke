import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, ArrowLeft, Delete, Check, LockKeyhole } from 'lucide-react';
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
    return (
      <div 
        style={{
          minHeight: '100vh',
          width: '100%',
          background: 'radial-gradient(ellipse at 50% 20%, #18291f 0%, #0f1a14 100%)',
          color: 'var(--cream)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          userSelect: 'none'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            maxWidth: 360,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 20
          }}
        >
          {/* Brand & Security Badge */}
          <div style={{ position: 'relative' }}>
            <img 
              src="/logo.jpg" 
              alt="Hoya Poké" 
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '2px solid rgba(227, 163, 69, 0.4)'
              }}
            />
            <div 
              style={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--gold)',
                color: 'var(--green-900)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              <Lock size={14} strokeWidth={2.5} />
            </div>
          </div>

          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
              {title}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(250, 245, 240, 0.7)', margin: 0 }}>
              Accès réservé au personnel. Veuillez saisir votre code PIN staff à 4 chiffres.
            </p>
          </div>

          {/* PIN Indicators Dots */}
          <motion.div
            animate={hasError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex',
              gap: 16,
              margin: '8px 0'
            }}
          >
            {[0, 1, 2, 3].map(index => {
              const filled = enteredPin.length > index;
              return (
                <div
                  key={index}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: hasError 
                      ? '#c8463d' 
                      : filled 
                        ? 'var(--gold)' 
                        : 'rgba(250, 245, 240, 0.15)',
                    border: hasError
                      ? '2px solid #c8463d'
                      : filled
                        ? '2px solid var(--gold)'
                        : '2px solid rgba(250, 245, 240, 0.3)',
                    boxShadow: filled && !hasError ? '0 0 12px rgba(227, 163, 69, 0.5)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              );
            })}
          </motion.div>

          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: '#ff8a80',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ShieldAlert size={14} />
              <span>Code PIN incorrect {getStaffPin() === DEFAULT_PIN ? '(par défaut : 1234)' : ''}</span>
            </motion.div>
          )}

          {/* Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              width: '100%',
              maxWidth: 280
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(String(num))}
                style={{
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(250, 245, 240, 0.08)',
                  border: '1px solid rgba(250, 245, 240, 0.12)',
                  color: 'var(--cream)',
                  fontSize: 22,
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, transform 0.1s ease',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => navigate('/')}
              style={{
                height: 56,
                borderRadius: 16,
                background: 'transparent',
                border: 'none',
                color: 'rgba(250, 245, 240, 0.6)',
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                cursor: 'pointer'
              }}
              title="Retour au site client"
            >
              <ArrowLeft size={16} />
              <span>Retour</span>
            </button>

            <button
              onClick={() => handleKeyPress('0')}
              style={{
                height: 56,
                borderRadius: 16,
                background: 'rgba(250, 245, 240, 0.08)',
                border: '1px solid rgba(250, 245, 240, 0.12)',
                color: 'var(--cream)',
                fontSize: 22,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.1s ease'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              0
            </button>

            <button
              onClick={handleDelete}
              style={{
                height: 56,
                borderRadius: 16,
                background: 'rgba(250, 245, 240, 0.08)',
                border: '1px solid rgba(250, 245, 240, 0.12)',
                color: 'var(--cream)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, transform 0.1s ease'
              }}
              aria-label="Effacer"
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Remember me toggle */}
          <label 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'rgba(250, 245, 240, 0.7)',
              cursor: 'pointer',
              marginTop: 4
            }}
          >
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={e => setRememberMe(e.target.checked)} 
              style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
            />
            <span>Mémoriser la session sur cette tablette</span>
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
