-- Admins
CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own admin row" ON public.admin_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Sammelserien
CREATE TABLE public.collection_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  item_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collection_series TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_series TO authenticated;
GRANT ALL ON public.collection_series TO service_role;
ALTER TABLE public.collection_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active series" ON public.collection_series
  FOR SELECT USING (active = true);
CREATE POLICY "Admins manage series" ON public.collection_series
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND author_id = auth.uid());
CREATE TRIGGER touch_collection_series BEFORE UPDATE ON public.collection_series
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Community-Missionen
CREATE TABLE public.custom_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  goal jsonb NOT NULL DEFAULT '{}'::jsonb,
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_missions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_missions TO authenticated;
GRANT ALL ON public.custom_missions TO service_role;
ALTER TABLE public.custom_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active missions" ON public.custom_missions
  FOR SELECT USING (active = true);
CREATE POLICY "Admins manage missions" ON public.custom_missions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) AND author_id = auth.uid());
CREATE TRIGGER touch_custom_missions BEFORE UPDATE ON public.custom_missions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tauschbörse
CREATE TABLE public.trade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_nick text NOT NULL,
  give jsonb NOT NULL,
  want jsonb NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  taken_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trade_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_offers TO authenticated;
GRANT ALL ON public.trade_offers TO service_role;
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse trades" ON public.trade_offers
  FOR SELECT USING (true);
CREATE POLICY "Owner creates trade" ON public.trade_offers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates own trade" ON public.trade_offers
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes own trade" ON public.trade_offers
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER touch_trade_offers BEFORE UPDATE ON public.trade_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX trade_offers_status_idx ON public.trade_offers (status, created_at DESC);