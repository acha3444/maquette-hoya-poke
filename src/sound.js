// Synthesized Web Audio API sound effects for Hoya Poké
// No external MP3 downloads needed, 100% reliable, zero latency, works on mobile & desktop

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Automatically unlock AudioContext on first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  };
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlock, { once: false, passive: true });
  });
}

const STORAGE_KEY = 'hoya_sound_enabled';

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export function setSoundEnabled(enabled) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }
}

/**
 * Plays a single bell-like tone with harmonics
 */
function playBellNote(ctx, freq, startTime, duration = 0.4, volume = 0.25) {
  // Fundamental tone (sine)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  gain1.gain.setValueAtTime(0.0001, startTime);
  gain1.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(startTime);
  osc1.stop(startTime + duration);

  // Harmonic overtone (triangle) for realistic bell sparkle
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.01, startTime); // slight detune for shimmer

  gain2.gain.setValueAtTime(0.0001, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.35, startTime + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(startTime);
  osc2.stop(startTime + duration * 0.6);
}

/**
 * Modern POS / Kitchen order notification chime (like Uber Eats / Deliveroo tablet)
 * Ascending double-chime with crystal bell harmonics: Ding-Ding-DING! ... Ding-Ding-DING!
 */
export function playNewOrderSound(force = false) {
  if (!force && !isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // Pattern 1: D5 (587 Hz) -> G5 (784 Hz) -> B5 (988 Hz)
  playBellNote(ctx, 587.33, now + 0.00, 0.35, 0.28);
  playBellNote(ctx, 783.99, now + 0.14, 0.35, 0.30);
  playBellNote(ctx, 987.77, now + 0.28, 0.50, 0.35);

  // Pattern 2 (repeat with higher resolving bell): D5 -> G5 -> D6 (1175 Hz)
  playBellNote(ctx, 587.33, now + 0.55, 0.35, 0.28);
  playBellNote(ctx, 783.99, now + 0.69, 0.35, 0.30);
  playBellNote(ctx, 1174.66, now + 0.83, 0.75, 0.38);

  // Haptic feedback if available (mobile tablets / phones)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 70, 150, 70, 250]);
    } catch (_) {}
  }
}

/**
 * Short positive confirmation sound (order validated, item ready, etc.)
 */
export function playSuccessSound(force = false) {
  if (!force && !isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  playBellNote(ctx, 659.25, now + 0.00, 0.25, 0.22); // E5
  playBellNote(ctx, 880.00, now + 0.12, 0.40, 0.28); // A5
}
