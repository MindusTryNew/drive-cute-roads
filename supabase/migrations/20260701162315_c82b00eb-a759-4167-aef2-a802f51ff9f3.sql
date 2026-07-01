CREATE TABLE public.mods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_nick text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  payload jsonb NOT NULL,
  downloads integer NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.mods TO anon;
GRANT SELECT, INSERT, UPDATE ON public.mods TO authenticated;
GRANT ALL ON public.mods TO service_role;

ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse mods" ON public.mods FOR SELECT USING (true);
CREATE POLICY "Anyone can upload mods" ON public.mods FOR INSERT WITH CHECK (
  length(author_nick) BETWEEN 2 AND 24
  AND length(name) BETWEEN 2 AND 60
  AND kind IN ('car','map','part-pack','tuning-preset')
  AND jsonb_typeof(payload) = 'object'
);

CREATE OR REPLACE FUNCTION public.increment_mod_download(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.mods SET downloads = downloads + 1 WHERE id = _id;
$$;

CREATE INDEX idx_mods_kind_uploaded ON public.mods(kind, uploaded_at DESC);
CREATE INDEX idx_mods_downloads ON public.mods(downloads DESC);