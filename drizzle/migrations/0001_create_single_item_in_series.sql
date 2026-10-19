CREATE OR REPLACE FUNCTION public.create_single_item_in_series(_item jsonb, _series_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Keine Admin-Rechte für dieses Konto.';
  END IF;
  IF _series_id IS NOT NULL THEN
    PERFORM id FROM public.collection_series WHERE id = _series_id AND author_id = auth.uid() FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Serie nicht gefunden oder nicht bearbeitbar.'; END IF;
  END IF;
  INSERT INTO public.custom_collectibles (author_id, item_key, name, emoji, description, rarity_key, effect, series_key, active)
  VALUES (auth.uid(), _item->>'item_key', _item->>'name', _item->>'emoji', COALESCE(_item->>'description', ''), _item->>'rarity_key', COALESCE(_item->'effect', '{}'::jsonb), _series_id::text, true);
  IF _series_id IS NOT NULL THEN
    UPDATE public.collection_series SET item_ids = item_ids || jsonb_build_array(_item->>'item_key') WHERE id = _series_id AND author_id = auth.uid();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.create_single_item_in_series(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_single_item_in_series(jsonb, uuid) TO authenticated;