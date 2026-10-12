import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Flame, X, Heart } from 'lucide-react';
import { useStore } from '../../store';
import { MENU } from '../../data';
import { formatPrice } from '../../format';
import { ease, list, item as itemVariant } from '../../motion';
import BowlVisualizer from '../../components/BowlVisualizer';

const CUSTOM_STEPS = [
  { id: 'size', title: 'Taille du bol' },
  { id: 'base', title: 'Base', limit: 1, single: true, items: MENU.bases },
  { id: 'fruitsLegumes', title: 'Fruits & légumes', limit: 5, extraPrice: 1.00, items: MENU.fruitsLegumes },
  { id: 'proteine', title: 'Protéine', limit: 1, extraPrice: 1.90, items: MENU.proteines },
  { id: 'sauce', title: 'Sauce', limit: 1, extraPrice: 0.50, items: MENU.sauces },
  { id: 'toppings', title: 'Toppings', limit: 2, extraPrice: 0.50, items: MENU.toppings },
  { id: 'gourmand', title: 'Touche gourmande', hint: 'Facultatif', items: MENU.toppingGourmand }
];

const CLASSIC_STEPS = [
  { id: 'size', title: 'Taille du bol' },
  { id: 'sauce', title: 'Sauce', limit: 1, extraPrice: 0.50, items: MENU.sauces },
  { id: 'remove', title: 'Retirer un ingrédient', hint: 'Facultatif' }
];

const CLASSIC_INGREDIENTS = ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame'];
const REMOVABLE = ['Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas'];

const SIZES = [
  { id: 'M', label: 'Medium', note: 'Un repas complet' },
  { id: 'L', label: 'Large', note: 'Pour les grosses faims' }
];

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.18 } })
};

function Spice({ level }) {
  if (!level) return null;
  return (
    <span className="spice" title={`Piquant ${level}/3`}>
      {[1, 2, 3].map(i => <Flame key={i} size={12} className={i <= level ? 'on' : ''} />)}
    </span>
  );
}

