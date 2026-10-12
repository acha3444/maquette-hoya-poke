// Branche feuillue au trait, comme sur les visuels Instagram de Hoya
const leaf = (x, y, angle, l) => {
  const w = l * 0.3;
  return (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={`M0 0C${l * 0.3} ${-w} ${l * 0.72} ${-w} ${l} 0C${l * 0.72} ${w} ${l * 0.3} ${w} 0 0Z`} />
      <path d={`M${l * 0.12} 0L${l * 0.82} 0`} />
      <path d={`M${l * 0.35} 0L${l * 0.5} ${-w * 0.55}M${l * 0.55} 0L${l * 0.68} ${w * 0.5}`} />
    </g>
  );
};

const LEAVES = [
  [99, 252, -142, 56], [98, 218, -38, 54], [99, 178, -152, 50],
  [98, 142, -28, 50], [96, 104, -140, 44], [94, 72, -42, 40], [92, 24, -96, 32]
];

export default function Branch({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 200 300"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M100 296C96 222 104 150 92 24" />
      {LEAVES.map(([x, y, a, l]) => leaf(x, y, a, l))}
    </svg>
  );
}
