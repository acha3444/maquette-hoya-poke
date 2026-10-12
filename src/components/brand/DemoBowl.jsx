import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { BowlScene } from '../BowlVisualizer';

// A bowl that builds itself, step by step, while the section is on screen
const DEMOS = [
  {
    base: 'Riz vinaigré',
    stages: [
      {},
      { veggies: ['Avocat', 'Mangue'] },
      { veggies: ['Avocat', 'Mangue', 'Chou rouge', 'Concombre', 'Radis rose'] },
      { protein: 'Saumon cru mariné' },
      { sauce: 'Sriracha mayo' },
      { toppings: ['Sésames noirs', 'Oignons frits'] }
    ]
  },
  {
    base: 'Base quinoa',
    stages: [
      {},
      { veggies: ['Edamame', 'Ananas'] },
      { veggies: ['Edamame', 'Ananas', 'Carotte', 'Grenade', 'Concombre'] },
      { protein: 'Falafel maison' },
      { sauce: 'Tzatziki' },
      { toppings: ['Graines de courge', 'Sésames'] }
    ]
  }
];

export default function DemoBowl({ className = 'h-demo', bowlClassName = 'h-demo-bowl' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [tick, setTick] = useState({ demo: 0, stage: reduce ? 5 : 0 });

  useEffect(() => {
    if (!inView || reduce) return undefined;
    const last = tick.stage === 5;
    const t = setTimeout(() => {
      setTick(({ demo, stage }) => (stage === 5 ? { demo: (demo + 1) % DEMOS.length, stage: 0 } : { demo, stage: stage + 1 }));
    }, last ? 3600 : tick.stage === 4 ? 2300 : 1300);
    return () => clearTimeout(t);
  }, [inView, reduce, tick]);

  const demo = DEMOS[tick.demo];
  const state = demo.stages.slice(0, tick.stage + 1).reduce((acc, s) => ({ ...acc, ...s }), {});

  return (
    <div ref={ref} className={className}>
      <BowlScene
        className={bowlClassName}
        baseName={demo.base}
        veggiesList={state.veggies || []}
        proteinName={state.protein || ''}
        sauceName={state.sauce || ''}
        toppingsList={state.toppings || []}
        isLarge
        label="Démonstration : un bol se compose"
      />
      <ol className="h-demo-steps" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(i => <li key={i} className={i < tick.stage ? 'on' : ''} />)}
      </ol>
    </div>
  );
}
