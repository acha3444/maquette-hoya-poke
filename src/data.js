export const MENU = {
  classiques: [
    { id: 'c1', name: 'Le Saumon', description: 'Saumon cru mariné, ananas, avocat, edamame', priceM: 11.90, priceL: 14.90, defaultProtein: 'Saumon cru mariné', defaultSauce: 'Soja sucrée', ingredients: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame'] },
    { id: 'c2', name: 'Le Poulet', description: 'Poulet frit maison, carotte, concombre, sriracha mayo', priceM: 11.90, priceL: 14.90, defaultProtein: 'Poulet frit maison', defaultSauce: 'Sriracha mayo', ingredients: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame'] },
    { id: 'c3', name: 'Le Falafel', description: 'Falafels maison, tzatziki, grenade, concombre', priceM: 11.90, priceL: 14.90, defaultProtein: 'Falafels maison', defaultSauce: 'Tzatziki', ingredients: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame'] },
    { id: 'c4', name: 'Le Thon Rouge', description: 'Thon rouge mariné, mangue, avocat, sésames noirs', priceM: 12.90, priceL: 15.90, defaultProtein: 'Thon rouge mariné', defaultSauce: 'Soja salée', ingredients: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Mangue', 'Graines de sésame'] }
  ],
  surMesureBase: { name: 'Le Sur Mesure', priceM: 12.90, priceL: 15.90 },
  bases: [
    { id: 'b1', name: 'Riz vinaigré', price: 0 },
    { id: 'b2', name: 'Base carotte', price: 0 },
    { id: 'b3', name: 'Base quinoa', price: 1.00 }
  ],
  fruitsLegumes: [
    { id: 'fl1', name: 'Carotte' },
    { id: 'fl2', name: 'Oignon rouge' },
    { id: 'fl3', name: 'Concombre' },
    { id: 'fl4', name: 'Radis rose' },
    { id: 'fl5', name: 'Avocat' },
    { id: 'fl6', name: 'Edamame' },
    { id: 'fl7', name: 'Chou rouge' },
    { id: 'fl8', name: 'Chou blanc' },
    { id: 'fl9', name: 'Betterave' },
    { id: 'fl10', name: 'Mangue' },
    { id: 'fl11', name: 'Ananas' },
    { id: 'fl12', name: 'Grenade' },
    { id: 'fl13', name: 'Fruit de la passion' },
    { id: 'fl14', name: 'Raisins secs' }
  ],
  proteines: [
    { id: 'p1', name: 'Saumon cru mariné', supplementPrice: 1.90 },
    { id: 'p2', name: 'Poulet frit maison', supplementPrice: 1.90 },
    { id: 'p3', name: 'Falafel maison', supplementPrice: 1.90 },
    { id: 'p4', name: 'Thon rouge mariné', supplementPrice: 1.90 }
  ],
  sauces: [
    { id: 's1', name: 'Soja sucrée', spice: 0, supplementPrice: 0.50 },
    { id: 's2', name: 'Soja salée', spice: 0, supplementPrice: 0.50 },
    { id: 's3', name: 'Crème cacahuète', spice: 0, supplementPrice: 0.50 },
    { id: 's4', name: 'Tzatziki', spice: 0, supplementPrice: 0.50 },
    { id: 's5', name: 'Coco pik', spice: 1, supplementPrice: 0.50 },
    { id: 's6', name: 'Sriracha mayo', spice: 2, supplementPrice: 0.50 },
    { id: 's7', name: 'Mayo wasabi', spice: 2, supplementPrice: 0.50 },
    { id: 's8', name: 'Sriracha', spice: 3, supplementPrice: 0.50 }
  ],
  toppings: [
    { id: 't1', name: 'Sésames', supplementPrice: 0.50 },
    { id: 't2', name: 'Sésames noirs', supplementPrice: 0.50 },
    { id: 't3', name: 'Cacahuètes', supplementPrice: 0.50 },
    { id: 't4', name: 'Oignons frits', supplementPrice: 0.50 },
    { id: 't5', name: 'Graines de courge', supplementPrice: 0.50 },
    { id: 't6', name: 'Maïs grillé', supplementPrice: 0.50 }
  ],
  toppingGourmand: [
    { id: 'tg1', name: 'Fromage frais combava et citron vert', price: 0.90 }
  ],
  sides: [
    { id: 'sd1', name: 'Cornet de falafels et sa sauce', price: 5.90 },
    { id: 'sd2', name: 'Cornet de poulet et sa sauce', price: 5.90 }
  ],
  desserts: [
    { id: 'd1', name: 'Tiramisu spéculoos', price: 4.50, bestseller: true },
    { id: 'd2', name: 'Banoffee', price: 4.50 },
    { id: 'd3', name: 'Pudding chia coco mangue citron vert', price: 4.50 },
    { id: 'd4', name: 'Cheesecake mangue spéculoos', price: 4.50 },
    { id: 'd5', name: 'Panna cotta mûres', price: 4.50 },
    { id: 'd6', name: 'Tiramisu crème de marron et praliné noisette', price: 4.50 },
    { id: 'd7', name: 'Tiramisu pêche', price: 4.50 }
  ],
  boissons: [
    { id: 'bo1', name: 'Thé pétillant artisanal', price: 3.50 },
    { id: 'bo2', name: 'Eau plate', price: 2.00 },
    { id: 'bo3', name: 'Eau pétillante', price: 2.00 },
    { id: 'bo4', name: 'Café', price: 1.80 },
    { id: 'bo5', name: 'Latte', price: 3.50 },
    { id: 'bo6', name: 'Cookie chocolat au lait', price: 3.00 }
  ]
};

export const INITIAL_ORDERS = [
  {
    id: '1047',
    status: 'NOUVELLE', // NOUVELLE, PREPARATION, PRETE, LIVRAISON, TERMINEE
    type: 'LIVRAISON',
    time: '12:30',
    customerName: 'Thomas',
    customerPhone: '06 00 00 00 01',
    address: '7 rue Anatole France, Pézenas',
    zone: 1,
    deliveryFee: 2.50,
    total: 37.20,
    paymentStatus: 'PAYÉ',
    items: [
      {
        name: 'Poké Classique Saumon',
        size: 'L',
        price: 14.90,
        removedIngredients: ['Ananas'],
        composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Graines de sésame', 'Saumon cru mariné']
      },
      {
        name: 'Poké Sur Mesure',
        size: 'M',
        price: 13.90, // Base M (12.90) + quinoa (1.00)
        composition: ['Base quinoa', 'Carotte', 'Avocat', 'Edamame', 'Mangue', 'Grenade', 'Falafel maison', 'Crème cacahuète', 'Sésames noirs', 'Oignons frits']
      },
      {
        name: 'Cornet de poulet',
        price: 5.90,
        composition: ['Cornet de poulet', 'Sauce au choix']
      }
    ]
  },
  {
    id: '1046',
    status: 'PREPARATION',
    type: 'RETRAIT',
    time: '12:15',
    customerName: 'Julie',
    customerPhone: '06 00 00 00 02',
    total: 13.90,
    paymentStatus: 'À ENCAISSER',
    items: [
      { name: 'Formule Poké + Boisson', price: 13.90, composition: ['Poké Classique Poulet (M)', 'Eau pétillante'] }
    ]
  },
  {
    id: '1045',
    status: 'LIVRAISON',
    type: 'LIVRAISON',
    time: '12:00',
    customerName: 'Marc',
    customerPhone: '06 00 00 00 03',
    address: 'Place de la République, Pézenas',
    zone: 1,
    deliveryFee: 2.50,
    total: 18.40,
    paymentStatus: 'PAYÉ',
    driver: 'Alex',
    items: [
      { name: 'Poké Sur Mesure (L)', price: 15.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Radis rose', 'Chou rouge', 'Betterave', 'Poulet frit maison', 'Soja sucrée', 'Sésames'] }
    ]
  },
  {
    id: '1044', // Commande en retard
    status: 'PREPARATION',
    type: 'LIVRAISON',
    time: '11:45',
    isLate: true,
    customerName: 'Sophie',
    customerPhone: '06 00 00 00 04',
    address: 'Chemin de Tourbes, Pézenas',
    zone: 1,
    deliveryFee: 2.50,
    total: 31.80,
    paymentStatus: 'PAYÉ',
    items: [
      { name: 'Poké Classique Saumon (L)', price: 14.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame', 'Saumon cru mariné'] },
      { name: 'Poké Classique Poulet (M)', price: 11.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame', 'Poulet frit maison'] }
    ]
  },
  {
    id: '1043',
    status: 'PRETE',
    type: 'RETRAIT',
    time: '12:00',
    customerName: 'Lucas',
    customerPhone: '06 00 00 00 05',
    total: 11.90,
    paymentStatus: 'PAYÉ',
    items: [
      { name: 'Poké Classique Falafel (M)', price: 11.90, composition: ['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Ananas', 'Graines de sésame', 'Falafel maison'] }
    ]
  },
  {
    id: '1042',
    status: 'TERMINEE',
    type: 'LIVRAISON',
    time: '11:30',
    customerName: 'Emma',
    customerPhone: '06 00 00 00 06',
    address: 'Mairie, Castelnau-de-Guers',
    zone: 2,
    deliveryFee: 3.90,
    total: 42.60,
    paymentStatus: 'PAYÉ',
    driver: 'Karim',
    items: [
      { name: 'Formule Poké + Boisson + Dessert (L)', price: 20.90, composition: ['Poké Sur Mesure (L)', 'Thé pétillant artisanal', 'Tiramisu spéculoos'] },
      { name: 'Formule Poké + Boisson + Dessert (M)', price: 17.90, composition: ['Poké Classique Saumon (M)', 'Eau plate', 'Banoffee'] }
    ]
  }
];

export const FORMULES = [
  {
    id: 'f1',
    name: 'Formule Déjeuner (Poké + Boisson)',
    badge: 'Populaire midi',
    description: '1 Poké signature ou sur-mesure (M ou L) + 1 Boisson fraîche au choix. Économisez jusqu\'à 1,50 €.',
    priceM: 14.20,
    priceL: 16.90,
    includes: ['Poké au choix', 'Boisson au choix']
  },
  {
    id: 'f2',
    name: 'Formule Maxi Gourmande (Poké + Boisson + Dessert)',
    badge: 'Best-Seller',
    description: '1 Poké au choix + 1 Boisson + 1 Dessert artisanal (Tiramisu, Banoffee...). Économisez 2,50 €.',
    priceM: 17.50,
    priceL: 19.90,
    includes: ['Poké au choix', 'Boisson au choix', 'Dessert artisanal']
  },
  {
    id: 'f3',
    name: 'Formule Duo Hoya (2 Pokés + 2 Boissons)',
    badge: 'À partager',
    description: '2 Pokés au choix (M) + 2 Boissons fraîches. Idéal pour un déjeuner à deux.',
    priceM: 26.90,
    priceL: 31.90,
    includes: ['2 Pokés au choix', '2 Boissons']
  }
];

export const PROMO_CODES = {
  'BIENVENUE10': { code: 'BIENVENUE10', type: 'percent', value: 10, label: '-10% Première commande', minOrder: 0 },
  'HOYA5': { code: 'HOYA5', type: 'fixed', value: 5.00, label: '-5 € de réduction', minOrder: 25.00 },
  'LIVRAISONFREE': { code: 'LIVRAISONFREE', type: 'free_delivery', value: 0, label: 'Frais de livraison offerts', minOrder: 15.00 },
  'PEZENAS': { code: 'PEZENAS', type: 'percent', value: 10, label: '-10% Club Pézenas', minOrder: 0 }
};

export const CUSTOMER_REVIEWS = [
  {
    id: 1,
    author: 'Thomas R.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 2 semaines',
    comment: 'Super découverte à Pézenas ! Les pokés sont ultra frais, copieux et personnalisables à l\'infini. Mention spéciale pour la sauce maison et l\'accueil toujours souriant. On reviendra !'
  },
  {
    id: 2,
    author: 'Manon L.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 1 mois',
    comment: 'Une adresse incontournable pour manger sain et bon. Les produits sont de très bonne qualité, le poisson est frais du jour. Le cadre est agréable et le personnel adorable. Je recommande les yeux fermés !'
  },
  {
    id: 3,
    author: 'Nicolas B.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 3 semaines',
    comment: 'Excellent rapport qualité-prix. Les portions sont généreuses et pleines de saveurs. Service rapide et efficace, parfait pour une pause déj ou à emporter. Bravo à toute l\'équipe !'
  },
  {
    id: 4,
    author: 'Camille S.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 1 mois',
    comment: 'Meilleur poké bowl de la région ! Tout est frais, bien préparé, et les options végétariennes sont top. Le lieu est propre et accueillant. Continuez comme ça !'
  },
  {
    id: 5,
    author: 'Alexandre M.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 2 mois',
    comment: 'Une vraie pépite à Pézenas. Jamais déçu, que ce soit sur place ou à emporter. Les produits sentent le frais et les associations de saveurs sont top. Équipe très sympathique.'
  },
  {
    id: 6,
    author: 'Julie D.',
    source: 'Avis Google vérifié',
    rating: 5,
    date: 'Il y a 3 mois',
    comment: 'Des pokés délicieux avec des produits frais et de qualité. Le choix est varié et l\'équipe est très accueillante. C\'est devenu notre cantine préférée !'
  }
];

export const NUTRITION_ESTIMATES = {
  baseCalories: { 'Riz vinaigré': 260, 'Base quinoa': 210, 'Base carotte': 75 },
  baseProtein: { 'Riz vinaigré': 4, 'Base quinoa': 7, 'Base carotte': 2 },
  proteinCalories: { 'Saumon cru mariné': 185, 'Poulet frit maison': 230, 'Falafel maison': 175 },
  proteinGrams: { 'Saumon cru mariné': 23, 'Poulet frit maison': 25, 'Falafel maison': 9 },
  veggiePortionCalories: 18, // par légume
  sauceCalories: 65,
  toppingsCalories: 55
};

export const DELIVERY_ZONES = [
  { id: 1, name: 'Pézenas', fee: 2.50, min: 15.00 },
  { id: 2, name: 'Zone 2 (Tourbes, Nézignan, etc.)', fee: 3.90, min: 25.00 }
];

