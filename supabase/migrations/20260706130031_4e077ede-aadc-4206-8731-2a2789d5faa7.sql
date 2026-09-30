-- Lock down storage_provider_config so secrets cannot be read via the Data API.
-- Only service_role (used by edge functions) can read/write directly; admins
-- interact with a masked view through the storage-admin edge function.

REVOKE ALL ON public.storage_provider_config FROM anon, authenticated;
GRANT ALL ON public.storage_provider_config TO service_role;

-- Drop the previous admin-can-read policies. The edge function uses the service
-- role and enforces admin checks in code, so no authenticated policy is needed.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='storage_provider_config'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.storage_provider_config', p.policyname);
  END LOOP;
END$$;

-- Keep RLS enabled; with no policies + no grants, only service_role can access.
ALTER TABLE public.storage_provider_config ENABLE ROW LEVEL SECURITY;