import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { NUTRITION_ESTIMATES } from '../data';

// Helper to safely extract string name whether item is an Object or a String
const getName = (item, defaultName = '') => {
  if (!item) return defaultName;
  if (typeof item === 'string') return item;
  return item.name || defaultName;
};

export default function BowlVisualizer({ selections = {}, isCustom = true, baseItem }) {
  const [showNutrition, setShowNutrition] = useState(false);

  // Safely extract string names
  const rawBase = selections.base?.[0];
  const baseName = getName(rawBase, 'Riz vinaigré');

  const rawProtein = selections.proteine?.[0];
  const defaultProtName = getName(baseItem?.defaultProtein, 'Saumon cru mariné');
  const proteinName = getName(rawProtein, defaultProtName);

  const rawSauce = selections.sauce?.[0];
  const sauceName = getName(rawSauce, '');

  const veggiesList = (selections.fruitsLegumes || []).map(v => getName(v)).filter(Boolean);
  const toppingsList = (selections.toppings || []).map(t => getName(t)).filter(Boolean);

  const veggiesCount = veggiesList.length;
  const hasSauce = Boolean(sauceName);
  const hasToppings = toppingsList.length > 0;

  // Safe nutritional computation
  const baseCal = NUTRITION_ESTIMATES?.baseCalories?.[baseName] || 240;
  const baseProt = NUTRITION_ESTIMATES?.baseProtein?.[baseName] || 4;
  const protCal = NUTRITION_ESTIMATES?.proteinCalories?.[proteinName] || 190;
  const protGrams = NUTRITION_ESTIMATES?.proteinGrams?.[proteinName] || 22;
  const veggieCal = veggiesCount * (NUTRITION_ESTIMATES?.veggiePortionCalories || 18);
  const extraCal = (hasSauce ? (NUTRITION_ESTIMATES?.sauceCalories || 65) : 0) + 
                   (hasToppings ? (NUTRITION_ESTIMATES?.toppingsCalories || 55) : 0);

  const isLarge = selections.size === 'L';
  const totalCalories = Math.round((baseCal + protCal + veggieCal + extraCal) * (isLarge ? 1.25 : 1));
  const totalProtein = Math.round((baseProt + protGrams + Math.round(veggiesCount * 0.8)) * (isLarge ? 1.25 : 1));

  // Determine colors safely
  const getBaseColor = () => {
    const s = baseName.toLowerCase();
    if (s.includes('quinoa')) return '#d8b979';
    if (s.includes('carotte')) return '#e0833a';
    return '#f4eee4'; // Sushi rice
  };

  const getProteinColor = () => {
    const p = proteinName.toLowerCase();
    if (p.includes('saumon')) return '#fa7960';
    if (p.includes('poulet')) return '#c68437';
    if (p.includes('falafel')) return '#7d6342';
    return '#fa7960';
  };

  const getSauceColor = () => {
    const s = sauceName.toLowerCase();
    if (s.includes('sriracha') || s.includes('pik') || s.includes('wasabi')) return 'rgba(235, 78, 43, 0.85)';
    if (s.includes('tzatziki')) return 'rgba(240, 248, 245, 0.9)';
    if (s.includes('cacahuète') || s.includes('cacahuete')) return 'rgba(200, 140, 70, 0.85)';
    return 'rgba(60, 35, 20, 0.8)'; // Soja
  };

  return (
    <div className="bowl-visualizer-card">
      <div className="bowl-visualizer-header">
        <div className="row gap-2">
          <Sparkles size={16} style={{ color: 'var(--gold)' }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-900)' }}>
            Aperçu en direct de votre bol
          </span>
        </div>
        <button 
          className={`btn-nutrition-toggle ${showNutrition ? 'active' : ''}`}
          onClick={() => setShowNutrition(!showNutrition)}
          title="Afficher les macros nutritionnelles"
          type="button"
        >
          <Activity size={13} />
          <span>{showNutrition ? 'Masquer nutrition' : 'Valeurs nutritionnelles'}</span>
        </button>
      </div>

      {/* Visual Bowl Render */}
      <div className="bowl-stage">
        <motion.div 
          className="bowl-outer"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Ceramic / Coconut Rim */}
          <div className="bowl-rim">
            {/* Base Layer */}
            <motion.div 
              className="bowl-base-layer"
              style={{ background: getBaseColor() }}
              key={baseName}
              initial={{ opacity: 0.5, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <span className="base-tag-pill">{baseName}</span>
            </motion.div>

            {/* Veggies & Fruits Segments around */}
            <div className="bowl-veggies-container">
              <AnimatePresence>
                {veggiesList.map((vegName, index) => {
                  const total = Math.max(1, veggiesList.length);
                  const angle = (index / total) * 360;
                  const radius = 58;
                  const x = Math.round(radius * Math.cos((angle * Math.PI) / 180));
                  const y = Math.round(radius * Math.sin((angle * Math.PI) / 180));

                  return (
                    <motion.div
                      key={vegName + index}
                      className="bowl-topping-bubble"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {vegName}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Protein in Center */}
            <motion.div 
              className="bowl-protein-center"
              style={{ background: getProteinColor() }}
              key={proteinName}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            >
              <div className="protein-label">{proteinName}</div>
            </motion.div>

            {/* Sauce Swirl Drizzle */}
            {hasSauce && (
              <motion.div 
                className="bowl-sauce-drizzle"
                style={{ borderColor: getSauceColor() }}
                key={sauceName}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              />
            )}

            {/* Toppings Sprinkles */}
            {hasToppings && (
              <motion.div 
                className="bowl-toppings-sprinkle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span>✨ {toppingsList.join(' · ')}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sauce Indicator Pill if selected */}
      {hasSauce && (
        <div style={{ textAlign: 'center', marginTop: -6, marginBottom: 4 }}>
          <span className="tag tag-gold" style={{ fontSize: 11, padding: '3px 10px' }}>
            Sauce : {sauceName}
          </span>
        </div>
      )}

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
