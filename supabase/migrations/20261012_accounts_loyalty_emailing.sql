-- ==============================================================
-- MIGRATION SUPABASE : COMPTES CLIENTS, FIDÉLITÉ & EMAILING RESEND
-- Restaurant Hoya Poké – Pézenas
-- ==============================================================

-- 1. Table des profils clients (compatible Supabase Auth)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  phone text,
  first_name text,
  delivery_addresses jsonb DEFAULT '[]'::jsonb,
  marketing_consent boolean DEFAULT false,
  marketing_consent_date timestamptz,
  marketing_consent_source text DEFAULT 'WEB', -- 'CHECKOUT', 'ACCOUNT_SIGNUP', 'POS_REGISTER'
  marketing_consent_text text,
  unsubscribed_at timestamptz,
  unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_anonymized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_order_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_auth ON public.customer_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_token ON public.customer_profiles(unsubscribe_token);

-- 2. Carte de fidélité par client
CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  customer_id uuid PRIMARY KEY REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  stamps_count integer DEFAULT 0 CHECK (stamps_count >= 0),
  rewards_available integer DEFAULT 0 CHECK (rewards_available >= 0),
  lifetime_stamps integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- 3. Historique et audit des tampons de fidélité (anti-fraude)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL,
  delta integer NOT NULL, -- ex: +1, +2, -10
  balance_after integer NOT NULL,
  type text NOT NULL, -- 'ORDER_EARNED', 'REWARD_REDEEMED', 'ADMIN_ADJUST', 'ORDER_CANCELLED'
  reason text,
  performed_by text DEFAULT 'SYSTEM', -- 'SYSTEM', 'STAFF_PIN'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_customer ON public.loyalty_transactions(customer_id);

-- 4. Paramètres de fidélité et feature flags
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.restaurant_settings (key, value)
VALUES
  ('feature_flags', '{"accounts": true, "loyalty": true, "emailing": true}'::jsonb),
  ('loyalty_rules', '{"stampsNeeded": 10, "rewardName": "11ᵉ bol offert", "maxRewardValue": 12.90, "stampsPerBowl": 1, "includeFormules": true}'::jsonb),
  ('gdpr_rules', '{"retentionYears": 3, "autoAnonymizeInactive": true}'::jsonb),
  ('resend_config', '{"fromEmail": "Hoya Poké <onboarding@resend.dev>", "replyTo": "contact@hoyapoke.fr", "dailyLimit": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 5. Table des campagnes d'emailing
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  template_type text DEFAULT 'PROMO', -- 'PROMO', 'RELANCE', 'MENU_SAISON', 'CUSTOM'
  content jsonb DEFAULT '{}'::jsonb,
  target_audience text NOT NULL, -- 'ALL_OPTED_IN', 'INACTIVE_30D', 'LOYAL_5_PLUS'
  status text DEFAULT 'DRAFT',   -- 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED'
  scheduled_at timestamptz,
  sent_at timestamptz,
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  stats jsonb DEFAULT '{"delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "unsubscribed": 0}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. Journal des envois d'emails (logs)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  email_type text NOT NULL, -- 'TRANSACTIONAL', 'MARKETING'
  resend_id text,
  status text DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED'
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_email ON public.email_logs(recipient_email);

-- 7. Journal des actions sensibles (Audit RGPD)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL, -- 'EXPORT_CLIENTS', 'DELETE_ACCOUNT', 'CAMPAIGN_SENT', 'LOYALTY_OVERRIDE'
  performed_by text NOT NULL,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- 8. Évolution de la table orders pour lier le compte et la fidélité
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS loyalty_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_stamps_earned integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_marketing_consent boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- 9. Realtime pour les profils et paramètres
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'customer_profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_profiles;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'loyalty_cards'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_cards;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'restaurant_settings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_settings;
    END IF;
  END IF;
END $$;

-- 10. Politiques RLS (Row Level Security) sécurisées et idempotentes
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Lecture & modification pour le client connecté sur son propre profil
DROP POLICY IF EXISTS "Client voit son profil" ON public.customer_profiles;
CREATE POLICY "Client voit son profil"
ON public.customer_profiles
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Client modifie son profil" ON public.customer_profiles;
CREATE POLICY "Client modifie son profil"
ON public.customer_profiles
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Politiques pour la fidélité
DROP POLICY IF EXISTS "Lecture fidélité" ON public.loyalty_cards;
CREATE POLICY "Lecture fidélité"
ON public.loyalty_cards
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Modification fidélité" ON public.loyalty_cards;
CREATE POLICY "Modification fidélité"
ON public.loyalty_cards
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture transactions fidélité" ON public.loyalty_transactions;
CREATE POLICY "Lecture transactions fidélité"
ON public.loyalty_transactions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Politiques pour les paramètres
DROP POLICY IF EXISTS "Lecture paramètres restaurant" ON public.restaurant_settings;
CREATE POLICY "Lecture paramètres restaurant"
ON public.restaurant_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Modification paramètres restaurant" ON public.restaurant_settings;
CREATE POLICY "Modification paramètres restaurant"
ON public.restaurant_settings
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Politiques pour les campagnes et logs
DROP POLICY IF EXISTS "Accès campagnes staff" ON public.email_campaigns;
CREATE POLICY "Accès campagnes staff"
ON public.email_campaigns
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Accès logs emails staff" ON public.email_logs;
CREATE POLICY "Accès logs emails staff"
ON public.email_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Accès audit logs staff" ON public.audit_logs;
CREATE POLICY "Accès audit logs staff"
ON public.audit_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
