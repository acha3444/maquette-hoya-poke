import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Flame, ShieldCheck, Heart } from 'lucide-react';
import { NUTRITION_ESTIMATES } from '../data';

export default function BowlVisualizer({ selections, isCustom, baseItem }) {
  const [showNutrition, setShowNutrition] = useState(false);

  // Compute live calories & protein
  const baseName = selections.base?.[0] || 'Riz vinaigré';
  const proteinName = selections.proteine?.[0] || (baseItem?.defaultProtein || 'Saumon cru mariné');
  const veggiesCount = selections.fruitsLegumes?.length || 0;
  const hasSauce = (selections.sauce?.length || 0) > 0;
  const hasToppings = (selections.toppings?.length || 0) > 0;

  const baseCal = NUTRITION_ESTIMATES.baseCalories[baseName] || 240;
  const baseProt = NUTRITION_ESTIMATES.baseProtein[baseName] || 4;
  const protCal = NUTRITION_ESTIMATES.proteinCalories[proteinName] || 190;
  const protGrams = NUTRITION_ESTIMATES.proteinGrams[proteinName] || 22;
  const veggieCal = veggiesCount * NUTRITION_ESTIMATES.veggiePortionCalories;
  const extraCal = (hasSauce ? NUTRITION_ESTIMATES.sauceCalories : 0) + (hasToppings ? NUTRITION_ESTIMATES.toppingsCalories : 0);

  const totalCalories = Math.round((baseCal + protCal + veggieCal + extraCal) * (selections.size === 'L' ? 1.25 : 1));
  const totalProtein = Math.round((baseProt + protGrams + Math.round(veggiesCount * 0.8)) * (selections.size === 'L' ? 1.25 : 1));

  // Determine colors based on selections
  const getBaseColor = () => {
    if (baseName.includes('quinoa')) return '#d8b979';
    if (baseName.includes('carotte')) return '#e0833a';
    return '#f4eee4'; // Sushi rice
  };

  const getProteinColor = () => {
    if (proteinName.includes('Saumon')) return '#fa7960';
    if (proteinName.includes('Poulet')) return '#c68437';
    if (proteinName.includes('Falafel')) return '#7d6342';
    return '#fa7960';
  };

  const getSauceColor = () => {
    const s = selections.sauce?.[0] || '';
    if (s.includes('Sriracha') || s.includes('pik')) return 'rgba(235, 78, 43, 0.75)';
    if (s.includes('Tzatziki')) return 'rgba(240, 248, 245, 0.85)';
    if (s.includes('cacahuète')) return 'rgba(200, 140, 70, 0.8)';
    return 'rgba(60, 35, 20, 0.75)'; // Soja
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
          transition={{ duration: 0.4 }}
        >
          {/* Ceramic / Coconut Rim */}
          <div className="bowl-rim">
            {/* Base Layer */}
            <motion.div 
              className="bowl-base-layer"
              style={{ background: getBaseColor() }}
              key={baseName}
              initial={{ opacity: 0.4, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="base-tag-pill">{baseName}</span>
            </motion.div>

            {/* Veggies & Fruits Segments around */}
            <div className="bowl-veggies-container">
              <AnimatePresence>
                {(selections.fruitsLegumes || []).map((veg, index) => {
                  const total = Math.max(1, selections.fruitsLegumes.length);
                  const angle = (index / total) * 360;
                  const radius = 58;
                  const x = Math.round(radius * Math.cos((angle * Math.PI) / 180));
                  const y = Math.round(radius * Math.sin((angle * Math.PI) / 180));

                  return (
                    <motion.div
                      key={veg}
                      className="bowl-topping-bubble"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {veg}
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
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            >
              <div className="protein-label">{proteinName}</div>
            </motion.div>

            {/* Sauce Swirl Drizzle */}
            {selections.sauce?.[0] && (
              <motion.div 
                className="bowl-sauce-drizzle"
                style={{ borderColor: getSauceColor() }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Toppings Sprinkles */}
            {selections.toppings?.length > 0 && (
              <motion.div 
                className="bowl-toppings-sprinkle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span>✨ {selections.toppings.join(' · ')}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Nutrition Drawer / Live Metrics */}
      <div className="bowl-nutrition-strip">
        <div className="nutrition-stat">
          <span className="nutrition-value">{totalCalories}</span>
          <span className="nutrition-label">kcal estimées</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ color: 'var(--green-700)' }}>{totalProtein}g</span>
          <span className="nutrition-label">protéines</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ color: 'var(--gold)' }}>
            {selections.fruitsLegumes?.length || 0}/5
          </span>
          <span className="nutrition-label">légumes frais</span>
        </div>
        <div className="nutrition-stat">
          <span className="nutrition-value" style={{ textTransform: 'uppercase' }}>{selections.size || 'M'}</span>
          <span className="nutrition-label">format</span>
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
