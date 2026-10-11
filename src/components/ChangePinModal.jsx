import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, X, Delete, Check, KeyRound, AlertTriangle } from 'lucide-react';
import { getStaffPin, setStaffPin, isStaffPinValid } from './StaffGuard';
import { playSuccessSound } from '../sound';

export default function ChangePinModal({ onClose }) {
  // Steps: 'current' -> 'new' -> 'confirm' -> 'success'
  const [step, setStep] = useState('current');
  const [currentInput, setCurrentInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const activeValue = step === 'current' ? currentInput : step === 'new' ? newPin : confirmPin;

  const handleDigit = (digit) => {
    if (activeValue.length >= 4) return;
    const next = activeValue + digit;
    setError('');

    if (step === 'current') {
      setCurrentInput(next);
      if (next.length === 4) {
        if (isStaffPinValid(next)) {
          setTimeout(() => {
            setStep('new');
            setError('');
          }, 200);
        } else {
          setError('Code PIN actuel incorrect.');
          setTimeout(() => {
            setCurrentInput('');
            setError('');
          }, 700);
        }
      }
    } else if (step === 'new') {
      setNewPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          setStep('confirm');
          setError('');
        }, 200);
      }
    } else if (step === 'confirm') {
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === newPin) {
          setStaffPin(next);
          playSuccessSound();
          setStep('success');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError('Les deux codes PIN ne correspondent pas.');
          setTimeout(() => {
            setConfirmPin('');
            setError('');
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'current') setCurrentInput(p => p.slice(0, -1));
    else if (step === 'new') setNewPin(p => p.slice(0, -1));
    else if (step === 'confirm') setConfirmPin(p => p.slice(0, -1));
  };

  // Physical Keyboard support
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, currentInput, newPin, confirmPin]);

  const stepTitles = {
    current: 'Code PIN actuel',
    new: 'Nouveau code PIN',
    confirm: 'Confirmez le nouveau code PIN',
    success: 'Code PIN mis à jour !'
  };

  const stepSubtitles = {
    current: 'Saisissez votre code PIN actuel pour autoriser la modification.',
    new: 'Choisissez 4 nouveaux chiffres pour sécuriser les accès staff.',
    confirm: 'Retapez à nouveau les 4 chiffres du nouveau code PIN.',
    success: 'Le nouveau code est actif immédiatement.'
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
        style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto', maxWidth: 360, padding: 0 }}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
      >
        {/* Header */}
        <div className="row between" style={{ padding: '16px 20px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
          <div className="row gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--green-700)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
              <KeyRound size={16} />
            </div>
            <div>
              <strong style={{ fontSize: 15 }}>Modifier le Code PIN</strong>
              <div className="muted small" style={{ fontSize: 11 }}>Sécurité & Accès Staff</div>
            </div>
          </div>
          <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          {step === 'success' ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center' }}>
                <Check size={28} strokeWidth={3} />
              </div>
              <strong style={{ fontSize: 17, color: 'var(--green-700)' }}>Code PIN modifié avec succès !</strong>
              <p className="muted small" style={{ margin: 0 }}>
                Votre nouveau code à 4 chiffres est désormais requis pour accéder à la cuisine et aux bilans.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="row gap-2" style={{ marginBottom: 4 }}>
                {['current', 'new', 'confirm'].map((s, idx) => {
                  const isCurrent = step === s;
                  const isDone = (s === 'current' && (step === 'new' || step === 'confirm')) || (s === 'new' && step === 'confirm');
                  return (
                    <div
                      key={s}
                      style={{
                        width: 24,
                        height: 6,
                        borderRadius: 3,
                        background: isDone ? 'var(--ok)' : isCurrent ? 'var(--green-700)' : 'var(--line)',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  );
                })}
              </div>

              <div>
                <strong style={{ fontSize: 16 }}>{stepTitles[step]}</strong>
                <p className="muted small" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  {stepSubtitles[step]}
                </p>
              </div>

              {/* Dots */}
              <motion.div
                animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.35 }}
                style={{ display: 'flex', gap: 14, margin: '8px 0' }}
              >
                {[0, 1, 2, 3].map(index => {
                  const filled = activeValue.length > index;
                  return (
                    <div
                      key={index}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: error ? 'var(--danger)' : filled ? 'var(--green-700)' : 'var(--cream-2)',
                        border: error ? '2px solid var(--danger)' : filled ? '2px solid var(--green-700)' : '2px solid var(--line)',
                        boxShadow: filled && !error ? '0 0 8px rgba(46, 125, 50, 0.4)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  );
                })}
              </motion.div>

              {/* Error Message */}
              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {/* Tactile Keypad */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  width: '100%',
                  maxWidth: 240,
                  marginTop: 6
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigit(String(num))}
                    style={{
                      height: 48,
                      borderRadius: 14,
                      background: 'var(--cream-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'transform 0.1s ease',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--cream-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--cream-2)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                  aria-label="Effacer"
                >
                  <Delete size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
