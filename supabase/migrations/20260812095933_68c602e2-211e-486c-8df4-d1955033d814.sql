CREATE TABLE public.custom_rarities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#9ca3af',
  emoji text NOT NULL DEFAULT '✨',
  cooldown_sec integer NOT NULL DEFAULT 3600,
  ladder_rank integer NOT NULL DEFAULT 100,
  price integer NOT NULL DEFAULT 1000,
  pack_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_rarities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_rarities TO authenticated;
GRANT ALL ON public.custom_rarities TO service_role;
ALTER TABLE public.custom_rarities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active rarities" ON public.custom_rarities FOR SELECT USING (active = true);
CREATE POLICY "Admins manage rarities" ON public.custom_rarities FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND author_id = auth.uid());

CREATE TABLE public.custom_collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  item_key text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '❔',
  description text NOT NULL DEFAULT '',
  rarity_key text NOT NULL DEFAULT 'common',
  effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  series_key text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_collectibles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_collectibles TO authenticated;
GRANT ALL ON public.custom_collectibles TO service_role;
ALTER TABLE public.custom_collectibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active items" ON public.custom_collectibles FOR SELECT USING (active = true);
CREATE POLICY "Admins manage items" ON public.custom_collectibles FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND author_id = auth.uid());

CREATE TABLE public.custom_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🎁',
  contents jsonb NOT NULL DEFAULT '{}'::jsonb,
  price integer NOT NULL DEFAULT 1000,
  starts_at timestamptz,
  ends_at timestamptz,
  once_per_player boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_bundles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_bundles TO authenticated;
GRANT ALL ON public.custom_bundles TO service_role;
ALTER TABLE public.custom_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active bundles" ON public.custom_bundles FOR SELECT USING (active = true);
CREATE POLICY "Admins manage bundles" ON public.custom_bundles FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()) AND author_id = auth.uid());

CREATE TRIGGER touch_custom_rarities BEFORE UPDATE ON public.custom_rarities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_custom_collectibles BEFORE UPDATE ON public.custom_collectibles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_custom_bundles BEFORE UPDATE ON public.custom_bundles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();