import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Flame, X } from 'lucide-react';
import { useStore } from '../../store';
import { MENU } from '../../data';
import { formatPrice } from '../../format';
import { ease, list, item as itemVariant } from '../../motion';

const CUSTOM_STEPS = [
  { id: 'size', title: 'Taille du bol' },
  { id: 'base', title: 'Base', limit: 1, single: true, items: MENU.bases },
  { id: 'fruitsLegumes', title: 'Fruits & légumes', limit: 5, items: MENU.fruitsLegumes },
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
  const { addToCart, outOfStock } = useStore();

  const isCustom = !!location.state?.isCustom;
  const baseItem = location.state?.baseItem;
  const steps = isCustom ? CUSTOM_STEPS : CLASSIC_STEPS;

  const [[stepIndex, direction], setStep] = useState([0, 1]);
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
    const extra = (list, included, unit) => Math.max(0, list.length - included) * unit;
    if (isCustom) {
      let price = selections.size === 'M' ? MENU.surMesureBase.priceM : MENU.surMesureBase.priceL;
      selections.base.forEach(b => { price += b.price || 0; });
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
      const current = prev[step.id];
      if (current.some(i => i.id === item.id)) {
        return { ...prev, [step.id]: current.filter(i => i.id !== item.id) };
      }
      if (step.single) return { ...prev, [step.id]: [item] };
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
    const names = (key) => selections[key].map(i => i.name);
    const composition = isCustom
      ? [...names('base'), ...names('fruitsLegumes'), ...names('proteine'), ...names('sauce'), ...names('toppings'), ...names('gourmand')]
      : [...CLASSIC_INGREDIENTS, baseItem.defaultProtein, ...names('sauce')].filter(i => !selections.removed.includes(i));

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
    const count = selections[step.id].length;
    if (count <= step.limit) return `${count} sur ${step.limit} inclus`;
    return `${count} choisis · supplément de ${formatPrice((count - step.limit) * step.extraPrice)}`;
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

    const current = selections[step.id];
    return (
      <motion.div className="option-list" variants={list} initial="initial" animate="animate">
        {step.items.filter(i => !outOfStock.includes(i.id)).map(item => {
          const on = current.some(i => i.id === item.id);
          let extraPrice = item.price || 0;
          if (!extraPrice && step.limit && current.length >= step.limit && !on && step.extraPrice) {
            extraPrice = step.extraPrice;
          }
          return (
            <motion.button key={item.id} variants={itemVariant} whileTap={{ scale: 0.98 }} className={`option ${on ? 'selected' : ''}`} onClick={() => toggle(item)}>
              <span className="col gap-1">
                <span className="option-name" style={{ fontWeight: on ? 700 : 500 }}>{item.name}</span>
                <Spice level={item.spice} />
              </span>
              <span className="row gap-3">
                {extraPrice > 0 && !on && <span className="small" style={{ color: 'var(--gold-ink)', fontWeight: 700 }}>+{formatPrice(extraPrice)}</span>}
                <CheckMark on={on} />
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
        <span />
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
