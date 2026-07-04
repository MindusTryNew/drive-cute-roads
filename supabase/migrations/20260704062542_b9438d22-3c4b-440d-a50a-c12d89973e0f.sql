CREATE TABLE public.save_states (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.save_states TO authenticated;
GRANT ALL ON public.save_states TO service_role;

ALTER TABLE public.save_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own save"
  ON public.save_states FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_save_state()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER touch_save_state_updated
BEFORE UPDATE ON public.save_states
FOR EACH ROW EXECUTE FUNCTION public.touch_save_state();