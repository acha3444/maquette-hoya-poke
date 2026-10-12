import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, animate, useMotionValue, useReducedMotion } from 'framer-motion';
import { Activity, ShieldCheck } from 'lucide-react';
import HoyaMark from './brand/HoyaMark';
import { NUTRITION_ESTIMATES } from '../data';

// Helper to safely extract string name whether item is an Object or a String
const getName = (item, defaultName = '') => {
  if (!item) return defaultName;
  if (typeof item === 'string') return item;
  return item.name || defaultName;
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Deterministic randomness: same ingredient → same pieces, so the bowl never "reshuffles"
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
const seeded = (key) => {
  let a = hash(key);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const R = 122; // inner radius of the bowl (food area)
const DEG = Math.PI / 180;

// Organic closed shape (chicken bites, crumbs, dollops)
const blobPath = (rand, rad, jitter = 0.25, n = 8) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = rad * (1 - jitter + rand() * jitter * 2);
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  });
  return d + 'Z';
};

const shadow = (rx, ry = rx * 0.8) => <ellipse cx={1.4} cy={2.2} rx={rx} ry={ry} fill="rgba(40,22,8,0.22)" />;
const gloss = (x, y, rx, ry, o = 0.4) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity={o} />;

/* ───────────────────────── Ingredients ───────────────────────── */

const PROTEINS = {
  saumon: {
    color: '#f47a5a', count: 11,
    draw: (rand) => {
      const w = 15 + rand() * 4, h = 12 + rand() * 3;
      return (<>
        {shadow(w * 0.55, h * 0.55)}
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3.2} fill="#f47a5a" />
        <rect x={-w / 2} y={h / 6} width={w} height={h / 3} rx={3} fill="#e8603f" opacity={0.6} />
        <path d={`M${-w / 2 + 1.5} ${-h / 5} Q0 ${-h / 5 - 3.5} ${w / 2 - 1.5} ${-h / 5 + 1}`} stroke="#ffe0d2" strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <path d={`M${-w / 2 + 2} ${h / 6} Q0 ${h / 6 - 3} ${w / 2 - 2} ${h / 6 + 1.5}`} stroke="#ffd2c0" strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.85} />
        {gloss(-w / 6, -h / 2 + 2.4, w / 4, 1.1, 0.45)}
      </>);
    }
  },
  thon: {
    color: '#b3313f', count: 11,
    draw: (rand) => {
      const w = 14 + rand() * 4, h = 12 + rand() * 3;
      return (<>
        {shadow(w * 0.55, h * 0.55)}
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="#b3313f" />
        <rect x={-w / 2} y={h / 8} width={w} height={h * 0.38} rx={3} fill="#8e2232" opacity={0.7} />
        <path d={`M${-w / 2 + 2} ${-h / 6} Q0 ${-h / 6 - 2.5} ${w / 2 - 2} ${-h / 6 + 0.8}`} stroke="#d9707a" strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.8} />
        {gloss(-w / 6, -h / 2 + 2.2, w / 4, 1, 0.4)}
      </>);
    }
  },
  poulet: {
    color: '#cf8a33', count: 10,
    draw: (rand) => (<>
      {shadow(9, 8)}
      <path d={blobPath(rand, 9, 0.22, 9)} fill="#c27a26" />
      <path d={blobPath(rand, 7.4, 0.25, 9)} fill="#e0a346" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={(rand() - 0.5) * 11} cy={(rand() - 0.5) * 11} r={0.9 + rand() * 0.8} fill={i % 2 ? '#a9631c' : '#f2c46f'} />
      ))}
      {gloss(-2.5, -3.5, 3, 1.4, 0.35)}
    </>)
  },
  falafel: {
    color: '#7d5a34', count: 9,
    draw: (rand) => (<>
      {shadow(8.5, 7.5)}
      <circle r={8.2} fill="#6e4d2a" />
      <circle cx={-0.8} cy={-0.8} r={7} fill="#8d6738" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={(rand() - 0.5) * 11} cy={(rand() - 0.5) * 11} r={0.5 + rand() * 0.7} fill={i < 3 ? '#5f8a3a' : '#4d331a'} />
      ))}
      {gloss(-2.8, -3.2, 2.6, 1.5, 0.3)}
    </>)
  }
};

