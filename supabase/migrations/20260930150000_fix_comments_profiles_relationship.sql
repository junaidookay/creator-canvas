-- The comments table was created outside migration history (in the Lovable
-- dashboard) and lacks an FK to profiles, breaking PostgREST embeds
-- (`profiles:user_id`) used by the Watch page.

-- Backfill profiles first so the FK can be satisfied
INSERT INTO public.profiles (id, username, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || LEFT(u.id::text, 8)),
  COALESCE(u.raw_user_meta_data->>'display_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Remove orphaned comment rows (user no longer exists) that would block the FK
DELETE FROM public.comments c
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.user_id);

-- Add FK comments.user_id -> profiles.id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = 'public.comments'::regclass
      AND c.confrelid = 'public.profiles'::regclass
      AND c.contype = 'f'
      AND c.conkey = ARRAY[
            (SELECT attnum FROM pg_attribute
             WHERE attrelid = 'public.comments'::regclass AND attname = 'user_id')
          ]::smallint[]
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- RLS: public read, author insert/delete (matches post_comments)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public comments" ON public.comments;
CREATE POLICY "Public comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth comment" ON public.comments;
CREATE POLICY "Auth comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own delete comment" ON public.comments;
CREATE POLICY "Own delete comment" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);
