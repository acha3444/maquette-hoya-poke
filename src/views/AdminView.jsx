import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image, Upload, Check, X, Search, 
  ChefHat, ShoppingBag, ArrowLeft, LockKeyhole, RefreshCw, 
  SlidersHorizontal, Sparkles, AlertCircle, FileText, Printer,
  Eye, EyeOff, KeyRound, Smartphone, CreditCard, Flame,
  QrCode, Tv, Users, Mail, Sliders
} from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';
import { lockStaffApp, getStaffPin } from '../components/StaffGuard';
import CaisseClotureModal from '../components/CaisseClotureModal';
import ChangePinModal from '../components/ChangePinModal';
import InstallPwaModal from '../components/InstallPwaModal';
import PosRegister from '../components/PosRegister';
import ProductThumb from '../components/brand/ProductThumb';
import StaffBrand from '../components/brand/StaffBrand';
import AdminTablesTab from './admin/AdminTablesTab';
import AdminBorneTab from './admin/AdminBorneTab';
import AdminClientsTab from './admin/AdminClientsTab';
import AdminCampagnesTab from './admin/AdminCampagnesTab';
import AdminFeaturesTab from './admin/AdminFeaturesTab';
import './admin.css';

const PRESET_IMAGES = [
  { label: 'Poké Saumon Mariné', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Poké Poulet Crispy', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { label: 'Poké Thon Rouge', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Sauce Spéciale', url: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cornet Falafels', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Gyoza & Edamame', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tiramisu Spéculoos', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cheesecake Mangue', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
  { label: 'Boisson Artisanale', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80' }
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Tout le menu' },
  { id: 'classiques', label: 'Pokés Classiques' },
  { id: 'proteines', label: 'Protéines' },
  { id: 'sauces', label: 'Sauces' },
  { id: 'fruitsLegumes', label: 'Fruits & Légumes' },
  { id: 'toppings', label: 'Toppings' },
  { id: 'sides', label: 'Sides & Entrées' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' }
];

export default function AdminView() {
  const navigate = useNavigate();
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem, resetMenu, outOfStock, toggleStock } = useStore();
  const [activeMainTab, setActiveMainTab] = useState('pos'); // 'pos' | 'carte' | 'caisse'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null); // null or { category, item }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showZModal, setShowZModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState('classiques');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('11.90');
  const [formPriceL, setFormPriceL] = useState('14.90');
  const [formImage, setFormImage] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCustomProtein, setFormCustomProtein] = useState('');
  const [formSauce, setFormSauce] = useState('');
  const [formIngredients, setFormIngredients] = useState([]);
  const [formNewIngredient, setFormNewIngredient] = useState('');
  const [formSupplementPrice, setFormSupplementPrice] = useState('0.50');
  const [formSpice, setFormSpice] = useState(0);
  const fileInputRef = useRef(null);

  const suggestedIngredients = Array.from(new Set([
    'Riz vinaigré', 'Avocat', 'Mangue', 'Edamame', 'Carotte', 'Concombre',
    'Ananas', 'Grenade', 'Oignon rouge', 'Radis rose', 'Chou rouge', 'Chou blanc',
    'Graines de sésame', 'Sésames noirs', 'Oignons frits', 'Cacahuètes',
    ...(menu.fruitsLegumes || []).map(f => f.name),
    ...(menu.toppings || []).map(t => t.name)
  ])).filter(Boolean);

  const handleCategoryChange = (cat) => {
    setFormCategory(cat);
    if (!editingItem) {
      if (cat === 'classiques') {
        setFormPrice('11.90');
        setFormPriceL('14.90');
        setFormProtein((menu.proteines && menu.proteines[0]?.name) || 'Saumon cru mariné');
        setFormCustomProtein('');
        setFormSauce((menu.sauces && menu.sauces[0]?.name) || 'Soja sucrée');
        if (formIngredients.length === 0) {
          setFormIngredients(['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Graines de sésame']);
        }
      } else if (cat === 'proteines') {
        setFormPrice('1.90');
        setFormSupplementPrice('1.90');
      } else if (cat === 'sauces') {
        setFormPrice('0.50');
        setFormSupplementPrice('0.50');
        setFormSpice(0);
      } else if (cat === 'fruitsLegumes') {
        setFormPrice('1.00');
        setFormSupplementPrice('1.00');
      } else if (cat === 'toppings') {
        setFormPrice('0.50');
        setFormSupplementPrice('0.50');
      } else {
        setFormPrice('4.50');
      }
    }
  };

  const openNewItemModal = (cat = 'classiques') => {
    const targetCat = cat === 'all' ? 'classiques' : cat;
    setEditingItem(null);
    setFormCategory(targetCat);
    setFormName('');
    setFormDesc('');
    setFormImage('');
    setFormBadge('');
    setFormNewIngredient('');

    const defaultProt = (menu.proteines && menu.proteines[0]?.name) || 'Saumon cru mariné';
    const defaultSc = (menu.sauces && menu.sauces[0]?.name) || 'Soja sucrée';

    if (targetCat === 'classiques') {
      setFormPrice('11.90');
      setFormPriceL('14.90');
      setFormProtein(defaultProt);
      setFormCustomProtein('');
      setFormSauce(defaultSc);
      setFormIngredients(['Riz vinaigré', 'Carotte', 'Concombre', 'Edamame', 'Avocat', 'Graines de sésame']);
      setFormSupplementPrice('0');
      setFormSpice(0);
    } else if (targetCat === 'proteines') {
      setFormPrice('1.90');
      setFormPriceL('0');
      setFormProtein('');
      setFormCustomProtein('');
      setFormSauce('');
      setFormIngredients([]);
      setFormSupplementPrice('1.90');
      setFormSpice(0);
    } else if (targetCat === 'sauces') {
      setFormPrice('0.50');
      setFormPriceL('0');
      setFormProtein('');
      setFormCustomProtein('');
      setFormSauce('');
      setFormIngredients([]);
      setFormSupplementPrice('0.50');
      setFormSpice(0);
    } else if (targetCat === 'fruitsLegumes') {
      setFormPrice('1.00');
      setFormPriceL('0');
      setFormProtein('');
      setFormCustomProtein('');
      setFormSauce('');
      setFormIngredients([]);
      setFormSupplementPrice('1.00');
      setFormSpice(0);
    } else if (targetCat === 'toppings') {
      setFormPrice('0.50');
      setFormPriceL('0');
      setFormProtein('');
      setFormCustomProtein('');
      setFormSauce('');
      setFormIngredients([]);
      setFormSupplementPrice('0.50');
      setFormSpice(0);
    } else {
      setFormPrice('4.50');
      setFormPriceL('0');
      setFormProtein('');
      setFormCustomProtein('');
      setFormSauce('');
      setFormIngredients([]);
      setFormSupplementPrice('0');
      setFormSpice(0);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (cat, item) => {
    setEditingItem({ category: cat, item });
    setFormCategory(cat);
    setFormName(item.name || '');
    setFormDesc(item.description || '');
    setFormPrice(String(item.price || item.priceM || item.supplementPrice || '0'));
    setFormPriceL(String(item.priceL || '0'));
    setFormImage(item.image || '');
    setFormBadge(item.badge || '');

    const knownProtein = (menu.proteines || []).some(p => p.name === item.defaultProtein);
    if (item.defaultProtein && !knownProtein) {
      setFormProtein('__custom__');
      setFormCustomProtein(item.defaultProtein);
    } else {
      setFormProtein(item.defaultProtein || ((menu.proteines && menu.proteines[0]?.name) || 'Saumon cru mariné'));
      setFormCustomProtein('');
    }

    setFormSauce(item.defaultSauce || ((menu.sauces && menu.sauces[0]?.name) || 'Soja sucrée'));
    setFormIngredients(Array.isArray(item.ingredients) ? [...item.ingredients] : []);
    setFormNewIngredient('');
    setFormSupplementPrice(String(item.supplementPrice !== undefined ? item.supplementPrice : (item.price || '0.50')));
    setFormSpice(item.spice !== undefined ? item.spice : 0);
    setIsModalOpen(true);
  };

  const handleAddIngredient = (rawName) => {
    const trimmed = (rawName || formNewIngredient).trim();
    if (!trimmed) return;
    if (!formIngredients.includes(trimmed)) {
      setFormIngredients(prev => [...prev, trimmed]);
    }
    setFormNewIngredient('');
  };

  const handleRemoveIngredient = (name) => {
    setFormIngredients(prev => prev.filter(i => i !== name));
  };

  const handleToggleIngredient = (name) => {
    if (formIngredients.includes(name)) {
      handleRemoveIngredient(name);
    } else {
      handleAddIngredient(name);
    }
  };

  const handleAutoGenerateDesc = () => {
    const actualProt = formProtein === '__custom__' ? formCustomProtein.trim() : formProtein.trim();
    const parts = [];
    if (actualProt) parts.push(actualProt);
    const otherIngs = formIngredients.filter(i => !i.toLowerCase().includes('riz'));
    if (otherIngs.length > 0) {
      parts.push(otherIngs.slice(0, 3).join(', ').toLowerCase());
    }
    if (formSauce) parts.push(`sauce ${formSauce.toLowerCase()}`);
    setFormDesc(parts.join(', '));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image un peu lourde (>2Mo). Veuillez choisir une image plus légère.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Veuillez indiquer un nom pour le produit.');
      return;
    }

    const isClassic = formCategory === 'classiques';
    const isIngredient = ['proteines', 'sauces', 'fruitsLegumes', 'toppings'].includes(formCategory);
    const parsedPrice = parseFloat(String(formPrice).replace(',', '.')) || 0;
    const parsedPriceL = parseFloat(String(formPriceL).replace(',', '.')) || 0;
    const parsedSuppPrice = parseFloat(String(formSupplementPrice).replace(',', '.')) || 0;

    const actualProtein = formProtein === '__custom__' ? formCustomProtein.trim() : formProtein.trim();

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      image: formImage.trim() || null,
      badge: formBadge.trim() || null
    };

    if (isClassic) {
      payload.priceM = parsedPrice;
      payload.priceL = parsedPriceL;
      payload.defaultProtein = actualProtein || 'Saumon cru mariné';
      payload.defaultSauce = formSauce.trim() || 'Soja sucrée';
      payload.ingredients = formIngredients;
    } else if (isIngredient) {
      payload.price = parsedPrice || parsedSuppPrice;
      payload.supplementPrice = parsedSuppPrice;
      if (formCategory === 'sauces') {
        payload.spice = Number(formSpice) || 0;
      }
    } else {
      payload.price = parsedPrice;
    }

    if (editingItem) {
      updateMenuItem(editingItem.category, editingItem.item.id, payload);
    } else {
      addMenuItem(formCategory, payload);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (cat, id, name) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" de la carte ?`)) {
      deleteMenuItem(cat, id);
    }
  };

  // Build flattened product list based on filters
  const categoriesToScan = selectedCategory === 'all' 
    ? ['classiques', 'proteines', 'sauces', 'fruitsLegumes', 'toppings', 'sides', 'desserts', 'boissons']
    : [selectedCategory];

  const filteredItems = [];
  categoriesToScan.forEach(cat => {
    const list = menu[cat] || [];
    list.forEach(item => {
      const matchSearch = !searchQuery || 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (matchSearch) {
        filteredItems.push({ category: cat, ...item });
      }
    });
  });

  return (
    <div className="screen" style={{ background: 'var(--cream-2)', height: '100dvh', minHeight: '100dvh' }}>
      {/* Top Header */}
      <header className="admin-head">
        <div className="admin-head-top-row">
          <div className="admin-head-brand">
            <StaffBrand label="Admin" sub="Carte & caisse" />
          </div>

          <div className="row gap-2">
            <button 
              className="btn btn-sm btn-ghost row gap-1"
              onClick={() => setShowChangePinModal(true)}
              title="Modifier le code PIN staff"
              style={{ padding: '0 8px', height: 32 }}
            >
              <KeyRound size={14} />
              <span>PIN</span>
            </button>

            <button 
              className="icon-btn"
              style={{ boxShadow: 'inset 0 0 0 1px var(--line)', color: '#c8463d', width: 32, height: 32 }}
              onClick={lockStaffApp}
              title="Verrouiller l'accès staff"
            >
              <LockKeyhole size={15} />
            </button>
          </div>
        </div>

        <div className="admin-head-actions">
          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/cuisine')}
            title="Revenir à l'écran cuisine"
          >
            <ChefHat size={14} />
            <span>Cuisine</span>
          </button>

          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => navigate('/')}
            title="Voir le site client"
          >
            <ShoppingBag size={14} />
            <span>Site client</span>
          </button>

          <button 
            className="btn btn-sm btn-ghost row gap-1"
            onClick={() => setShowInstallModal(true)}
            title="Installer l'app sur l'écran d'accueil"
            style={{ color: 'var(--green-700)', borderColor: 'rgba(46, 125, 50, 0.3)', background: 'rgba(46, 125, 50, 0.08)', fontWeight: 600 }}
          >
            <Smartphone size={14} />
            <span>Installer l'app</span>
          </button>
        </div>
      </header>

      {/* Main Mode Navigation Bar */}
      <div className="admin-subnav">
        <div className="tabs">
          <button className={activeMainTab === 'pos' ? 'active' : ''} onClick={() => setActiveMainTab('pos')}>
            <CreditCard size={14} />
            <span>Caisse Comptoir (POS)</span>
          </button>
          <button className={activeMainTab === 'carte' ? 'active' : ''} onClick={() => setActiveMainTab('carte')}>
            <SlidersHorizontal size={14} />
            <span>Carte & Produits ({filteredItems.length})</span>
          </button>
          <button className={activeMainTab === 'tables' ? 'active' : ''} onClick={() => setActiveMainTab('tables')}>
            <QrCode size={14} />
            <span>Tables & QR Codes</span>
          </button>
          <button className={activeMainTab === 'borne' ? 'active' : ''} onClick={() => setActiveMainTab('borne')}>
            <Tv size={14} />
            <span>Borne</span>
          </button>
          <button className={activeMainTab === 'caisse' ? 'active' : ''} onClick={() => setActiveMainTab('caisse')}>
            <FileText size={14} />
            <span>Clôture Caisse & Bilan Z</span>
          </button>
          <button className={activeMainTab === 'clients' ? 'active' : ''} onClick={() => setActiveMainTab('clients')}>
            <Users size={14} />
            <span>Clients & Fidélité</span>
          </button>
          <button className={activeMainTab === 'campagnes' ? 'active' : ''} onClick={() => setActiveMainTab('campagnes')}>
            <Mail size={14} />
            <span>Campagnes Email</span>
          </button>
          <button className={activeMainTab === 'features' ? 'active' : ''} onClick={() => setActiveMainTab('features')}>
            <Sliders size={14} />
            <span>Modules & Options</span>
          </button>
        </div>

        {activeMainTab === 'carte' && (
          <button 
            className="btn btn-sm btn-primary row gap-1 admin-add-btn"
            style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            onClick={() => openNewItemModal(selectedCategory)}
          >
            <Plus size={15} />
            <span>Ajouter un produit</span>
          </button>
        )}
      </div>

      {/* View 0: Caisse Enregistreuse Tactile (POS Comptoir) */}
      {activeMainTab === 'pos' && (
        <PosRegister />
      )}

      {/* View 1: Gestion de la Carte */}
      {activeMainTab === 'carte' && (
        <div className="scroll" style={{ padding: '20px' }}>
          {/* Controls Bar: Categories & Search */}
          <div className="admin-controls-row">
            <div className="admin-chips-scroll">
              {CATEGORY_TABS.map(c => (
                <button
                  key={c.id}
                  className={`chip ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    background: selectedCategory === c.id ? 'var(--green-700)' : 'var(--paper)',
                    color: selectedCategory === c.id ? 'var(--cream)' : 'var(--ink)',
                    border: '1px solid var(--line)',
                    fontWeight: selectedCategory === c.id ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="admin-search-wrapper" style={{ width: 'min(320px, 100%)' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--muted)' }} />
                <input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 34, height: 38, width: '100%', fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="admin-products-grid">
            {filteredItems.map(item => {
              const isClassic = item.category === 'classiques';
              const soldOut = outOfStock.includes(item.id);

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  style={{
                    background: 'var(--paper)',
                    borderRadius: 'var(--r)',
                    border: '1px solid var(--line)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
                    <ProductThumb item={item} className="admin-thumb" />

                    <div className="grow col gap-1">
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        <span className="eyebrow" style={{ fontSize: 10, textTransform: 'uppercase' }}>{item.category}</span>
                        {item.badge && <span className="tag tag-gold" style={{ fontSize: 10 }}>{item.badge}</span>}
                        {soldOut && <span className="tag tag-danger" style={{ fontSize: 10 }}>Rupture</span>}
                        {item.spice > 0 && <span className="tag tag-neutral" style={{ fontSize: 10 }}>Piquant {item.spice}/3</span>}
                      </div>
                      <strong style={{ fontSize: 15, color: 'var(--ink)' }}>{item.name}</strong>
                      {item.description && (
                        <p className="muted small" style={{ margin: 0, fontSize: 12, lineHeight: 1.3 }}>
                          {item.description}
                        </p>
                      )}
                      {isClassic && (
                        <div className="row gap-1" style={{ flexWrap: 'wrap', marginTop: 2 }}>
                          {item.defaultProtein && (
                            <span className="tag tag-neutral" style={{ fontSize: 10 }}>{item.defaultProtein}</span>
                          )}
                          {item.defaultSauce && (
                            <span className="tag tag-neutral" style={{ fontSize: 10 }}>Sauce {item.defaultSauce.toLowerCase()}</span>
                          )}
                        </div>
                      )}
                      {isClassic && item.ingredients && item.ingredients.length > 0 && (
                        <p className="muted small" style={{ margin: 0, fontSize: 11, fontStyle: 'italic', lineHeight: 1.3 }}>
                          Ingrédients : {item.ingredients.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="divider" style={{ margin: '2px 0' }} />

                  {/* Price & Actions Row */}
                  <div className="row between">
                    <div>
                      {isClassic ? (
                        <span className="price" style={{ fontSize: 14 }}>
                          M {formatPrice(item.priceM)} · L {formatPrice(item.priceL)}
                        </span>
                      ) : (
                        <div className="col">
                          <span className="price" style={{ fontSize: 14 }}>
                            {formatPrice(item.price || item.supplementPrice || 0)}
                          </span>
                          {item.supplementPrice !== undefined && item.supplementPrice > 0 && !['sides', 'desserts', 'boissons'].includes(item.category) && (
                            <span className="muted small" style={{ fontSize: 10 }}>
                              Supplément : +{formatPrice(item.supplementPrice)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="row gap-1">
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ height: 30, padding: '0 8px', fontSize: 11 }}
                        onClick={() => toggleStock(item.id)}
                        title={soldOut ? 'Marquer disponible' : 'Marquer en rupture'}
                      >
                        {soldOut ? 'Remettre en stock' : 'Rupture'}
                      </button>

                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30 }}
                        onClick={() => openEditModal(item.category, item)}
                        title="Modifier ce produit (nom, prix, photo)"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30, color: 'var(--danger)' }}
                        onClick={() => handleDelete(item.category, item.id, item.name)}
                        title="Supprimer ce produit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--paper)', borderRadius: 'var(--r)', border: '1px dashed var(--line)' }}>
              <p className="muted">Aucun produit ne correspond à votre recherche.</p>
              <button className="btn btn-primary btn-sm" onClick={() => openNewItemModal(selectedCategory)}>
                + Créer un produit
              </button>
            </div>
          )}

          {/* Reset menu footer option */}
          <div className="row between" style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span className="muted small">Toutes les modifications sont automatiquement synchronisées avec le site client.</span>
            <button
              className="btn btn-sm btn-ghost row gap-1"
              style={{ color: 'var(--muted)', fontSize: 12 }}
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser le menu complet aux valeurs d’origine ?')) {
                  resetMenu();
                }
              }}
            >
              <RefreshCw size={12} />
              <span>Réinitialiser la carte d'origine</span>
            </button>
          </div>
        </div>
      )}

      {/* View 2: Clôture de Caisse & Ticket Z */}
      {activeMainTab === 'caisse' && (
        <div className="scroll" style={{ padding: '16px' }}>
          <div className="admin-caisse-card" style={{ maxWidth: 680, margin: '0 auto', background: 'var(--paper)', borderRadius: 'var(--r)', border: '1px solid var(--line)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div className="row between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="eyebrow">Fin de Service & Journal</span>
                <h2 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>Bilan de Caisse Journalier</h2>
              </div>
              <button className="btn btn-primary row gap-2" onClick={() => setShowZModal(true)}>
                <Printer size={16} />
                <span>Ouvrir & Imprimer Ticket Z</span>
              </button>
            </div>

            <p className="muted small" style={{ marginBottom: 20 }}>
              Ce module permet de faire le point comptable de la journée : total des encaissements en ligne vs espèces et CB au comptoir/livreur, détail des ventes par article et impression thermique 80mm certifiée.
            </p>

            <button 
              className="btn btn-block btn-primary row gap-2" 
              style={{ justifyContent: 'center', height: 46 }}
              onClick={() => setShowZModal(true)}
            >
              <FileText size={18} />
              <span>Accéder à la Clôture de Caisse (Ticket Z)</span>
            </button>

            {/* Sécurité Code PIN */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }} className="col gap-3">
              <div className="row between">
                <div className="row gap-2">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-700)', color: 'var(--cream)', display: 'grid', placeItems: 'center' }}>
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: 14 }}>Sécurité & Code PIN Staff</strong>
                    <div className="muted small">Protège les écrans Cuisine, Caisse et Administration</div>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-ghost row gap-1" 
                  onClick={() => setShowChangePinModal(true)} 
                  style={{ borderColor: 'var(--line)', background: 'var(--cream-2)' }}
                >
                  <KeyRound size={14} />
                  <span>Modifier le code PIN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Tables & QR Codes */}
      {activeMainTab === 'tables' && (
        <AdminTablesTab />
      )}

      {/* View 4: Borne Tactile */}
      {activeMainTab === 'borne' && (
        <AdminBorneTab />
      )}

      {/* View 5: Fichier Clients & Fidélité */}
      {activeMainTab === 'clients' && (
        <AdminClientsTab />
      )}

      {/* View 6: Campagnes Emailing Resend */}
      {activeMainTab === 'campagnes' && (
        <AdminCampagnesTab />
      )}

      {/* View 7: Modules & Options / Feature Flags */}
      {activeMainTab === 'features' && (
        <AdminFeaturesTab />
      )}

      {/* Modal: Add / Edit Product */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-centered-wrapper">
            <motion.div className="modal-centered-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              style={{
                position: 'relative',
                zIndex: 10000,
                background: 'var(--paper)',
                borderRadius: 20,
                width: 'min(500px, 94vw)',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                pointerEvents: 'auto'
              }}
            >
              {/* Modal Head */}
              <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: 'var(--cream-2)' }}>
                <strong style={{ fontSize: 16 }}>{editingItem ? 'Modifier le produit' : 'Nouveau produit à la carte'}</strong>
                <button className="icon-btn" onClick={() => setIsModalOpen(false)} aria-label="Fermer"><X size={18} /></button>
              </div>

              {/* Modal Form Scroll */}
              <form onSubmit={handleSaveProduct} className="scroll col gap-4" style={{ padding: '20px' }}>
                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={e => handleCategoryChange(e.target.value)}
                    style={{ height: 40, borderRadius: 'var(--r-sm)', padding: '0 12px', background: 'var(--cream-2)', border: '1px solid var(--line)' }}
                    disabled={!!editingItem}
                  >
                    <option value="classiques">Poké Classique Signature</option>
                    <option value="proteines">Protéine (Sur-mesure & Recettes)</option>
                    <option value="sauces">Sauce (Sur-mesure & Pokés)</option>
                    <option value="fruitsLegumes">Fruits & Légumes (Sur-mesure)</option>
                    <option value="toppings">Topping (Sur-mesure)</option>
                    <option value="sides">Side / Entrée</option>
                    <option value="desserts">Dessert</option>
                    <option value="boissons">Boisson</option>
                  </select>
                </div>

                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Nom du produit *</label>
                  <input
                    placeholder="Ex: Poké Thon Mangue, Sauce Ponzu Yuzu, Falafel..."
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>

                {/* Section Spécifique Poké Classique */}
                {formCategory === 'classiques' && (
                  <div className="col gap-3" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <ChefHat size={16} style={{ color: 'var(--green-700)' }} />
                      <strong style={{ fontSize: 13 }}>Recette signature du Poké</strong>
                    </div>

                    {/* Protéine Principale */}
                    <div className="col gap-1">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Protéine principale</label>
                      <select
                        value={formProtein}
                        onChange={e => setFormProtein(e.target.value)}
                        style={{ height: 38, borderRadius: 'var(--r-sm)', padding: '0 10px', background: 'var(--paper)', border: '1px solid var(--line)' }}
                      >
                        {(menu.proteines || []).map(p => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                        <option value="__custom__">Autre protéine…</option>
                      </select>
                      {formProtein === '__custom__' && (
                        <input
                          placeholder="Nom de la protéine personnalisée (ex: Thon rouge mariné, Crevettes...)"
                          value={formCustomProtein}
                          onChange={e => setFormCustomProtein(e.target.value)}
                          style={{ marginTop: 4, height: 36 }}
                          required
                        />
                      )}
                    </div>

                    {/* Sauce Recommandée */}
                    <div className="col gap-1">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Sauce signature recommandée</label>
                      <select
                        value={formSauce}
                        onChange={e => setFormSauce(e.target.value)}
                        style={{ height: 38, borderRadius: 'var(--r-sm)', padding: '0 10px', background: 'var(--paper)', border: '1px solid var(--line)' }}
                      >
                        {(menu.sauces || []).map(s => (
                          <option key={s.id || s.name} value={s.name}>
                            {s.name}{s.spice ? ` · piquant ${s.spice}/3` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ingrédients de la Recette (Chips & Toggle) */}
                    <div className="col gap-2">
                      <div className="row between" style={{ alignItems: 'baseline' }}>
                        <label className="eyebrow" style={{ fontSize: 11 }}>Ingrédients de la recette ({formIngredients.length})</label>
                        <button
                          type="button"
                          className="link-btn"
                          style={{ fontSize: 11, color: 'var(--green-700)', fontWeight: 600 }}
                          onClick={handleAutoGenerateDesc}
                          title="Remplir la description à partir des ingrédients"
                        >
                          <Sparkles size={11} style={{ marginRight: 4, display: 'inline' }} />
                          Générer la description
                        </button>
                      </div>

                      {/* Current selected ingredients badges */}
                      <div className="row gap-1" style={{ flexWrap: 'wrap', minHeight: 36, padding: '6px 8px', background: 'var(--paper)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                        {formIngredients.length === 0 ? (
                          <span className="muted small" style={{ fontSize: 11 }}>Aucun ingrédient sélectionné.</span>
                        ) : (
                          formIngredients.map(ing => (
                            <span 
                              key={ing} 
                              className="chip" 
                              style={{ 
                                fontSize: 11, 
                                padding: '3px 8px', 
                                background: 'var(--green-700)', 
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>{ing}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ing)}
                                style={{ background: 'transparent', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex' }}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Add Custom Ingredient */}
                      <div className="row gap-1">
                        <input
                          placeholder="Ajouter un ingrédient libre (ex: Cébette, Wakamé, Grenade...)"
                          value={formNewIngredient}
                          onChange={e => setFormNewIngredient(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          style={{ height: 34, fontSize: 12, flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleAddIngredient()}
                          style={{ height: 34, padding: '0 10px', fontSize: 12 }}
                        >
                          + Ajouter
                        </button>
                      </div>

                      {/* Suggestions Chips to toggle */}
                      <div className="col gap-1">
                        <span className="muted small" style={{ fontSize: 10 }}>Ingrédients rapides (cliquez pour ajouter / retirer) :</span>
                        <div className="row gap-1" style={{ flexWrap: 'wrap', maxHeight: 110, overflowY: 'auto' }}>
                          {suggestedIngredients.map(ing => {
                            const isIncluded = formIngredients.includes(ing);
                            return (
                              <button
                                key={ing}
                                type="button"
                                className={`chip ${isIncluded ? 'active' : ''}`}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 7px',
                                  background: isIncluded ? 'var(--green-700)' : 'var(--cream-2)',
                                  color: isIncluded ? 'var(--cream)' : 'var(--ink)',
                                  border: '1px solid var(--line)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleToggleIngredient(ing)}
                              >
                                {isIncluded ? '✓ ' : '+ '}{ing}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Spécifique Sauces */}
                {formCategory === 'sauces' && (
                  <div className="col gap-3" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <Sparkles size={16} style={{ color: 'var(--green-700)' }} />
                      <strong style={{ fontSize: 13 }}>Paramètres de la sauce</strong>
                    </div>

                    <div className="col gap-1">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Niveau de piquant</label>
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        {[
                          { level: 0, label: 'Doux' },
                          { level: 1, label: 'Légèrement piquant' },
                          { level: 2, label: 'Épicé' },
                          { level: 3, label: 'Très fort' }
                        ].map(opt => (
                          <button
                            key={opt.level}
                            type="button"
                            className={`chip ${formSpice === opt.level ? 'active' : ''}`}
                            onClick={() => setFormSpice(opt.level)}
                            style={{
                              padding: '5px 10px',
                              fontSize: 11,
                              background: formSpice === opt.level ? 'var(--green-700)' : 'var(--paper)',
                              color: formSpice === opt.level ? 'var(--cream)' : 'var(--ink)',
                              border: '1px solid var(--line)',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col gap-1">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Prix du supplément (€)</label>
                      <input
                        type="number"
                        step="0.10"
                        placeholder="0.50"
                        value={formSupplementPrice}
                        onChange={e => setFormSupplementPrice(e.target.value)}
                        required
                      />
                      <span className="muted small" style={{ fontSize: 11 }}>
                        Prix facturé si ajoutée en supplément dans le bol ou achetée seule.
                      </span>
                    </div>
                  </div>
                )}

                {/* Section Spécifique Protéines */}
                {formCategory === 'proteines' && (
                  <div className="col gap-2" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <label className="eyebrow" style={{ fontSize: 11 }}>Prix du supplément (€)</label>
                    <input
                      type="number"
                      step="0.10"
                      placeholder="1.90"
                      value={formSupplementPrice}
                      onChange={e => setFormSupplementPrice(e.target.value)}
                      required
                    />
                    <span className="muted small" style={{ fontSize: 11 }}>
                      Cette protéine apparaîtra instantanément dans le configurateur Sur-Mesure et comme choix pour les nouveaux pokés classiques.
                    </span>
                  </div>
                )}

                {/* Section Spécifique Fruits & Légumes */}
                {formCategory === 'fruitsLegumes' && (
                  <div className="col gap-2" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <label className="eyebrow" style={{ fontSize: 11 }}>Prix du supplément au-delà du quota inclus (€)</label>
                    <input
                      type="number"
                      step="0.10"
                      placeholder="1.00"
                      value={formSupplementPrice}
                      onChange={e => setFormSupplementPrice(e.target.value)}
                      required
                    />
                    <span className="muted small" style={{ fontSize: 11 }}>
                      Apparaîtra immédiatement dans le Sur-Mesure client et dans les suggestions de composition.
                    </span>
                  </div>
                )}

                {/* Section Spécifique Toppings */}
                {formCategory === 'toppings' && (
                  <div className="col gap-2" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                    <label className="eyebrow" style={{ fontSize: 11 }}>Prix du supplément au-delà de 2 toppings (€)</label>
                    <input
                      type="number"
                      step="0.10"
                      placeholder="0.50"
                      value={formSupplementPrice}
                      onChange={e => setFormSupplementPrice(e.target.value)}
                      required
                    />
                    <span className="muted small" style={{ fontSize: 11 }}>
                      Topping croustillant ajouté aux choix sur-mesure.
                    </span>
                  </div>
                )}

                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Description / Ingrédients textuels</label>
                  <textarea
                    placeholder="Ex: Riz vinaigré, saumon mariné, avocat, mangue..."
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                {formCategory === 'classiques' ? (
                  <div className="row gap-3">
                    <div className="col gap-1 grow">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Prix Taille M (€)</label>
                      <input
                        type="number"
                        step="0.10"
                        placeholder="11.90"
                        value={formPrice}
                        onChange={e => setFormPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col gap-1 grow">
                      <label className="eyebrow" style={{ fontSize: 11 }}>Prix Taille L (€)</label>
                      <input
                        type="number"
                        step="0.10"
                        placeholder="14.90"
                        value={formPriceL}
                        onChange={e => setFormPriceL(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="col gap-1">
                    <label className="eyebrow" style={{ fontSize: 11 }}>
                      {['proteines', 'sauces', 'fruitsLegumes', 'toppings'].includes(formCategory) ? 'Prix unitaire / à la carte (€)' : 'Prix (€)'}
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      placeholder="4.50"
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Badge option */}
                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Badge spécial (facultatif)</label>
                  <input
                    placeholder="Ex: Nouveau, Bestseller, Recette du chef..."
                    value={formBadge}
                    onChange={e => setFormBadge(e.target.value)}
                  />
                </div>

                {/* Image Section */}
                <div className="col gap-2" style={{ background: 'var(--cream-2)', padding: 14, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                  <label className="eyebrow" style={{ fontSize: 11 }}>Photo du produit</label>

                  {formImage ? (
                    <div className="row gap-3" style={{ alignItems: 'center' }}>
                      <img src={formImage} alt="Aperçu" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
                      <div className="col gap-1 grow">
                        <span className="small" style={{ fontWeight: 600 }}>Image sélectionnée</span>
                        <button type="button" className="link-btn danger" onClick={() => setFormImage('')}>Supprimer la photo</button>
                      </div>
                    </div>
                  ) : (
                    <span className="muted small">Aucune image sélectionnée (une icône colorée sera utilisée).</span>
                  )}

                  {/* Upload button */}
                  <div className="row gap-2" style={{ marginTop: 6 }}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost grow row gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={13} />
                      <span>Téléverser une photo (fichier / caméra)</span>
                    </button>
                  </div>

                  {/* Preset library dropdown / chips */}
                  <div className="col gap-1" style={{ marginTop: 4 }}>
                    <span className="muted small" style={{ fontSize: 11 }}>Ou choisir parmi des photos types :</span>
                    <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                      {PRESET_IMAGES.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chip"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() => setFormImage(p.url)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="row gap-2" style={{ marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary grow">
                    {editingItem ? 'Enregistrer les modifications' : 'Ajouter à la carte'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Z Modal */}
      <AnimatePresence>
        {showZModal && (
          <CaisseClotureModal onClose={() => setShowZModal(false)} />
        )}
        {showChangePinModal && (
          <ChangePinModal onClose={() => setShowChangePinModal(false)} />
        )}
        {showInstallModal && (
          <InstallPwaModal onClose={() => setShowInstallModal(false)} type="admin" />
        )}
      </AnimatePresence>
    </div>
  );
}