const VEGGIES = {
  carotte: {
    color: '#f08a24', count: 18,
    draw: (rand) => {
      const l = 13 + rand() * 6;
      return (<>
        <rect x={-l / 2 + 1} y={0.2} width={l} height={2.6} rx={1.3} fill="rgba(40,22,8,0.18)" />
        <rect x={-l / 2} y={-1.3} width={l} height={2.6} rx={1.3} fill={rand() > 0.5 ? '#f08a24' : '#f59a35'} />
        <rect x={-l / 2 + 1} y={-1.1} width={l - 2} height={0.7} rx={0.35} fill="#ffc27a" />
      </>);
    }
  },
  oignon: {
    color: '#8e3a7a', count: 12,
    draw: (rand) => {
      const r = 5.5 + rand() * 3;
      const arc = `M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`;
      return (<>
        <path d={arc} transform="translate(1 2)" stroke="rgba(40,22,8,0.18)" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d={arc} stroke="#8e3a7a" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <path d={arc} stroke="#f0d3e6" strokeWidth={0.9} fill="none" strokeLinecap="round" transform="scale(0.86)" />
      </>);
    }
  },
  concombre: {
    color: '#3d7a2e', count: 10,
    draw: (rand) => (<>
      {shadow(6.6, 6.2)}
      <circle r={6.6} fill="#2f6a25" />
      <circle r={5.4} fill="#d4e9ac" />
      <circle r={2.6} fill="#c2df90" />
      {[0, 120, 240].map(a => <ellipse key={a} cx={Math.cos((a + rand() * 20) * DEG) * 1.6} cy={Math.sin((a + rand() * 20) * DEG) * 1.6} rx={0.9} ry={0.5} fill="#f2f8de" />)}
    </>)
  },
  radis: {
    color: '#e0457b', count: 10,
    draw: () => (<>
      {shadow(5.6, 5.2)}
      <circle r={5.6} fill="#d93a72" />
      <circle r={4.5} fill="#fbeef2" />
      <circle r={4.5} fill="none" stroke="#f3b9cc" strokeWidth={0.6} strokeDasharray="1 1.4" transform="scale(0.6)" />
    </>)
  },
  avocat: {
    color: '#7fae3c', count: 7, tangent: true,
    draw: (rand) => {
      const l = 11 + rand() * 2;
      const d = `M${-l} 0 C${-l * 0.55} -8.5 ${l * 0.55} -8.5 ${l} 0 C${l * 0.55} -2.4 ${-l * 0.55} -2.4 ${-l} 0Z`;
      return (<>
        <path d={d} transform="translate(1.2 2)" fill="rgba(40,22,8,0.2)" />
        <path d={d} fill="#d6e489" />
        <path d={`M${-l} 0 C${-l * 0.55} -8.5 ${l * 0.55} -8.5 ${l} 0 C${l * 0.55} -6.8 ${-l * 0.55} -6.8 ${-l} 0Z`} fill="#3f6622" />
        <path d={`M${-l * 0.7} -2.6 C${-l * 0.3} -5 ${l * 0.3} -5 ${l * 0.7} -2.6`} stroke="#eef3b8" strokeWidth={0.8} fill="none" opacity={0.7} />
      </>);
    }
  },
  edamame: {
    color: '#7cbf4a', count: 26,
    draw: () => (<>
      {shadow(3.6, 3.2)}
      <ellipse rx={3.8} ry={3.3} fill="#6fb43f" />
      {gloss(-1.1, -1.2, 1.3, 0.8, 0.5)}
    </>)
  },
  chouRouge: {
    color: '#6d2a6e', count: 26,
    draw: (rand) => {
      const l = 6 + rand() * 4;
      return <path d={`M${-l} 0 Q${-l / 2} ${-3 - rand() * 2} 0 0 T${l} 0`} stroke={rand() > 0.4 ? '#6d2a6e' : '#8e4a90'} strokeWidth={1.7} fill="none" strokeLinecap="round" />;
    }
  },
  chouBlanc: {
    color: '#dfe8c4', count: 26,
    draw: (rand) => {
      const l = 6 + rand() * 4;
      const d = `M${-l} 0 Q${-l / 2} ${-3 - rand() * 2} 0 0 T${l} 0`;
      return (<>
        <path d={d} transform="translate(0.6 1)" stroke="rgba(40,22,8,0.15)" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <path d={d} stroke={rand() > 0.5 ? '#eef2d8' : '#d7e3b1'} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      </>);
    }
  },
  betterave: {
    color: '#8c1d40', count: 14,
    draw: (rand) => {
      const s = 6.5 + rand() * 1.5;
      return (<>
        {shadow(s * 0.55)}
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={1.6} fill="#8c1d40" />
        <rect x={-s / 2} y={-s / 2} width={s} height={s / 2.4} rx={1.4} fill="#a8285a" />
        {gloss(-s / 6, -s / 3, s / 4, 0.8, 0.35)}
      </>);
    }
  },
  mangue: {
    color: '#ffb627', count: 12,
    draw: (rand) => {
      const s = 7.5 + rand() * 2;
      return (<>
        {shadow(s * 0.55)}
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={2.2} fill="#f8a51e" />
        <rect x={-s / 2 + 0.8} y={-s / 2 + 0.8} width={s - 1.6} height={s - 2.4} rx={1.8} fill="#ffc244" />
        {gloss(-s / 6, -s / 4, s / 4, 1, 0.5)}
      </>);
    }
  },
  ananas: {
    color: '#f6d64a', count: 11,
    draw: () => (<>
      <path d="M-6 -4.5 L6 -4.5 L3.6 5 L-3.6 5Z" transform="translate(1 2)" fill="rgba(40,22,8,0.18)" stroke="rgba(40,22,8,0.18)" strokeWidth={2} strokeLinejoin="round" />
      <path d="M-6 -4.5 L6 -4.5 L3.6 5 L-3.6 5Z" fill="#f4cf3a" stroke="#f4cf3a" strokeWidth={2} strokeLinejoin="round" />
      <path d="M-3.5 -3.5 L-1.5 3.8 M0 -3.8 L0 4 M3.5 -3.5 L1.5 3.8" stroke="#fbe78f" strokeWidth={0.7} />
    </>)
  },
  grenade: {
    color: '#c4122f', count: 34,
    draw: () => (<>
      <circle cx={0.6} cy={1} r={2.6} fill="rgba(40,22,8,0.2)" />
      <circle r={2.6} fill="#c4122f" />
      <circle cx={-0.8} cy={-0.9} r={0.9} fill="#ff9aa8" opacity={0.85} />
    </>)
  },
  passion: {
    color: '#f3b712', count: 14,
    draw: (rand) => (<>
      <path d={blobPath(rand, 4.4, 0.2, 7)} fill="#e9a80c" opacity={0.95} />
      <circle cx={0.4} cy={0.3} r={1.3} fill="#1e1a14" />
      {gloss(-1.4, -1.6, 1.2, 0.7, 0.55)}
    </>)
  },
  raisin: {
    color: '#4a2a1a', count: 16,
    draw: () => (<>
      <ellipse rx={3.3} ry={2.4} fill="#4a2a1a" />
      <path d="M-1.8 -0.4 Q0 0.8 1.8 -0.4" stroke="#2b170d" strokeWidth={0.6} fill="none" />
      {gloss(-0.8, -1.1, 1, 0.5, 0.3)}
    </>)
  },
  autre: {
    color: '#9bc36b', count: 11,
    draw: () => (<>{shadow(5)}<circle r={5} fill="#9bc36b" />{gloss(-1.5, -1.6, 1.6, 1, 0.4)}</>)
  }
};

