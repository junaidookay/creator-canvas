-- Backfill missing profiles (users created before/without the signup trigger)
INSERT INTO public.profiles (id, username, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || LEFT(u.id::text, 8)),
  COALESCE(u.raw_user_meta_data->>'display_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Ensure signup trigger exists for future users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Thumbnails are public, non-sensitive images: allow any authenticated user
-- to upload/manage them (upload code writes flat paths, not uid folders).
DROP POLICY IF EXISTS "Auth upload own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Auth update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete own thumbnails" ON storage.objects;

CREATE POLICY "Auth upload own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Auth update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails');

CREATE POLICY "Auth delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');
