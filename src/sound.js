// High-reliability Web Audio + HTML5 Audio fallback for Hoya Poké
// Guarantees audio playback across Chrome, Safari Mac/iOS, Firefox and background tabs

let audioCtx = null;
let isUnlocked = false;
let fallbackAudio = null;

// Self-contained WAV chime generator (fallback when Web Audio graph is suspended)
function createChimeWavUri() {
  const sampleRate = 22050;
  const duration = 0.9;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  const writeUint32 = (offset, value) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
  };
  const writeUint16 = (offset, value) => {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + numSamples);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1); // PCM
  writeUint16(22, 1); // Mono
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate);
  writeUint16(32, 1);
  writeUint16(34, 8); // 8-bit
  writeString(36, 'data');
  writeUint32(40, numSamples);

  // Generate pleasant 2-tone bell chime: E5 (659Hz) -> A5 (880Hz)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.35 ? 659.25 : 880.00;
    const decay = t < 0.35 ? Math.exp(-t * 9) : Math.exp(-(t - 0.35) * 6);
    const sample = Math.sin(2 * Math.PI * freq * t) * decay;
    buffer[44 + i] = Math.floor(128 + sample * 115);
  }

  let binary = '';
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Forcefully unlock audio output on Safari / Chrome / Mobile
 */
export async function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {}
  }

  // Play silent micro-buffer to satisfy Apple/Chrome hardware unlock
  if (ctx && ctx.state === 'running') {
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isUnlocked = true;
    } catch (_) {}
  }

  // Also pre-prime the HTML5 Audio element
  if (typeof window !== 'undefined' && !fallbackAudio) {
    try {
      fallbackAudio = new Audio(createChimeWavUri());
      fallbackAudio.volume = 0.6;
    } catch (_) {}
  }

  return isUnlocked;
}

// Automatically listen for first user action to unlock
if (typeof window !== 'undefined') {
  const autoUnlock = () => {
    unlockAudio();
  };
  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, autoUnlock, { once: false, passive: true });
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

export function getAudioStatus() {
  const ctx = getAudioContext();
  if (!ctx) return 'unsupported';
  return ctx.state; // 'running', 'suspended', 'closed'
}

/**
 * Plays a single bell-like note with harmonics
 */
function playBellNote(ctx, freq, startTime, duration = 0.45, volume = 0.5) {
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

  // Harmonic overtone (triangle) for realistic physical chime ring
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2.01, startTime);

  gain2.gain.setValueAtTime(0.0001, startTime);
  gain2.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.7);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(startTime);
  osc2.stop(startTime + duration * 0.7);
}

/**
 * Modern POS / Kitchen order notification chime (like Uber Eats / Deliveroo tablet)
 * Ascending double-chime: Ding-Ding-DING! ... Ding-Ding-DING!
 */
export async function playNewOrderSound(force = false) {
  if (!force && !isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {}
  }

  // If Web Audio is running, synthesize the rich kitchen bell:
  if (ctx && ctx.state === 'running') {
    const now = ctx.currentTime;

    // Pattern 1: D5 (587 Hz) -> G5 (784 Hz) -> B5 (988 Hz)
    playBellNote(ctx, 587.33, now + 0.00, 0.40, 0.48);
    playBellNote(ctx, 783.99, now + 0.15, 0.40, 0.52);
    playBellNote(ctx, 987.77, now + 0.30, 0.55, 0.60);

    // Pattern 2 (repeat with higher resolving bell): D5 -> G5 -> D6 (1175 Hz)
    playBellNote(ctx, 587.33, now + 0.60, 0.40, 0.48);
    playBellNote(ctx, 783.99, now + 0.75, 0.40, 0.52);
    playBellNote(ctx, 1174.66, now + 0.90, 0.85, 0.65);
  } else {
    // Web Audio blocked or suspended -> fallback to HTML5 Audio element
    try {
      if (!fallbackAudio) fallbackAudio = new Audio(createChimeWavUri());
      fallbackAudio.currentTime = 0;
      fallbackAudio.volume = 0.75;
      fallbackAudio.play().catch(() => {});
    } catch (_) {}
  }

  // Haptic feedback if available (mobile tablets / phones)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([180, 80, 180, 80, 300]);
    } catch (_) {}
  }
}

/**
 * Short positive confirmation sound (order validated, item ready, etc.)
 */
export async function playSuccessSound(force = false) {
  if (!force && !isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {}
  }

  if (ctx && ctx.state === 'running') {
    const now = ctx.currentTime;
    playBellNote(ctx, 659.25, now + 0.00, 0.25, 0.35); // E5
    playBellNote(ctx, 880.00, now + 0.12, 0.45, 0.42); // A5
  }
}