const TOPPINGS = {
  sesameNoir: {
    color: '#1d1a17', count: 44,
    draw: () => <ellipse rx={1.6} ry={0.85} fill="#1d1a17" />
  },
  sesame: {
    color: '#f3e3bf', count: 44,
    draw: () => (<><ellipse cx={0.4} cy={0.6} rx={1.6} ry={0.85} fill="rgba(40,22,8,0.2)" /><ellipse rx={1.6} ry={0.85} fill="#f6e8c6" /></>)
  },
  cacahuete: {
    color: '#c99a5b', count: 18,
    draw: (rand) => (<><path d={blobPath(rand, 2.4, 0.35, 5)} fill="#c38f4f" /><path d={blobPath(rand, 1.4, 0.3, 5)} fill="#e7c48f" /></>)
  },
  frit: {
    color: '#a8642a', count: 22,
    draw: (rand) => <path d={`M-3 0 Q-1 ${-2 - rand() * 2} 1 0 T4 ${rand() * 1.5}`} stroke={rand() > 0.5 ? '#a8642a' : '#c98a3e'} strokeWidth={1.7} fill="none" strokeLinecap="round" />
  },
  courge: {
    color: '#5f8a3a', count: 16,
    draw: () => (<><ellipse rx={3} ry={1.5} fill="#4f7a2f" /><ellipse rx={2.2} ry={0.8} fill="#7fae4a" /></>)
  },
  mais: {
    color: '#f4c430', count: 18,
    draw: () => (<><rect x={-1.8} y={-1.6} width={3.6} height={3.2} rx={1.1} fill="#f2be2a" /><circle cx={0.6} cy={0.4} r={0.7} fill="#9a6a1a" opacity={0.6} /></>)
  },
  autre: {
    color: '#d9c39a', count: 18,
    draw: () => <circle r={1.6} fill="#d9c39a" />
  }
};

