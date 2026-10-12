import { motion } from 'framer-motion';

const PATHS = [
  'M8 61.6C35 60.8 62 60 88.6 59C88.2 82 71 98.2 49 98.6C27 98.2 9 83.2 8 61.6Z',
  'M50.5 5.5C50 30 49.6 58 50 80',
  'M11 43.6C35 42.6 65 40.2 92.5 38.6',
  'M48.6 36.8L25 18.2',
  'M49.6 36L77.5 15.6'
];

// Le picto Hoya qui se dessine trait par trait (confirmation de commande)
export default function AnimatedMark({ size = 72, strokeWidth = 9, delay = 0, className }) {
  return (
    <svg className={className} width={size} height={size * 1.06} viewBox="0 0 100 106" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: delay + i * 0.22, duration: i === 0 ? 0.7 : 0.4, ease: [0.65, 0, 0.35, 1], opacity: { delay: delay + i * 0.22, duration: 0.01 } }}
        />
      ))}
    </svg>
  );
}
