-- ==============================================================
-- MIGRATION SUPABASE : COMMANDE À TABLE (QR CODE) & BORNE TACTILE
-- Restaurant Hoya Poké – Pézenas
-- ==============================================================

-- 1. Évolution de la table des commandes (orders)
-- Ajout des colonnes pour tracer la source, la table et la borne
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'WEB'; -- 'WEB', 'TABLE', 'BORNE', 'CAISSE'

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS table_name text; -- ex: 'Table 5', 'Terrasse 2'

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS table_token text; -- Jeton sécurisé de validation

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS kiosk_id text; -- ex: 'Borne 1', 'Borne 2'

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS daily_number text; -- ex: 'B-042' pour les bornes

-- Indexation pour des requêtes ultra-rapides en 4G et sur KDS
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Table dédiée aux tables du restaurant et jetons QR codes
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id text PRIMARY KEY,
  name text NOT NULL,                    -- ex: 'Table 1', 'Table 2', 'Terrasse 1'
  token text UNIQUE NOT NULL,             -- Jeton cryptographique aléatoire non prédictible
  is_active boolean DEFAULT true,         -- Activation / désactivation par table
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion des tables initiales par défaut si la table est vide
INSERT INTO public.restaurant_tables (id, name, token, is_active)
VALUES 
  ('tbl-1', 'Table 1', 'hp_t1_9a2b', true),
  ('tbl-2', 'Table 2', 'hp_t2_4c8d', true),
  ('tbl-3', 'Table 3', 'hp_t3_7e1f', true),
  ('tbl-4', 'Table 4', 'hp_t4_3b5e', true),
  ('tbl-5', 'Table 5', 'hp_t5_8d0a', true),
  ('tbl-6', 'Table 6', 'hp_t6_2f4c', true),
  ('tbl-t1', 'Terrasse 1', 'hp_tr1_6a9b', true),
  ('tbl-t2', 'Terrasse 2', 'hp_tr2_1e3d', true),
  ('tbl-t3', 'Terrasse 3', 'hp_tr3_5c7f', true),
  ('tbl-t4', 'Terrasse 4', 'hp_tr4_0b2e', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Table des paramètres de la borne et de la commande à table
CREATE TABLE IF NOT EXISTS public.kiosk_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.kiosk_settings (key, value)
VALUES
  ('kiosk_config', '{"enabled": true, "idleTimeout": 60, "prepTiming": "BEFORE_PAYMENT", "paymentModes": "COMPTOIR"}'::jsonb),
  ('tables_config', '{"enabled": true, "paymentMode": "BOTH", "maxUnpaidOrdersPerTable": 3}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Activation du Realtime pour les tables et paramètres (si la publication existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'restaurant_tables'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'kiosk_settings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_settings;
    END IF;
  END IF;
END $$;

-- 5. Sécurité RLS (Row Level Security)
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tables et paramètres
DROP POLICY IF EXISTS "Lecture publique des tables actives" ON public.restaurant_tables;
CREATE POLICY "Lecture publique des tables actives" 
ON public.restaurant_tables 
FOR SELECT 
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Lecture publique des paramètres" ON public.kiosk_settings;
CREATE POLICY "Lecture publique des paramètres" 
ON public.kiosk_settings 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Modification autorisée pour mise à jour par l'admin
DROP POLICY IF EXISTS "Modification tables réservée staff" ON public.restaurant_tables;
CREATE POLICY "Modification tables réservée staff" 
ON public.restaurant_tables 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Modification paramètres réservée staff" ON public.kiosk_settings;
CREATE POLICY "Modification paramètres réservée staff" 
ON public.kiosk_settings 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);
