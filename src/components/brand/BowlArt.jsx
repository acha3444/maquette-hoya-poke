import { BowlScene } from '../BowlVisualizer';

const BASE_ONLY = ['Riz vinaigré', 'Graines de sésame'];

// Vue de dessus d'un classique, à partir de sa recette
export default function BowlArt({ item, className = 'bowl-art' }) {
  const veggies = (item.ingredients || ['Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas'])
    .filter(i => !BASE_ONLY.includes(i));
  const sesame = /noir/i.test(item.description || '') ? 'Sésames noirs' : 'Sésames';
  return (
    <BowlScene
      still
      className={className}
      proteinName={item.defaultProtein}
      veggiesList={veggies}
      toppingsList={[sesame]}
      sauceName={item.defaultSauce || ''}
      label={`${item.name} vu de dessus`}
    />
  );
}
