const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const formatPrice = (value) => euro.format(value);
