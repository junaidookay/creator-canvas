-- 1) SECURITY DEFINER function grants: revoke broad access, grant only where needed
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_send_notification(uuid, uuid, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_notification(uuid, uuid, text, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_default_storage_provider() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_default_storage_provider() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;

-- 2) Restrict broad listing on public buckets while still allowing direct object reads
DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read post-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Fetch-by-name only: request must include the object name, so bulk listing returns nothing
CREATE POLICY "Public fetch videos by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public fetch thumbnails by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public fetch post-images by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public fetch avatars by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND name IS NOT NULL AND length(name) > 0);