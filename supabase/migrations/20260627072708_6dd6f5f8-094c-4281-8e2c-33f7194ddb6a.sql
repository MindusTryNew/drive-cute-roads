CREATE TABLE public.market_cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_nick TEXT NOT NULL,
  car_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  body_type TEXT NOT NULL,
  top_speed NUMERIC NOT NULL,
  time_0_100 NUMERIC NOT NULL,
  car_json JSONB NOT NULL,
  price INT NOT NULL,
  times_purchased INT NOT NULL DEFAULT 0,
  listed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT market_cars_nick_len CHECK (char_length(seller_nick) BETWEEN 2 AND 20),
  CONSTRAINT market_cars_name_len CHECK (char_length(car_name) BETWEEN 1 AND 40),
  CONSTRAINT market_cars_price_range CHECK (price BETWEEN 100 AND 1000000),
  CONSTRAINT market_cars_color_fmt CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$')
);

CREATE INDEX market_cars_listed_at_idx ON public.market_cars (listed_at DESC);

GRANT SELECT, INSERT ON public.market_cars TO anon;
GRANT SELECT, INSERT, UPDATE ON public.market_cars TO authenticated;
GRANT ALL ON public.market_cars TO service_role;

ALTER TABLE public.market_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse the market"
  ON public.market_cars FOR SELECT
  USING (true);

CREATE POLICY "Anyone can list a car for sale"
  ON public.market_cars FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.increment_market_purchase(_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.market_cars SET times_purchased = times_purchased + 1 WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_market_purchase(UUID) TO anon, authenticated;