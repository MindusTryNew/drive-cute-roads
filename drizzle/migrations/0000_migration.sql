CREATE OR REPLACE FUNCTION public.claim_admin(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR upper(trim(_code)) <> 'DLA2026QXE' THEN
    RETURN false;
  END IF;
  INSERT INTO public.admin_users(user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin(text) TO authenticated;