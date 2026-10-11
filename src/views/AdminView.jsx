import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Image, Upload, Check, X, Search, 
  ChefHat, ShoppingBag, ArrowLeft, LockKeyhole, RefreshCw, 
  SlidersHorizontal, Sparkles, AlertCircle, FileText, Printer,
  Eye, EyeOff, KeyRound
} from 'lucide-react';
import { useStore } from '../store';
import { formatPrice } from '../format';
import { lockStaffApp, getStaffPin } from '../components/StaffGuard';
import CaisseClotureModal from '../components/CaisseClotureModal';
import ChangePinModal from '../components/ChangePinModal';

const PRESET_IMAGES = [
  { label: 'Poké Saumon Mariné', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Poké Poulet Crispy', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { label: 'Poké Thon Rouge', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cornet Falafels', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Gyoza & Edamame', url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tiramisu Spéculoos', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cheesecake Mangue', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
  { label: 'Boisson Artisanale', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80' }
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Tout le menu' },
  { id: 'classiques', label: 'Pokés Classiques' },
  { id: 'sides', label: 'Sides & Entrées' },
  { id: 'desserts', label: 'Desserts' },
  { id: 'boissons', label: 'Boissons' },
  { id: 'proteines', label: 'Protéines' },
  { id: 'fruitsLegumes', label: 'Fruits & Légumes' },
  { id: 'sauces', label: 'Sauces' },
  { id: 'toppings', label: 'Toppings' }
];

export default function AdminView() {
  const navigate = useNavigate();
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem, resetMenu, outOfStock, toggleStock } = useStore();
  const [activeMainTab, setActiveMainTab] = useState('carte'); // 'carte' | 'caisse'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null); // null or { category, item }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showZModal, setShowZModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState('classiques');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('11.90');
  const [formPriceL, setFormPriceL] = useState('14.90');
  const [formImage, setFormImage] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const fileInputRef = useRef(null);

  const openNewItemModal = (cat = 'classiques') => {
    setEditingItem(null);
    setFormCategory(cat === 'all' ? 'classiques' : cat);
    setFormName('');
    setFormDesc('');
    setFormPrice(cat === 'classiques' ? '11.90' : '4.50');
    setFormPriceL('14.90');
    setFormImage('');
    setFormBadge('');
    setFormProtein('Saumon');
    setIsModalOpen(true);
  };

  const openEditModal = (cat, item) => {
    setEditingItem({ category: cat, item });
    setFormCategory(cat);
    setFormName(item.name || '');
    setFormDesc(item.description || '');
    setFormPrice(String(item.price || item.priceM || '0'));
    setFormPriceL(String(item.priceL || '0'));
    setFormImage(item.image || '');
    setFormBadge(item.badge || '');
    setFormProtein(item.defaultProtein || '');
    setIsModalOpen(true);
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
    const parsedPrice = parseFloat(formPrice.replace(',', '.')) || 0;
    const parsedPriceL = parseFloat(formPriceL.replace(',', '.')) || 0;

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      image: formImage.trim() || null,
      badge: formBadge.trim() || null
    };

    if (isClassic) {
      payload.priceM = parsedPrice;
      payload.priceL = parsedPriceL;
      payload.defaultProtein = formProtein.trim() || 'Saumon';
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
    ? ['classiques', 'sides', 'desserts', 'boissons', 'proteines', 'fruitsLegumes', 'sauces', 'toppings']
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
    <div className="screen" style={{ background: 'var(--cream-2)' }}>
      {/* Top Header */}
      <header className="kitchen-head" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="row gap-3">
          <img src="/logo.jpg" alt="Hoya Poké" style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--line)' }} />
          <div className="col">
            <span className="display" style={{ fontSize: 20, color: 'var(--green-700)' }}>Administration Hoya Poké</span>
            <span className="muted small">Gestion Carte, Produits & Clôture de Caisse</span>
          </div>
        </div>

        <div className="row gap-2">
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
            onClick={() => setShowChangePinModal(true)}
            title="Modifier le code PIN staff"
          >
            <KeyRound size={14} />
            <span>Code PIN</span>
          </button>

          <button 
            className="icon-btn"
            style={{ boxShadow: 'inset 0 0 0 1px var(--line)', color: '#c8463d' }}
            onClick={lockStaffApp}
            title="Verrouiller l'accès staff"
          >
            <LockKeyhole size={16} />
          </button>
        </div>
      </header>

      {/* Main Mode Navigation Bar */}
      <div style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="tabs">
          <button className={activeMainTab === 'carte' ? 'active' : ''} onClick={() => setActiveMainTab('carte')}>
            <SlidersHorizontal size={14} />
            <span>Carte & Produits ({filteredItems.length})</span>
          </button>
          <button className={activeMainTab === 'caisse' ? 'active' : ''} onClick={() => setActiveMainTab('caisse')}>
            <FileText size={14} />
            <span>Clôture Caisse & Bilan Z</span>
          </button>
        </div>

        {activeMainTab === 'carte' && (
          <button 
            className="btn btn-sm btn-primary row gap-1"
            style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            onClick={() => openNewItemModal(selectedCategory)}
          >
            <Plus size={15} />
            <span>Ajouter un produit</span>
          </button>
        )}
      </div>

      {/* View 1: Gestion de la Carte */}
      {activeMainTab === 'carte' && (
        <div className="scroll" style={{ padding: '20px' }}>
          {/* Controls Bar: Categories & Search */}
          <div className="row between gap-3" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="row gap-2" style={{ overflowX: 'auto', paddingBottom: 4, maxWidth: '100%' }}>
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
                    cursor: 'pointer'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="row gap-2" style={{ width: 'min(320px, 100%)' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
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
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--line)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 12,
                          background: 'var(--cream-2)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          color: 'var(--muted)'
                        }}
                      >
                        <Image size={24} />
                      </div>
                    )}

                    <div className="grow col gap-1">
                      <div className="row gap-1" style={{ flexWrap: 'wrap' }}>
                        <span className="eyebrow" style={{ fontSize: 10, textTransform: 'uppercase' }}>{item.category}</span>
                        {item.badge && <span className="tag tag-gold" style={{ fontSize: 10 }}>{item.badge}</span>}
                        {soldOut && <span className="tag tag-danger" style={{ fontSize: 10 }}>Rupture</span>}
                      </div>
                      <strong style={{ fontSize: 15, color: 'var(--ink)' }}>{item.name}</strong>
                      {item.description && (
                        <p className="muted small" style={{ margin: 0, fontSize: 12, lineHeight: 1.3 }}>
                          {item.description}
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
                        <span className="price" style={{ fontSize: 15 }}>
                          {formatPrice(item.price || 0)}
                        </span>
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
        <div className="scroll" style={{ padding: '24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', background: 'var(--paper)', borderRadius: 'var(--r)', border: '1px solid var(--line)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div className="row between" style={{ marginBottom: 20 }}>
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
                    onChange={e => setFormCategory(e.target.value)}
                    style={{ height: 40, borderRadius: 'var(--r-sm)', padding: '0 12px', background: 'var(--cream-2)', border: '1px solid var(--line)' }}
                    disabled={!!editingItem}
                  >
                    <option value="classiques">Poké Classique Signature</option>
                    <option value="sides">Side / Entrée</option>
                    <option value="desserts">Dessert</option>
                    <option value="boissons">Boisson</option>
                    <option value="proteines">Protéine (Sur mesure)</option>
                    <option value="fruitsLegumes">Fruits & Légumes (Sur mesure)</option>
                    <option value="sauces">Sauce (Sur mesure)</option>
                    <option value="toppings">Topping (Sur mesure)</option>
                  </select>
                </div>

                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Nom du produit *</label>
                  <input
                    placeholder="Ex: Poké Saumon Truffe, Mochi Glacé..."
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="col gap-1">
                  <label className="eyebrow" style={{ fontSize: 11 }}>Description / Ingrédients</label>
                  <textarea
                    placeholder="Ex: Riz vinaigré, saumon mariné, sauce ponzu, grenade..."
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
                    <label className="eyebrow" style={{ fontSize: 11 }}>Prix (€)</label>
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
      </AnimatePresence>
    </div>
  );
}
