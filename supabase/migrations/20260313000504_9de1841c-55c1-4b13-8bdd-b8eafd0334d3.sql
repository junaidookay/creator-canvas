DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'videos_creator_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.videos ADD CONSTRAINT videos_creator_id_profiles_fkey FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;