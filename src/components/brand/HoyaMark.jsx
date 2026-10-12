// Le picto Hoya (bol + pousse), retracé à la main d'après le logo officiel
export default function HoyaMark({ size = 28, strokeWidth = 10.5, className, title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.06}
      viewBox="0 0 100 106"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M50.5 5.5C50 30 49.6 58 50 80" />
      <path d="M48.6 36.8L25 18.2" />
      <path d="M49.6 36L77.5 15.6" />
      <path d="M11 43.6C35 42.6 65 40.2 92.5 38.6" />
      <path d="M8 61.6C35 60.8 62 60 88.6 59C88.2 82 71 98.2 49 98.6C27 98.2 9 83.2 8 61.6Z" />
    </svg>
  );
}
