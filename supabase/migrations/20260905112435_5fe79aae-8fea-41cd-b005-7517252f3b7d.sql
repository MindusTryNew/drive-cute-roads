CREATE TABLE public.custom_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid NOT NULL,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '🎁',
  description text NOT NULL DEFAULT '',
  price integer NOT NULL DEFAULT 1000,
  min_items integer NOT NULL DEFAULT 3,
  max_items integer NOT NULL DEFAULT 5,
  rarity_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  guarantee jsonb NOT NULL DEFAULT '{}'::jsonb,
  world_chance numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#9ca3af',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_packs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_packs TO authenticated;
GRANT ALL ON public.custom_packs TO service_role;

ALTER TABLE public.custom_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packs" ON public.custom_packs
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage packs" ON public.custom_packs
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()) AND author_id = auth.uid());

CREATE TRIGGER touch_custom_packs BEFORE UPDATE ON public.custom_packs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();