const proteinKind = (n) => {
  const s = norm(n);
  if (s.includes('poulet')) return 'poulet';
  if (s.includes('falafel')) return 'falafel';
  if (s.includes('thon')) return 'thon';
  return 'saumon';
};

const veggieKind = (n) => {
  const s = norm(n);
  if (s.includes('oignon')) return 'oignon';
  if (s.includes('chou rouge')) return 'chouRouge';
  if (s.includes('chou')) return 'chouBlanc';
  const k = ['carotte', 'concombre', 'radis', 'avocat', 'edamame', 'betterave', 'mangue', 'ananas', 'grenade', 'passion', 'raisin'].find(key => s.includes(key));
  return k || 'autre';
};

const toppingKind = (n) => {
  const s = norm(n);
  if (s.includes('sesame') && s.includes('noir')) return 'sesameNoir';
  if (s.includes('sesame')) return 'sesame';
  if (s.includes('cacahuete')) return 'cacahuete';
  if (s.includes('frit')) return 'frit';
  if (s.includes('courge')) return 'courge';
  if (s.includes('mais')) return 'mais';
  return 'autre';
};

const BASES = {
  riz: { color: '#f1e9d8', grains: 900, draw: (_, i) => <ellipse key={i} rx={3.1} ry={1.45} fill={['#fffdf7', '#f6efe1', '#ece2cc'][i % 3]} /> },
  quinoa: { color: '#d4b77c', grains: 1100, draw: (rand, i) => <circle key={i} r={1.5 + rand() * 0.4} fill={i % 11 === 0 ? '#a8432f' : i % 17 === 0 ? '#3b302a' : ['#e7d09b', '#c9a96a', '#dcc086'][i % 3]} /> },
  carotte: { color: '#f2a04a', grains: 520, draw: (_, i) => <rect key={i} x={-5} y={-0.65} width={10} height={1.3} rx={0.65} fill={['#f08a24', '#f7b25e', '#e9791a'][i % 3]} /> }
};
const baseKind = (n) => {
  const s = norm(n);
  if (s.includes('quinoa')) return 'quinoa';
  if (s.includes('carotte')) return 'carotte';
  return 'riz';
};

const SAUCES = [
  ['sucree', '#6a3417', 3.4], ['salee', '#3a2216', 3],
  ['cacahuete', '#c98f4e', 5], ['tzatziki', '#f1f5ea', 5.2],
  ['coco', '#f08c3c', 4.6], ['sriracha mayo', '#f79068', 4.8],
  ['wasabi', '#c6d98a', 4.8], ['sriracha', '#d8261b', 3.8]
];
const sauceStyle = (n) => {
  const s = norm(n);
  const hit = SAUCES.find(([k]) => s.includes(k));
  return hit ? { color: hit[1], width: hit[2] } : { color: '#5a2d14', width: 3.6 };
};

/* ───────────────────────── Layout ───────────────────────── */

// Veggies take sectors of an outer ring, protein sits in the middle (like a real poke).
const layoutVeggies = (names) => {
  const n = names.length;
  if (!n) return [];
  const span = 360 / n;
  const density = n === 1 ? 2.4 : n === 2 ? 1.6 : n === 3 ? 1.2 : 1;
  return names.flatMap((name, idx) => {
    const kind = VEGGIES[veggieKind(name)];
    const rand = seeded(`veg:${name}`);
    const count = Math.round(kind.count * density);
    const a0 = -90 - span / 2 + idx * span;
    const pad = Math.min(7, span * 0.1);
    return Array.from({ length: count }, (_, i) => {
      const ang = a0 + pad + ((i + rand()) / count) * (span - pad * 2);
      const rad = Math.sqrt(66 * 66 + rand() * (112 * 112 - 66 * 66));
      const rot = kind.tangent ? ang + 90 + (rand() - 0.5) * 18 : rand() * 360;
      return {
        id: `veg:${name}:${i}`,
        x: Math.cos(ang * DEG) * rad,
        y: Math.sin(ang * DEG) * rad,
        rot,
        delay: i * 0.035,
        el: kind.draw(rand)
      };
    });
  });
};

const layoutProtein = (name, isLarge, hasRing) => {
  const kind = PROTEINS[proteinKind(name)];
  const rand = seeded(`prot:${name}`);
  const count = kind.count + (isLarge ? 3 : 0);
  const rMax = hasRing ? 50 : 82;
  const turn = rand() * 360;
  return Array.from({ length: count }, (_, i) => {
    const ang = turn + i * 137.5 + (rand() - 0.5) * 20;
    const rad = rMax * Math.sqrt((i + 0.5) / count) * (0.85 + rand() * 0.2);
    return {
      id: `prot:${name}:${i}`,
      x: Math.cos(ang * DEG) * rad,
      y: Math.sin(ang * DEG) * rad,
      rot: rand() * 360,
      delay: 0.05 + i * 0.05,
      el: kind.draw(rand)
    };
  });
};

