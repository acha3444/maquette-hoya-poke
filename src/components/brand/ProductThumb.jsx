import { CakeSlice, CupSoda, Coffee, Drumstick, Cookie, Fish, Droplet, Carrot, Sprout } from 'lucide-react';
import BowlArt from './BowlArt';
import HoyaMark from './HoyaMark';

const ICONS = {
  proteines: Fish,
  sauces: Droplet,
  fruitsLegumes: Carrot,
  toppings: Sprout,
  sides: Drumstick,
  desserts: CakeSlice,
  boissons: CupSoda
};

// Vignette produit : photo si elle existe, sinon le bol vu de dessus pour un poké, sinon un picto teinté
export default function ProductThumb({ item, category = item.category, className = '' }) {
  if (item.image) {
    return <span className={`product-thumb ${className}`}><img src={item.image} alt="" /></span>;
  }
  if ((category === 'classiques' || item.isPoke) && item.defaultProtein) {
    return (
      <span className={`product-thumb bowl ${className}`}>
        <BowlArt item={item} className="product-thumb-bowl" />
      </span>
    );
  }
  const name = (item.name || '').toLowerCase();
  const Icon = name.includes('cookie') ? Cookie
    : category === 'boissons' && /caf|latte/.test(name) ? Coffee
    : ICONS[category];
  return (
    <span className={`product-thumb cat-${category || 'divers'} ${className}`}>
      {Icon ? <Icon size={22} strokeWidth={1.75} /> : <HoyaMark size={22} />}
    </span>
  );
}
