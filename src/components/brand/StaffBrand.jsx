import HoyaMark from './HoyaMark';

// En-tête de marque commun aux apps équipe (cuisine, admin, livreur)
export default function StaffBrand({ label, sub, compact = false }) {
  return (
    <div className={`staff-brand ${compact ? 'compact' : ''}`}>
      <span className="staff-brand-mark"><HoyaMark size={compact ? 18 : 22} /></span>
      <span className="staff-brand-text">
        <span className="staff-brand-name">Hoya Poké <em>{label}</em></span>
        {sub && <span className="staff-brand-sub">{sub}</span>}
      </span>
    </div>
  );
}