const layoutToppings = (names) => names.flatMap(name => {
  const kind = TOPPINGS[toppingKind(name)];
  const rand = seeded(`top:${name}`);
  return Array.from({ length: kind.count }, (_, i) => {
    const ang = rand() * 360;
    const rad = Math.sqrt(rand()) * 108;
    return {
      id: `top:${name}:${i}`,
      x: Math.cos(ang * DEG) * rad,
      y: Math.sin(ang * DEG) * rad,
      rot: rand() * 360,
      delay: rand() * 0.55,
      el: kind.draw(rand)
    };
  });
});

const drizzlePath = (seedKey) => {
  const rand = seeded(`sauce:${seedKey}`);
  const dir = rand() * Math.PI;
  const ca = Math.cos(dir), sa = Math.sin(dir);
  const n = 10;
  const pts = Array.from({ length: n }, (_, k) => {
    const along = (-1 + (2 * k) / (n - 1)) * 92;
    const maxPerp = Math.sqrt(Math.max(0, 104 * 104 - along * along)) * 0.78;
    const perp = (k % 2 ? 1 : -1) * maxPerp * (0.6 + rand() * 0.35);
    return [along * ca - perp * sa, along * sa + perp * ca];
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

/* ───────────────────────── Animated pieces ───────────────────────── */

// Seen from above, "falling into the bowl" = coming from bigger (closer to the camera) and landing.
function Pieces({ items, reduce, size = 1, drop = 2.2, spring = { stiffness: 320, damping: 20 } }) {
  return (
    <AnimatePresence>
      {items.map(p => (
        <motion.g
          key={p.id}
          initial={reduce ? { x: p.x, y: p.y, rotate: p.rot, opacity: 0 } : { x: p.x * 0.6, y: p.y * 0.6 - 30, rotate: p.rot - 50, scale: drop, opacity: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.rot, scale: 1, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { scale: 1.7, opacity: 0, y: p.y - 18, transition: { duration: 0.3, ease: 'easeIn' } }}
          transition={reduce ? { duration: 0.2 } : {
            type: 'spring', ...spring, delay: p.delay,
            opacity: { duration: 0.18, delay: p.delay }
          }}
        >
          <g transform={`scale(${size})`}>{p.el}</g>
        </motion.g>
      ))}
    </AnimatePresence>
  );
}

function BaseLayer({ name, uid, intro, reduce }) {
  const kind = BASES[baseKind(name)];
  const grains = useMemo(() => {
    const rand = seeded(`base:${name}`);
    return Array.from({ length: kind.grains }, (_, i) => {
      const ang = rand() * 360;
      const rad = Math.sqrt(rand()) * (R + 2);
      return (
        <g key={i} transform={`translate(${(Math.cos(ang * DEG) * rad).toFixed(1)} ${(Math.sin(ang * DEG) * rad).toFixed(1)}) rotate(${Math.round(rand() * 180)})`}>
          {kind.draw(rand, i)}
        </g>
      );
    });
  }, [name, kind]);

  const clipId = `${uid}-base-${hash(name)}`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <motion.circle
            initial={{ r: intro && !reduce ? 0 : R + 4 }}
            animate={{ r: R + 4 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle r={R + 4} fill={kind.color} />
        {grains}
      </g>
    </g>
  );
}

function SauceDrizzle({ name, reduce, bottleLayer }) {
  const { color, width } = sauceStyle(name);
  const d = useMemo(() => drizzlePath(name), [name]);
  const pathRef = useRef(null);
  const progress = useMotionValue(reduce ? 1 : 0);
  const hx = useMotionValue(0);
  const hy = useMotionValue(0);
  const [pouring, setPouring] = useState(!reduce);

  useEffect(() => {
    const el = pathRef.current;
    if (!el || reduce) return undefined;
    const len = el.getTotalLength();
    const follow = (v) => {
      const p = el.getPointAtLength(v * len);
      hx.set(p.x);
      hy.set(p.y);
    };
    follow(progress.get());
    const unsub = progress.on('change', follow);
    const ctrl = animate(progress, 1, {
      duration: 1.7,
      delay: 0.35,
      ease: [0.45, 0.05, 0.35, 1],
      onComplete: () => setPouring(false)
    });
    return () => { unsub(); ctrl.stop(); };
  }, [progress, hx, hy, reduce]);

  return (
    <>
      <motion.g exit={{ opacity: 0, transition: { duration: 0.3 } }}>
        <motion.path d={d} transform="translate(1.4 2.2)" stroke="rgba(40,22,8,0.22)" strokeWidth={width + 0.6} fill="none" strokeLinecap="round" style={{ pathLength: progress }} />
        <motion.path ref={pathRef} d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: progress }} />
        <motion.path d={d} transform="translate(-0.6 -0.8)" stroke="#fff" strokeOpacity={0.45} strokeWidth={Math.max(0.8, width * 0.25)} fill="none" strokeLinecap="round" style={{ pathLength: progress }} />
      </motion.g>

      {/* Squeeze bottle following the drizzle, drawn above the bowl rim */}
      {bottleLayer && createPortal(<AnimatePresence>
        {pouring && (
          <motion.g key="bottle" style={{ x: hx, y: hy }}>
            <motion.g
              initial={{ opacity: 0, x: 30, y: -40 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 30, y: -50, transition: { duration: 0.4, ease: 'easeIn' } }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <motion.path
                d="M0 0 Q3 -26 16 -54"
                stroke={color}
                strokeWidth={width * 0.75}
                fill="none"
                strokeLinecap="round"
                animate={{ d: ['M0 0 Q3 -26 16 -54', 'M0 0 Q6 -28 16 -54', 'M0 0 Q3 -26 16 -54'] }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle r={width * 0.85} fill={color} />
              <g transform="translate(16 -54) rotate(28)">
                <path d="M-1.6 0 L1.6 0 L5 -15 L-5 -15Z" fill="#f3f1ec" stroke="rgba(0,0,0,0.15)" strokeWidth={0.6} />
                <rect x={-7} y={-19} width={14} height={5} rx={1.5} fill="#e4e1da" />
                <rect x={-14} y={-76} width={28} height={58} rx={9} fill={color} stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} />
                <rect x={-14} y={-56} width={28} height={18} fill="#fffaf0" opacity={0.92} />
                <rect x={-9} y={-72} width={4} height={48} rx={2} fill="#fff" opacity={0.35} />
              </g>
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>, bottleLayer)}
    </>
  );
}

function Dollop({ reduce }) {
  const rand = seeded('gourmand');
  const outer = blobPath(rand, 13, 0.14, 10);
  const inner = blobPath(rand, 8, 0.18, 9);
  const zest = Array.from({ length: 9 }, () => [(rand() - 0.5) * 18, (rand() - 0.5) * 16]);
  return (
    <motion.g
      initial={reduce ? { opacity: 0, x: 28, y: -24 } : { opacity: 0, scale: 3.2, x: 40, y: -60 }}
      animate={{ opacity: 1, scale: 1.4, x: 28, y: -24 }}
      exit={{ opacity: 0, scale: 1.6, transition: { duration: 0.25 } }}
      transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 260, damping: 16 }}
    >
      <path d={outer} transform="translate(1.6 2.6)" fill="rgba(40,22,8,0.22)" />
      <path d={outer} fill="#ece7da" />
      <path d={inner} transform="translate(-1 -1.4)" fill="#fbf9f3" />
      {gloss(-3.5, -5, 3.4, 1.6, 0.8)}
      {zest.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.7} fill={i % 3 ? '#7cae3a' : '#c7dc5a'} />)}
      <g transform="translate(13 9) rotate(-20)">
        <path d="M-8 0 A8 8 0 0 1 8 0Z" fill="#5d9b2f" />
        <path d="M-6.6 0 A6.6 6.6 0 0 1 6.6 0Z" fill="#cfe68a" />
        {[-50, -90, -130].map(a => <line key={a} x1={0} y1={0} x2={Math.cos(a * DEG) * 6} y2={Math.sin(a * DEG) * 6} stroke="#eef6c8" strokeWidth={0.6} />)}
      </g>
    </motion.g>
  );
}

/* ───────────────────────── Bowl ───────────────────────── */

const KRAFT_FIBERS = (() => {
  const rand = seeded('kraft');
  return Array.from({ length: 90 }, (_, i) => {
    const a = rand() * 360;
    const r = 124 + rand() * 25;
    return <circle key={i} cx={Math.cos(a * DEG) * r} cy={Math.sin(a * DEG) * r} r={0.35 + rand() * 0.6} fill={rand() > 0.5 ? '#f0dcb8' : '#7a5532'} opacity={0.4} />;
  });
})();

// The bowl itself, seen from above. `still` renders it without the drop-in intro (cards, thumbnails).
export function BowlScene({
  baseName = 'Riz vinaigré', proteinName = '', veggiesList = [], toppingsList = [], sauceName = '',
  hasGourmand = false, isLarge = false, still = false, className = 'bowl-svg', label
}) {
  const prefersReduced = useReducedMotion();
  const reduce = prefersReduced || still;
  const [bottleLayer, setBottleLayer] = useState(null);
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const hasSauce = Boolean(sauceName);

  const veggieKey = veggiesList.join('|');
  const toppingKey = toppingsList.join('|');
  const vegPieces = useMemo(() => layoutVeggies(veggieKey ? veggieKey.split('|') : []), [veggieKey]);
  const protPieces = useMemo(
    () => (proteinName ? layoutProtein(proteinName, isLarge, veggieKey.length > 0) : []),
    [proteinName, isLarge, veggieKey]
  );
  const topPieces = useMemo(() => layoutToppings(toppingKey ? toppingKey.split('|') : []), [toppingKey]);

  // Keep the previous base underneath while the new one spreads over it
  const [baseLayers, setBaseLayers] = useState([{ name: baseName, id: 0 }]);
  const topLayer = baseLayers[baseLayers.length - 1];
  if (topLayer.name !== baseName) {
    setBaseLayers([topLayer, { name: baseName, id: topLayer.id + 1 }]);
  }

  return (
    <svg className={className} viewBox="-170 -170 340 340" role="img" aria-label={label}>
      <defs>
        <radialGradient id={`${uid}-kraft`} cx="0.4" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#dcbd92" />
          <stop offset="0.7" stopColor="#c9a274" />
          <stop offset="1" stopColor="#b28659" />
        </radialGradient>
        <radialGradient id={`${uid}-wall`} cx="0.58" cy="0.62" r="0.62">
          <stop offset="0.8" stopColor="#c29868" />
          <stop offset="1" stopColor="#9c7347" />
        </radialGradient>
        <radialGradient id={`${uid}-inner`} cx="0.56" cy="0.6" r="0.58">
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="0.93" stopColor="#000" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={`${uid}-food`}>
          <circle r={R} />
        </clipPath>
      </defs>

      <motion.g
        initial={reduce || still ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: isLarge || still ? 1 : 0.9, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        {/* Table shadow */}
        <ellipse cx={8} cy={16} rx={148} ry={144} fill="rgba(30,20,10,0.35)" filter={`url(#${uid}-blur)`} />

        {/* Kraft paper bowl, like the ones used in the shop */}
        <circle r={150} fill={`url(#${uid}-kraft)`} />
        <circle r={147} fill="none" stroke="#e6cfa8" strokeWidth="5" />
        <circle r={143.6} fill="none" stroke="#7a5532" strokeOpacity="0.28" strokeWidth="1.2" />
        <circle r={141} fill={`url(#${uid}-wall)`} />
        {KRAFT_FIBERS}
        <path d="M-120 -76 A142 142 0 0 1 36 -138" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle r={R + 1.5} fill="none" stroke="#6b4826" strokeOpacity="0.35" strokeWidth="2.5" />

        {/* Food */}
        <g clipPath={`url(#${uid}-food)`}>
          {baseLayers.map((b, i) => (
            <BaseLayer key={b.id} name={b.name} uid={uid} intro={i === baseLayers.length - 1} reduce={reduce} />
          ))}
          <Pieces items={vegPieces} reduce={reduce} size={1.45} />
          <Pieces items={protPieces} reduce={reduce} size={1.5} drop={2.6} spring={{ stiffness: 280, damping: 17 }} />
          <AnimatePresence>
            {hasSauce && <SauceDrizzle key={sauceName} name={sauceName} reduce={reduce} bottleLayer={bottleLayer} />}
          </AnimatePresence>
          <Pieces items={topPieces} reduce={reduce} size={1.3} drop={3.2} spring={{ stiffness: 380, damping: 24 }} />
          <AnimatePresence>
            {hasGourmand && <Dollop key="gourmand" reduce={reduce} />}
          </AnimatePresence>
          <circle r={R} fill={`url(#${uid}-inner)`} pointerEvents="none" />
        </g>
        <g ref={setBottleLayer} />
      </motion.g>
    </svg>
  );
}

export default function BowlVisualizer({ selections = {}, isCustom = true, baseItem, classicIngredients = [] }) {
  const [showNutrition, setShowNutrition] = useState(false);

  const removed = selections.removed || [];
  const baseName = getName(selections.base?.[0], 'Riz vinaigré');

  const rawProtein = selections.proteine?.[0];
  const defaultProtName = isCustom ? '' : getName(baseItem?.defaultProtein, 'Saumon cru mariné');
  const proteinName = getName(rawProtein, defaultProtName);

  const sauceName = getName(selections.sauce?.[0], '');

  const veggiesList = isCustom
    ? (selections.fruitsLegumes || []).map(v => getName(v)).filter(Boolean)
    : classicIngredients.filter(i => !removed.includes(i));
  const toppingsList = isCustom
    ? (selections.toppings || []).map(t => getName(t)).filter(Boolean)
    : ['Sésames'];
  const hasGourmand = isCustom && (selections.gourmand || []).length > 0;

  const veggiesCount = veggiesList.length;
  const hasSauce = Boolean(sauceName);
  const hasToppings = toppingsList.length > 0;
  const isLarge = selections.size === 'L';

  // Safe nutritional computation
  const baseCal = NUTRITION_ESTIMATES?.baseCalories?.[baseName] || 240;
  const baseProt = NUTRITION_ESTIMATES?.baseProtein?.[baseName] || 4;
  const protCal = proteinName ? (NUTRITION_ESTIMATES?.proteinCalories?.[proteinName] || 190) : 0;
  const protGrams = proteinName ? (NUTRITION_ESTIMATES?.proteinGrams?.[proteinName] || 22) : 0;
  const veggieCal = veggiesCount * (NUTRITION_ESTIMATES?.veggiePortionCalories || 18);
  const extraCal = (hasSauce ? (NUTRITION_ESTIMATES?.sauceCalories || 65) : 0) +
                   (hasToppings ? (NUTRITION_ESTIMATES?.toppingsCalories || 55) : 0);

  const totalCalories = Math.round((baseCal + protCal + veggieCal + extraCal) * (isLarge ? 1.25 : 1));
  const totalProtein = Math.round((baseProt + protGrams + Math.round(veggiesCount * 0.8)) * (isLarge ? 1.25 : 1));

  const legend = [
    { label: baseName, color: BASES[baseKind(baseName)].color },
    ...veggiesList.map(v => ({ label: v, color: VEGGIES[veggieKind(v)].color })),
    proteinName && { label: proteinName, color: PROTEINS[proteinKind(proteinName)].color },
    hasSauce && { label: `Sauce ${sauceName.toLowerCase()}`, color: sauceStyle(sauceName).color },
    ...toppingsList.map(t => ({ label: t, color: TOPPINGS[toppingKind(t)].color })),
    hasGourmand && { label: getName(selections.gourmand[0]), color: '#f4f1e8' }
  ].filter(Boolean);

  return (
    <div className="bowl-visualizer-card">
      <div className="bowl-visualizer-header">
        <div className="row gap-2">
          <HoyaMark size={18} />
          <span className="bowl-visualizer-title">Votre bol</span>
        </div>
        <button
          className={`btn-nutrition-toggle ${showNutrition ? 'active' : ''}`}
          onClick={() => setShowNutrition(!showNutrition)}
          title="Afficher les macros nutritionnelles"
          type="button"
        >
          <Activity size={13} />
          <span>Nutrition</span>
        </button>
      </div>

      <div className="bowl-stage">
        <BowlScene
          baseName={baseName}
          proteinName={proteinName}
          veggiesList={veggiesList}
          toppingsList={toppingsList}
          sauceName={sauceName}
          hasGourmand={hasGourmand}
          isLarge={isLarge}
          label={`Votre bol : ${legend.map(l => l.label).join(', ')}`}
        />
      </div>

      <motion.div className="bowl-legend" layout>
        <AnimatePresence initial={false}>
          {legend.map(l => (
            <motion.span
              key={l.label}
              layout
              className="bowl-legend-chip"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <i style={{ background: l.color }} />
              {l.label}
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Nutrition Drawer / Live Metrics */}
      <div className="bowl-nutrition-strip">
        <div className="nutrition-stat">
          <span className="nutrition-value">{totalCalories}</span>
          <span className="nutrition-label">kcal</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ color: 'var(--green-700)' }}>{totalProtein}g</span>
          <span className="nutrition-label">protéines</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ color: 'var(--gold)' }}>
            {veggiesCount}
          </span>
          <span className="nutrition-label">légumes</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ textTransform: 'uppercase' }}>{selections.size || 'M'}</span>
          <span className="nutrition-label">taille</span>
        </div>
      </div>

      {showNutrition && (
        <motion.div
          className="nutrition-detail-card"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <ShieldCheck size={14} style={{ color: 'var(--green-700)' }} />
            <span className="small" style={{ fontWeight: 600 }}>Équilibre nutritionnel Hoya Poké</span>
          </div>
          <p className="small muted" style={{ margin: 0, fontSize: 12 }}>
            Repas complet à index glycémique modéré, riche en oméga-3 et antioxydants naturels. Sans additifs ni conservateurs.
          </p>
        </motion.div>
      )}
    </div>
  );
}