function CheckMark({ on }) {
  return (
    <span className={`check ${on ? 'on' : ''}`}>
      <AnimatePresence initial={false}>
        {on && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
            style={{ display: 'grid' }}
          >
            <Check size={14} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function BuilderScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, outOfStock, favorites, toggleFavorite } = useStore();

  const isCustom = !!location.state?.isCustom;
  const baseItem = location.state?.baseItem;
  const steps = isCustom ? CUSTOM_STEPS : CLASSIC_STEPS;

  const [[stepIndex, direction], setStep] = useState([0, 1]);
  const [favToast, setFavToast] = useState(false);
  const [selections, setSelections] = useState({
    size: 'M',
    base: [],
    fruitsLegumes: [],
    proteine: [],
    sauce: [],
    toppings: [],
    gourmand: [],
    removed: []
  });

  const bowlTitle = isCustom ? 'Mon Poké Sur Mesure' : `Poké ${baseItem?.name?.replace('Le ', '') || ''}`;
  const isFav = favorites.some(f => f.name === bowlTitle);

  const handleToggleFav = () => {
    toggleFavorite({
      name: bowlTitle,
      size: selections.size,
      price: getPrice(),
      composition: isCustom 
        ? selections.fruitsLegumes.map(i => i.name)
        : [baseItem?.name || 'Poké']
    });
    setFavToast(true);
    setTimeout(() => setFavToast(false), 1800);
  };

  if (!isCustom && !baseItem) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="muted">Aucun produit sélectionné.</p>
        <button className="btn btn-primary" onClick={() => navigate('/menu')}>Voir la carte</button>
      </div>
    );
  }

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const getPrice = () => {
    const extra = (list, included, unit) => Math.max(0, (list?.length || 0) - included) * (unit || 0);
    if (isCustom) {
      let price = selections.size === 'M' ? MENU.surMesureBase.priceM : MENU.surMesureBase.priceL;
      selections.base.forEach(b => { price += b.price || 0; });
      price += extra(selections.fruitsLegumes, 5, 1.00);
      price += extra(selections.proteine, 1, 1.90);
      price += extra(selections.sauce, 1, 0.50);
      price += extra(selections.toppings, 2, 0.50);
      selections.gourmand.forEach(g => { price += g.price || 0; });
      return price;
    }
    return (selections.size === 'M' ? baseItem.priceM : baseItem.priceL) + extra(selections.sauce, 1, 0.50);
  };

  const toggle = (item) => {
    setSelections(prev => {
      const current = prev[step.id] || [];
      if (current.some(i => i.id === item.id)) {
        return { ...prev, [step.id]: current.filter(i => i.id !== item.id) };
      }
      if (step.single || step.id === 'base') {
        return { ...prev, [step.id]: [item] };
      }
      return { ...prev, [step.id]: [...current, item] };
    });
  };

  const toggleRemoved = (name) => {
    setSelections(prev => ({
      ...prev,
      removed: prev.removed.includes(name) ? prev.removed.filter(i => i !== name) : [...prev.removed, name]
    }));
  };

  const canProceed = () => {
    if (['base', 'proteine', 'sauce'].includes(step.id)) return selections[step.id].length > 0;
    return true;
  };

  const goBack = () => {
    if (stepIndex > 0) setStep([stepIndex - 1, -1]);
    else navigate(-1);
  };

  const next = () => {
    if (!isLast) {
      setStep([stepIndex + 1, 1]);
      return;
    }

    let composition = [];
    if (isCustom) {
      selections.base.forEach(b => composition.push(b.name));
      selections.fruitsLegumes.forEach((fl, idx) => {
        composition.push(idx >= 5 ? `${fl.name} (Supp. +1,00€)` : fl.name);
      });
      selections.proteine.forEach((p, idx) => {
        composition.push(idx >= 1 ? `${p.name} (Supp. +1,90€)` : p.name);
      });
      selections.sauce.forEach((s, idx) => {
        composition.push(idx >= 1 ? `Sauce ${s.name} (Supp. +0,50€)` : `Sauce ${s.name}`);
      });
      selections.toppings.forEach((t, idx) => {
        composition.push(idx >= 2 ? `${t.name} (Supp. +0,50€)` : t.name);
      });
      selections.gourmand.forEach(g => {
        composition.push(`${g.name} (+${formatPrice(g.price)})`);
      });
    } else {
      const names = (key) => selections[key].map(i => i.name);
      composition = [...CLASSIC_INGREDIENTS, baseItem.defaultProtein, ...names('sauce')].filter(i => !selections.removed.includes(i));
    }

    addToCart({
      cartName: `${isCustom ? 'Poké Sur Mesure' : `Poké ${baseItem.name.replace('Le ', '')}`} (${selections.size})`,
      price: getPrice(),
      composition,
      removedIngredients: selections.removed
    });
    navigate('/menu');
  };

  const limitText = () => {
    if (!step.limit) return step.hint || null;
    const count = (selections[step.id] || []).length;
    const limit = step.limit;
    const extraPrice = step.extraPrice || 0;

    if (count < limit) {
      const remaining = limit - count;
      return `${count} sur ${limit} inclus (${remaining} restant${remaining > 1 ? 's' : ''})`;
    }
    if (count === limit) {
      return `${count} sur ${limit} inclus · Tout ingrédient suivant sera en supplément (+${formatPrice(extraPrice)})`;
    }
    const nbSupp = count - limit;
    return `${count} sélectionnés (${limit} inclus + ${nbSupp} supplément${nbSupp > 1 ? 's' : ''} : +${formatPrice(nbSupp * extraPrice)})`;
  };

  const renderOptions = () => {
    if (step.id === 'size') {
      const prices = isCustom ? MENU.surMesureBase : baseItem;
      return (
        <div className="size-grid">
          {SIZES.map(s => {
            const on = selections.size === s.id;
            return (
              <motion.button key={s.id} whileTap={{ scale: 0.98 }} className={`option size-option ${on ? 'selected' : ''}`} onClick={() => setSelections(p => ({ ...p, size: s.id }))}>
                <div className="row between" style={{ width: '100%' }}>
                  <span className="display" style={{ fontSize: 30 }}>{s.id}</span>
                  <CheckMark on={on} />
                </div>
                <span style={{ fontWeight: 700 }}>{s.label}</span>
                <span className="muted small">{s.note}</span>
                <span className="price small" style={{ marginTop: 6 }}>{formatPrice(s.id === 'M' ? prices.priceM : prices.priceL)}</span>
              </motion.button>
            );
          })}
        </div>
      );
    }

    if (step.id === 'remove') {
      return (
        <motion.div className="option-list" variants={list} initial="initial" animate="animate">
          {REMOVABLE.map(name => {
            const removed = selections.removed.includes(name);
            return (
              <motion.button key={name} variants={itemVariant} whileTap={{ scale: 0.98 }} className={`option ${removed ? 'removed' : ''}`} onClick={() => toggleRemoved(name)}>
                <span className="option-name">{name}</span>
                {removed ? <span className="tag tag-danger">Retiré</span> : <X size={16} className="muted" />}
              </motion.button>
            );
          })}
        </motion.div>
      );
    }

    const current = selections[step.id] || [];
    const limit = step.limit || 0;
    const isLimitReached = limit > 0 && current.length >= limit;

    return (
      <motion.div className="option-list" variants={list} initial="initial" animate="animate">
        {step.items.filter(i => !outOfStock.includes(i.id)).map(item => {
          const selectedIndex = current.findIndex(i => i.id === item.id);
          const isSelected = selectedIndex !== -1;
          const isExtraItem = isSelected && limit > 0 && selectedIndex >= limit;

          let badgeText = null;
          let badgeClass = 'tag-neutral';

          if (isSelected) {
            if (isExtraItem) {
              const extraCost = item.supplementPrice || step.extraPrice || 0;
              badgeText = `Supplément +${formatPrice(extraCost)}`;
              badgeClass = 'tag-gold';
            } else {
              badgeText = 'Inclus';
              badgeClass = 'tag-green';
            }
          } else {
            if (item.price && item.price > 0) {
              badgeText = `+${formatPrice(item.price)}`;
              badgeClass = 'tag-gold';
            } else if (isLimitReached && step.extraPrice) {
              const extraCost = item.supplementPrice || step.extraPrice;
              badgeText = `+${formatPrice(extraCost)} (Supplément)`;
              badgeClass = 'tag-gold-outline';
            } else if (limit > 0) {
              badgeText = 'Inclus';
              badgeClass = 'tag-neutral';
            }
          }

          return (
            <motion.button 
              key={item.id} 
              variants={itemVariant} 
              whileTap={{ scale: 0.98 }} 
              className={`option ${isSelected ? 'selected' : ''} ${isExtraItem ? 'option-extra' : ''}`} 
              onClick={() => toggle(item)}
            >
              <span className="col gap-1">
                <span className="option-name" style={{ fontWeight: isSelected ? 700 : 500 }}>
                  {item.name}
                </span>
                <Spice level={item.spice} />
              </span>

              <span className="row gap-2" style={{ alignItems: 'center' }}>
                {badgeText && (
                  <span 
                    className={`tag ${badgeClass}`} 
                    style={{ 
                      fontSize: 11, 
                      fontWeight: badgeClass.includes('gold') ? 800 : 600,
                      padding: '2px 8px' 
                    }}
                  >
                    {badgeText}
                  </span>
                )}
                <CheckMark on={isSelected} />
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    );
  };

  const progress = (stepIndex + 1) / steps.length;

  return (
    <div className="screen narrow">
      <div className="topbar">
        <button className="icon-btn" onClick={goBack} aria-label="Retour">
          <ArrowLeft size={20} />
        </button>
        <span className="topbar-title">{isCustom ? 'Le Sur Mesure' : baseItem.name}</span>
        <button 
          className="icon-btn" 
          onClick={handleToggleFav} 
          aria-label="Ajouter aux favoris" 
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          style={{ color: isFav ? '#e05353' : 'var(--muted)' }}
        >
          <Heart size={20} fill={isFav ? '#e05353' : 'none'} />
        </button>
      </div>

      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.5, ease }}
        />
      </div>

      <nav className="stepper" aria-label="Étapes">
        {steps.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <button
              key={s.id}
              className={active ? 'active' : done ? 'done' : ''}
              disabled={!done}
              onClick={() => setStep([i, -1])}
            >
              {active && <motion.span layoutId="step-pill" className="step-pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <span>
                <span className="step-num">{done ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                {s.title}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="scroll">
        <div style={{ padding: '14px var(--gutter) 0' }}>
          <BowlVisualizer selections={selections} isCustom={isCustom} baseItem={baseItem} classicIngredients={REMOVABLE} />
          {favToast && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'rgba(224, 83, 83, 0.1)',
                color: '#c23b3b',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                margin: '8px 0 0'
              }}
            >
              {isFav ? '❤️ Recette ajoutée à vos favoris Poké Club !' : 'Recette retirée de vos favoris.'}
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            className="col gap-4 section"
          >
            <div className="col gap-1">
              <span className="eyebrow builder-eyebrow">Étape {stepIndex + 1} sur {steps.length}</span>
              <h1 className="display" style={{ fontSize: 30 }}>{step.title}</h1>
              {limitText() && <p className="muted small">{limitText()}</p>}
            </div>
            {renderOptions()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bottom-bar split">
        <div className="bb-total">
          <span className="muted">Total</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={getPrice().toFixed(2)}
              className="price"
              style={{ fontSize: 20 }}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {formatPrice(getPrice())}
            </motion.span>
          </AnimatePresence>
        </div>
        <motion.button className="btn btn-primary btn-block" disabled={!canProceed()} onClick={next} whileTap={{ scale: 0.98 }}>
          {isLast ? 'Ajouter au panier' : 'Continuer'}
          {!isLast && <ArrowRight size={16} />}
        </motion.button>
      </div>
    </div>
  );
}
