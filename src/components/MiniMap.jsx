import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ROUTE = 'M 70 60 L 70 120 Q 70 140 90 140 L 210 140 Q 230 140 230 160 L 230 190 Q 230 200 240 200 L 330 200';

const BLOCKS = [
  [16, 16, 40, 30], [84, 16, 110, 30], [222, 16, 70, 50], [306, 16, 80, 50],
  [16, 74, 40, 110], [84, 74, 110, 52], [206, 82, 90, 44], [312, 82, 74, 100],
  [84, 156, 130, 30], [16, 200, 200, 30], [252, 150, 46, 36], [252, 214, 134, 20]
];

export default function MiniMap({ progress = 0, height = 200, started = true }) {
  const pathRef = useRef(null);
  const [geo, setGeo] = useState({ length: 0, point: { x: 70, y: 60 } });

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    const p = path.getPointAtLength(length * Math.min(1, Math.max(0, progress)));
    setGeo({ length, point: { x: p.x, y: p.y } });
  }, [progress]);

  return (
    <div className="minimap" style={{ height }}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">
        <rect width="400" height="240" fill="#ece5da" />
        <path d="M 0 236 C 120 228 200 246 400 232 L 400 240 L 0 240 Z" fill="#cfe0dc" />
        {BLOCKS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="4" fill={i === 6 ? '#dfe8d9' : '#e2d9cc'} />
        ))}
        <path ref={pathRef} d={ROUTE} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {geo.length > 0 && (
          <path
            d={ROUTE}
            fill="none"
            stroke="var(--green-700)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={geo.length}
            strokeDashoffset={geo.length * (1 - (started ? progress : 0))}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        )}
        <g transform="translate(70 60)">
          <circle r="9" fill="var(--gold)" stroke="#fff" strokeWidth="3" />
        </g>
        <g transform="translate(330 200)">
          <circle r="9" fill="var(--green-700)" stroke="#fff" strokeWidth="3" />
        </g>
        {started && (
          <g style={{ transform: `translate(${geo.point.x}px, ${geo.point.y}px)`, transition: 'transform 1s linear' }}>
            <motion.circle
              r="14"
              fill="var(--green-700)"
              opacity="0.18"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            <circle r="7" fill="#fff" stroke="var(--green-700)" strokeWidth="3" />
          </g>
        )}
      </svg>
      <div className="minimap-legend">
        <span><i style={{ background: 'var(--gold)' }} /> Restaurant</span>
        <span><i style={{ background: 'var(--green-700)' }} /> Client</span>
      </div>
    </div>
  );
}
