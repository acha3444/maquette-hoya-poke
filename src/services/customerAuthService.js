import { supabase } from '../supabase';

const LOCAL_USER_KEY = 'hoya_customer_user';
const LOCAL_PROFILE_KEY = 'hoya_customer_profile';

export const customerAuthService = {
  // 1. Obtenir l'utilisateur actuel (depuis Supabase Auth ou session locale)
  async getCurrentUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return session.user;
      }
    } catch (e) {}

    // Fallback stockage local (PWA session)
    try {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return null;
  },

  // 2. Connexion par Magic Link (Supabase Auth + notification Resend)
  async sendMagicLink(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('Veuillez saisir une adresse email valide.');

    // Envoi via Supabase Auth
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/compte` 
      : 'https://hoyapoke.fr/compte';

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.warn('Supabase signInWithOtp notice:', error.message);
      }
    } catch (e) {
      console.warn('Supabase auth fallback:', e);
    }

    // Appel optionnel à notre endpoint Resend serverless pour l'email brandé Hoya Poké
    try {
      await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          magicLink: `${redirectUrl}?token=magic_${Date.now()}`
        })
      });
    } catch (e) {}

    return { success: true, email: cleanEmail };
  },

  // 3. Récupérer ou initialiser le profil client
  async getProfile(email, user = null) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Recherche dans customer_profiles
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {}

    // 2. Fallback stockage local
    try {
      const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email === cleanEmail) return parsed;
      }
    } catch (e) {}

    // 3. Profil par défaut si nouveau client
    const defaultProfile = {
      id: user?.id || `usr_${Date.now()}`,
      email: cleanEmail,
      first_name: '',
      phone: '',
      delivery_addresses: [],
      marketing_consent: false,
      is_anonymized: false,
      created_at: new Date().toISOString()
    };

    return defaultProfile;
  },

  // 4. Mettre à jour les informations du profil
  async updateProfile(profileData) {
    const cleanEmail = (profileData.email || '').trim().toLowerCase();
    const updated = {
      ...profileData,
      email: cleanEmail,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('hoya_profile_updated', { detail: updated }));

    try {
      await supabase
        .from('customer_profiles')
        .upsert(updated, { onConflict: 'email' });
    } catch (e) {
      console.warn('Supabase update profile fallback:', e);
    }

    return updated;
  },

  // 5. Rattacher rétroactivement les commandes passées en invité avec cet email
  async attachGuestOrders(email, profileId) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();

    try {
      // Mettre à jour les commandes passées avec cet email
      const { data: orders, error } = await supabase
        .from('orders')
        .update({ customer_id: profileId })
        .eq('customer_email', cleanEmail)
        .select('*');

      if (!error && orders) {
        return orders;
      }
    } catch (e) {}

    return [];
  },

  // 6. Déconnexion
  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    window.dispatchEvent(new Event('hoya_auth_state_changed'));
  },

  // 7. RGPD : Télécharger mes données (Export JSON et CSV)
  async exportUserData(profile, orders = [], loyalty = null) {
    const data = {
      exportDate: new Date().toISOString(),
      restaurant: 'Hoya Poké – Pézenas (7 Rue Anatole France)',
      profil: {
        nom: profile?.first_name || '',
        email: profile?.email || '',
        telephone: profile?.phone || '',
        adresses: profile?.delivery_addresses || [],
        consentementMarketing: profile?.marketing_consent ? 'Oui' : 'Non',
        dateConsentement: profile?.marketing_consent_date || null
      },
      fidelite: {
        tamponsActuels: loyalty?.stamps || 0,
        recompensesDisponibles: loyalty?.rewards || 0
      },
      historiqueCommandes: orders.map(o => ({
        id: o.id,
        date: o.time || o.created_at,
        type: o.type,
        total: `${Number(o.total || 0).toFixed(2)} €`,
        articles: (o.items || []).map(i => i.name || i.cartName)
      }))
    };

    // Déclenchement du téléchargement JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoya-poke-donnees-${profile?.email || 'client'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // 8. RGPD : Supprimer mon compte (anonymisation comptable et purge)
  async deleteUserAccount(profile) {
    if (!profile?.email) return false;
    const cleanEmail = profile.email.trim().toLowerCase();

    try {
      // 1. Anonymiser les commandes pour préserver la comptabilité obligatoire
      await supabase
        .from('orders')
        .update({
          customer_name: 'Client Anonymisé',
          customer_phone: '00 00 00 00 00',
          customer_email: null,
          address: 'Donnée supprimée (RGPD)'
        })
        .eq('customer_email', cleanEmail);

      // 2. Supprimer ou anonymiser le profil
      await supabase
        .from('customer_profiles')
        .update({
          is_anonymized: true,
          first_name: 'Anonyme',
          phone: null,
          delivery_addresses: [],
          marketing_consent: false
        })
        .eq('email', cleanEmail);

      // 3. Logger dans audit_logs
      await supabase.from('audit_logs').insert({
        action: 'DELETE_ACCOUNT',
        performed_by: 'CLIENT_SELF',
        details: { email_hash: cleanEmail.slice(0, 3) + '***' }
      });
    } catch (e) {
      console.warn('Supabase delete account fallback:', e);
    }

    // Nettoyage local et déconnexion
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    localStorage.removeItem('hoya_loyalty_stamps');
    window.dispatchEvent(new Event('hoya_auth_state_changed'));
    return true;
  }
};
