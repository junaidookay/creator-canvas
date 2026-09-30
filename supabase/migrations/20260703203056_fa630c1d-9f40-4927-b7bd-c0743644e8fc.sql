CREATE TABLE IF NOT EXISTS public.storage_provider_config (
  id boolean PRIMARY KEY DEFAULT true,
  default_provider text NOT NULL DEFAULT 'supabase',
  vimeo_access_token text,
  bunny_api_key text,
  bunny_library_id text,
  bunny_cdn_hostname text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT storage_provider_config_singleton CHECK (id = true),
  CONSTRAINT storage_provider_config_provider_check
    CHECK (default_provider IN ('supabase', 'vimeo', 'bunny'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_provider_config TO authenticated;
GRANT ALL ON public.storage_provider_config TO service_role;

ALTER TABLE public.storage_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read storage config"
  ON public.storage_provider_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert storage config"
  ON public.storage_provider_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update storage config"
  ON public.storage_provider_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete storage config"
  ON public.storage_provider_config FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.storage_provider_config (id, default_provider)
VALUES (true, 'supabase')
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS storage_provider_config_updated_at ON public.storage_provider_config;
CREATE TRIGGER storage_provider_config_updated_at
  BEFORE UPDATE ON public.storage_provider_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public helper to expose ONLY the default provider (not credentials)
CREATE OR REPLACE FUNCTION public.get_default_storage_provider()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT default_provider FROM public.storage_provider_config WHERE id = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_default_storage_provider() TO anon, authenticated;