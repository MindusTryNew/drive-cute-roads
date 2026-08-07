ALTER TABLE public.trade_offers
  ADD COLUMN IF NOT EXISTS payout jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payout_claimed boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Taker can accept open trade" ON public.trade_offers;
CREATE POLICY "Taker can accept open trade"
ON public.trade_offers FOR UPDATE TO authenticated
USING (status = 'open' AND owner_id <> auth.uid())
WITH CHECK (status = 'taken' AND taken_by = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_offers TO authenticated;
GRANT SELECT ON public.trade_offers TO anon;
GRANT ALL ON public.trade_offers TO service_role;

CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nick text NOT NULL DEFAULT 'anon',
  item_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT ON public.wishlists TO anon;
GRANT ALL ON public.wishlists TO service_role;

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read wishlists" ON public.wishlists;
CREATE POLICY "Anyone can read wishlists" ON public.wishlists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner manages own wishlist" ON public.wishlists;
CREATE POLICY "Owner manages own wishlist" ON public.wishlists FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS touch_wishlists ON public.wishlists;
CREATE TRIGGER touch_wishlists BEFORE UPDATE ON public.wishlists
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();