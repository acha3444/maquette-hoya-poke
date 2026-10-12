import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Mail, Sparkles, CheckCircle2, RotateCcw, 
  MapPin, User, LogOut, Download, Trash2, AlertTriangle, 
  ShoppingBag, Plus, X, Heart
} from 'lucide-react';
import { useStore } from '../store';
import { customerAuthService } from '../services/customerAuthService';
import { loyaltyEngine } from '../services/loyaltyEngine';
import { formatPrice } from '../format';
import HoyaMark from '../components/brand/HoyaMark';
import './account/account.css';

export default function AccountView() {
  const navigate = useNavigate();
  const { 
    currentUser, 
    customerProfile, 
    setCurrentUser, 
    setCustomerProfile, 
    orders, 
    addToCart, 
    clearCart,
    featuresConfig,
    outOfStock,
    loyaltyRules
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulaire profil
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fidélité client
  const [loyaltyCard, setLoyaltyCard] = useState({ stamps: 0, rewards: 0, lifetime: 0 });

  // 1. Initialisation de la session au chargement
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const user = await customerAuthService.getCurrentUser();
      if (user && mounted) {
        setCurrentUser(user);
        const profile = await customerAuthService.getProfile(user.email, user);
        if (profile) {
          setCustomerProfile(profile);
          setFirstName(profile.first_name || '');
          setPhone(profile.phone || '');
          setMarketingConsent(Boolean(profile.marketing_consent));
          setAddresses(profile.delivery_addresses || []);

          if (featuresConfig?.loyalty) {
            const card = await loyaltyEngine.getLoyaltyCard(profile.id);
            setLoyaltyCard(card);
          }
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [setCurrentUser, setCustomerProfile, featuresConfig?.loyalty]);

  // Si le module compte est désactivé par le restaurant
  if (featuresConfig && featuresConfig.accounts === false) {
    return (
      <div className="account-root" style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div className="account-card" style={{ maxWidth: 460 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
          <h2>Espace client non disponible</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            Le restaurant Hoya Poké propose actuellement la commande directe en ligne sans compte obligatoire.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // 2. Gestion de l'envoi du Magic Link
  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await customerAuthService.sendMagicLink(emailInput);
      setMagicLinkSent(true);

      // Pour la démo / PWA locale immédiate : auto-connexion locale si test
      const dummyUser = { id: `usr_${Date.now()}`, email: emailInput.trim().toLowerCase() };
      localStorage.setItem('hoya_customer_user', JSON.stringify(dummyUser));
      setCurrentUser(dummyUser);
      const profile = await customerAuthService.getProfile(dummyUser.email, dummyUser);
      setCustomerProfile(profile);
      setFirstName(profile.first_name || '');
      setPhone(profile.phone || '');
      setMarketingConsent(Boolean(profile.marketing_consent));
      setAddresses(profile.delivery_addresses || []);

      // Rattacher les anciennes commandes de cet email
      await customerAuthService.attachGuestOrders(dummyUser.email, profile.id);

      if (featuresConfig?.loyalty) {
        const card = await loyaltyEngine.getLoyaltyCard(profile.id);
        setLoyaltyCard(card);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Impossible d\'envoyer le lien de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Sauvegarde des informations du profil
  const handleSaveProfile = async () => {
    if (!customerProfile) return;
    setLoading(true);
    try {
      const updated = await customerAuthService.updateProfile({
        ...customerProfile,
        first_name: firstName,
        phone,
        marketing_consent: marketingConsent,
        marketing_consent_date: marketingConsent ? (customerProfile.marketing_consent_date || new Date().toISOString()) : null,
        delivery_addresses: addresses
      });
      setCustomerProfile(updated);
      setSuccessMsg('Vos informations ont été mises à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Ajout et suppression d'adresse de livraison
  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    const next = [...addresses, newAddressInput.trim()];
    setAddresses(next);
    setNewAddressInput('');
    customerAuthService.updateProfile({ ...customerProfile, delivery_addresses: next });
  };

  const handleRemoveAddress = (index) => {
    const next = addresses.filter((_, i) => i !== index);
    setAddresses(next);
    customerAuthService.updateProfile({ ...customerProfile, delivery_addresses: next });
  };

  // 5. Re-commander une ancienne commande avec validation stock et prix
  const handleReorder = (order) => {
    if (!order?.items || order.items.length === 0) return;
    clearCart();

    let addedCount = 0;
    order.items.forEach(item => {
      // Vérifier si un ingrédient ou le produit est en rupture de stock
      const isUnavailable = outOfStock.includes(item.id) || outOfStock.includes(item.name);
      if (!isUnavailable) {
        addToCart(item);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      navigate('/checkout');
    } else {
      alert('Désolé, les articles de cette commande sont momentanément en rupture de stock.');
    }
  };

  // 6. Déconnexion
  const handleSignOut = async () => {
    await customerAuthService.signOut();
    setCurrentUser(null);
    setCustomerProfile(null);
    navigate('/');
  };

  // 7. RGPD Export et Suppression
  const handleExportData = () => {
    const userOrders = orders.filter(o => o.customerEmail === customerProfile?.email || o.customerPhone === customerProfile?.phone);
    customerAuthService.exportUserData(customerProfile, userOrders, loyaltyCard);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    await customerAuthService.deleteUserAccount(customerProfile);
    setShowDeleteModal(false);
    navigate('/');
  };

  // FILTRE : Commandes du client
  const myOrders = orders.filter(o => 
    (customerProfile?.email && (o.customerEmail === customerProfile.email || o.customer_email === customerProfile.email)) ||
    (customerProfile?.phone && o.customerPhone === customerProfile.phone)
  );

  return (
    <div className="account-root">
      {/* Top Header */}
      <header className="account-header">
        <div className="account-header-inner">
          <button 
            className="icon-btn-light" 
            onClick={() => navigate('/')} 
            aria-label="Retour au restaurant"
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', padding: 8, borderRadius: 12, cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ textAlign: 'center', minWidth: 0 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--curry)', fontWeight: 800 }}>
              Hoya Poké Pézenas
            </span>
            <h1 className="account-header-title">
              {currentUser ? 'Mon Espace Client' : 'Connexion Client'}
            </h1>
          </div>
          {currentUser ? (
            <button 
              onClick={handleSignOut} 
              title="Se déconnecter" 
              style={{ background: 'transparent', border: 'none', color: 'var(--cream)', cursor: 'pointer', opacity: 0.85, flexShrink: 0 }}
            >
              <LogOut size={20} />
            </button>
          ) : <div style={{ width: 36, flexShrink: 0 }} />}
        </div>
      </header>

      {/* CAS NON CONNECTÉ : Écran de connexion sans mot de passe */}
      {!currentUser ? (
        <div className="account-container">
          <motion.div 
            className="account-login-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(30, 51, 37, 0.08)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--green-800)' }}>
              <HoyaMark size={36} />
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: 22, color: 'var(--green-900)' }}>
              Connexion en un clic
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Saisissez votre email. Nous vous envoyons un lien magique instantané pour retrouver votre carte de fidélité et vos commandes. <strong>Aucun mot de passe requis.</strong>
            </p>

            {magicLinkSent ? (
              <div style={{ background: '#eaf5eb', padding: 20, borderRadius: 16, color: 'var(--green-900)', border: '1px solid #c2e2c5' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--green-700)', marginBottom: 8 }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>Lien de connexion envoyé !</h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  Consultez votre boîte mail (<strong>{emailInput}</strong>) et cliquez sur le lien pour vous connecter.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMagicLink}>
                <div className="account-input-group">
                  <label htmlFor="login-email">Votre adresse email</label>
                  <input 
                    id="login-email"
                    type="email" 
                    required 
                    placeholder="exemple@gmail.com" 
                    className="account-input"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>

                {errorMsg && (
                  <p style={{ color: '#d9534f', fontSize: 13, margin: '8px 0', fontWeight: 600 }}>{errorMsg}</p>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: 999, fontWeight: 800, fontSize: 15 }}
                >
                  {loading ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
                </button>
              </form>
            )}

            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(15,26,20,0.08)' }}>
              <button 
                onClick={() => navigate('/menu')} 
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Commander en invité sans compte
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* CAS CONNECTÉ : Espace Mon Compte complet */
        <div className="account-container">
          
          {/* 1. Carte de Fidélité (si le module fidélité est activé) */}
          {featuresConfig?.loyalty && (
            <motion.div className="account-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, color: 'var(--curry)', letterSpacing: 1 }}>
                    Programme fidélité Hoya Poké
                  </span>
                  <h2 style={{ margin: '4px 0 0 0', fontSize: 20, color: 'var(--green-900)' }}>
                    Ma Carte de Fidélité
                  </h2>
                </div>
                <div style={{ background: 'var(--cream)', padding: '6px 12px', borderRadius: 20, fontWeight: 800, fontSize: 14, color: 'var(--green-900)', border: '1px solid rgba(15,26,20,0.1)' }}>
                  {loyaltyCard.stamps} / {loyaltyRules?.stampsNeeded || 10}
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px 0' }}>
                1 bol poké acheté = 1 tampon. Au 10ᵉ tampon, votre 11ᵉ bol est <strong>100% offert</strong> !
              </p>

              {/* Grille des 10 tampons */}
              <div className="account-loyalty-grid">
                {Array.from({ length: loyaltyRules?.stampsNeeded || 10 }).map((_, i) => {
                  const stamped = i < loyaltyCard.stamps;
                  const isLast = i === (loyaltyRules?.stampsNeeded || 10) - 1;
                  return (
                    <div key={i} className={`account-stamp-slot ${stamped ? 'stamped' : ''} ${isLast ? 'reward-slot' : ''}`}>
                      {stamped ? (
                        <motion.div initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>
                          <HoyaMark size={24} />
                        </motion.div>
                      ) : (
                        <span>{isLast ? '🎁' : i + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {loyaltyCard.rewards > 0 || loyaltyCard.stamps >= 10 ? (
                <div className="account-reward-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={20} style={{ color: 'var(--curry)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#8c5e2d' }}>
                      Vous avez 1 bol offert disponible !
                    </span>
                  </div>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate('/menu')}
                    style={{ fontSize: 12, padding: '8px 16px' }}
                  >
                    Commander mon bol
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* 2. Historique des commandes & Re-commander */}
          <motion.div className="account-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <ShoppingBag size={20} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--green-900)' }}>Mes commandes</h2>
            </div>

            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>Vous n'avez pas encore de commande enregistrée.</p>
                <button className="btn btn-sm btn-primary" onClick={() => navigate('/menu')}>
                  Découvrir la carte
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {myOrders.slice(0, 5).map(o => (
                  <div key={o.id} className="account-order-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>Commande #{o.id}</strong>
                        <span className={`account-status-pill ${String(o.status || '').toLowerCase()}`}>
                          {o.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        {o.time || 'Aujourd’hui'} · {o.type === 'LIVRAISON' ? 'Livraison' : 'Sur place / Emporter'} · {formatPrice(o.total)}
                      </div>
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                        {(o.items || []).map(i => i.cartName || i.name).join(', ')}
                      </div>
                    </div>
                    <button 
                      className="btn btn-sm btn-ghost" 
                      onClick={() => handleReorder(o)}
                      title="Remettre cette commande dans mon panier"
                      style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <RotateCcw size={13} />
                      <span>Recommander</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* 3. Adresses enregistrées (si livraison) */}
          <motion.div className="account-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <MapPin size={20} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--green-900)' }}>Adresses de livraison</h2>
            </div>

            {addresses.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px 0' }}>
                Aucune adresse enregistrée. Ajoutez vos adresses préférées pour commander plus vite.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {addresses.map((addr, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--cream)', borderRadius: 12, fontSize: 14 }}>
                    <span>{addr}</span>
                    <button onClick={() => handleRemoveAddress(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="account-address-row">
              <input 
                type="text" 
                placeholder="Ex: 7 rue Anatole France, Pézenas"
                className="account-input" 
                style={{ padding: '10px 14px' }}
                value={newAddressInput}
                onChange={e => setNewAddressInput(e.target.value)}
              />
              <button className="btn btn-sm btn-primary" onClick={handleAddAddress} style={{ whiteSpace: 'nowrap' }}>
                <Plus size={16} /> Ajouter
              </button>
            </div>
          </motion.div>

          {/* 4. Informations personnelles & Préférences emailing */}
          <motion.div className="account-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <User size={20} style={{ color: 'var(--green-700)' }} />
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--green-900)' }}>Informations & Préférences</h2>
            </div>

            <div className="account-grid-2col">
              <div className="account-input-group" style={{ margin: 0 }}>
                <label>Prénom (facultatif)</label>
                <input 
                  type="text" 
                  className="account-input" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Votre prénom" 
                />
              </div>
              <div className="account-input-group" style={{ margin: 0 }}>
                <label>Téléphone</label>
                <input 
                  type="tel" 
                  className="account-input" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  placeholder="06 00 00 00 00" 
                />
              </div>
            </div>

            <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--cream)', borderRadius: 14 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, lineHeight: 1.4 }}>
                <input 
                  type="checkbox" 
                  checked={marketingConsent} 
                  onChange={e => setMarketingConsent(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--green-800)' }}
                />
                <span>
                  <strong>Recevoir les nouveautés et offres exclusives de Hoya Poké par email.</strong><br />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Pas de spam. Vous pouvez vous désinscrire à tout moment en 1 clic.
                  </span>
                </span>
              </label>
            </div>

            {successMsg && (
              <p style={{ color: 'var(--green-700)', fontSize: 13, marginTop: 12, fontWeight: 700 }}>{successMsg}</p>
            )}

            <button 
              className="btn btn-primary" 
              onClick={handleSaveProfile} 
              disabled={loading}
              style={{ marginTop: 16, width: '100%', borderRadius: 999 }}
            >
              Enregistrer mes préférences
            </button>
          </motion.div>

          {/* 5. Espace RGPD & Droits */}
          <motion.div className="account-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--green-900)' }}>
              Protection des données (RGPD)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Conformément à la réglementation européenne, vous disposez d'un droit d'accès, d'exportation et d'effacement de vos données personnelles.
            </p>

            <div className="account-rgpd-actions">
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={handleExportData}
                style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Download size={15} /> Télécharger mes données (JSON)
              </button>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={() => setShowDeleteModal(true)}
                style={{ fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Trash2 size={15} /> Supprimer mon compte
              </button>
            </div>
          </motion.div>

        </div>
      )}

      {/* Modal de Confirmation Suppression de Compte */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: 16 }}>
            <motion.div 
              className="account-card" 
              style={{ maxWidth: 440, width: '100%' }}
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div style={{ color: '#dc2626', marginBottom: 12 }}>
                <AlertTriangle size={36} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--ink)' }}>
                Confirmer la suppression de votre compte ?
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                Vos données personnelles (nom, email, téléphone, adresses de livraison et tampons) seront définitivement effacées. Vos anciennes commandes seront conservées sous forme strictement anonymisée afin de respecter les obligations comptables légales.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowDeleteModal(false)}>
                  Annuler
                </button>
                <button 
                  className="btn btn-sm" 
                  onClick={handleConfirmDelete}
                  style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                >
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
