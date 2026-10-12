import { supabase } from '../supabase';

const LOYALTY_RULES_KEY = 'hoya_loyalty_rules';
export const DEFAULT_LOYALTY_RULES = {
  stampsNeeded: 10,
  rewardName: '11ᵉ bol offert',
  maxRewardValue: 12.90,
  stampsPerBowl: 1,
  includeFormules: true
};

export const loyaltyEngine = {
  // 1. Récupérer les règles de fidélité
  getRules() {
    if (typeof window === 'undefined') return DEFAULT_LOYALTY_RULES;
    try {
      const stored = localStorage.getItem(LOYALTY_RULES_KEY);
      if (stored) return { ...DEFAULT_LOYALTY_RULES, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_LOYALTY_RULES;
  },

  saveRules(newRules) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOYALTY_RULES_KEY, JSON.stringify(newRules));
        window.dispatchEvent(new CustomEvent('hoya_loyalty_rules_updated', { detail: newRules }));
      } catch (e) {}
    }
  },

  // 2. Calculer le nombre de bols éligibles dans une commande
  calculateEligibleBowls(cartItems, rules = null) {
    const activeRules = rules || this.getRules();
    if (!Array.isArray(cartItems)) return 0;

    let count = 0;
    for (const item of cartItems) {
      // Un bol sur mesure ou un classique a une composition
      const isCustomOrClassic = (item.composition && item.composition.length > 0) || item.size;
      const isFormule = Boolean(item.isFormule);

      if (isFormule) {
        if (activeRules.includeFormules) count += 1;
      } else if (isCustomOrClassic) {
        count += (item.quantity || 1);
      }
    }
    return count;
  },

  // 3. Obtenir le solde de fidélité d'un client
  async getLoyaltyCard(customerId) {
    if (!customerId) return { stamps: 0, rewards: 0, lifetime: 0 };

    try {
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!error && data) {
        return {
          stamps: data.stamps_count || 0,
          rewards: data.rewards_available || 0,
          lifetime: data.lifetime_stamps || 0
        };
      }
    } catch (e) {}

    // Fallback local
    try {
      const localStamps = parseInt(localStorage.getItem('hoya_loyalty_stamps') || '0', 10);
      return { stamps: localStamps, rewards: Math.floor(localStamps / 10), lifetime: localStamps };
    } catch (e) {}

    return { stamps: 0, rewards: 0, lifetime: 0 };
  },

  // 4. Créditer des tampons lors du paiement effectif ou de la fin de préparation
  async creditStampsOnPaidOrder(order, profile) {
    if (!order || (!profile?.id && !order.customer_id)) return;
    const customerId = profile?.id || order.customer_id;
    const rules = this.getRules();
    const bowlsCount = this.calculateEligibleBowls(order.items, rules);

    if (bowlsCount <= 0) return;

    const currentCard = await this.getLoyaltyCard(customerId);
    const newStampsTotal = currentCard.stamps + (bowlsCount * rules.stampsPerBowl);
    const newRewards = Math.floor(newStampsTotal / rules.stampsNeeded);
    const remainingStamps = newStampsTotal % rules.stampsNeeded;

    // Enregistrement de la transaction
    try {
      await supabase.from('loyalty_cards').upsert({
        customer_id: customerId,
        stamps_count: remainingStamps,
        rewards_available: currentCard.rewards + newRewards,
        lifetime_stamps: currentCard.lifetime + bowlsCount,
        updated_at: new Date().toISOString()
      });

      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId,
        order_id: order.id,
        delta: bowlsCount,
        balance_after: remainingStamps,
        type: 'ORDER_EARNED',
        reason: `Commande #${order.id} payée (${bowlsCount} bol(s))`,
        performed_by: 'SYSTEM'
      });
    } catch (e) {
      console.warn('Loyalty credit fallback:', e);
    }

    // Mise à jour locale pour affichage immédiat
    localStorage.setItem('hoya_loyalty_stamps', String(remainingStamps));
    window.dispatchEvent(new CustomEvent('hoya_stamps_updated', { detail: remainingStamps }));
  },

  // 5. Utiliser une récompense (Bol offert)
  async redeemReward(customerId, orderId) {
    if (!customerId) return false;
    const currentCard = await this.getLoyaltyCard(customerId);
    if (currentCard.rewards <= 0 && currentCard.stamps < 10) return false;

    const newRewards = Math.max(0, currentCard.rewards - 1);
    try {
      await supabase.from('loyalty_cards').update({
        rewards_available: newRewards,
        updated_at: new Date().toISOString()
      }).eq('customer_id', customerId);

      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId,
        order_id: orderId || null,
        delta: -10,
        balance_after: currentCard.stamps,
        type: 'REWARD_REDEEMED',
        reason: `Bol offert utilisé sur commande #${orderId || 'Comptoir'}`,
        performed_by: 'SYSTEM'
      });
    } catch (e) {}

    return true;
  },

  // 6. Ajustement manuel au comptoir (Caisse Admin) avec motif obligatoire
  async manualAdjustStamps(customerId, delta, reason, staffPin = '1234') {
    if (!customerId || !reason) throw new Error('Motif obligatoire pour tout ajustement.');

    const currentCard = await this.getLoyaltyCard(customerId);
    const rules = this.getRules();
    const newTotal = Math.max(0, currentCard.stamps + delta);
    const newRewards = Math.floor(newTotal / rules.stampsNeeded);
    const remainingStamps = newTotal % rules.stampsNeeded;

    try {
      await supabase.from('loyalty_cards').upsert({
        customer_id: customerId,
        stamps_count: remainingStamps,
        rewards_available: Math.max(0, currentCard.rewards + newRewards),
        updated_at: new Date().toISOString()
      });

      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId,
        delta,
        balance_after: remainingStamps,
        type: 'ADMIN_ADJUST',
        reason: `Ajustement caisse (${staffPin}) : ${reason}`,
        performed_by: `STAFF_${staffPin}`
      });
    } catch (e) {
      console.warn('Manual adjust fallback:', e);
    }

    return { stamps: remainingStamps, rewards: currentCard.rewards + newRewards };
  }
};
