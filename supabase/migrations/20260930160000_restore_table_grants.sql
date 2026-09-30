-- Restore table privileges lost outside migration history.
-- PostgREST returns 401 (SQLSTATE 42501, insufficient privilege) when the
-- role lacks table-level GRANT, regardless of RLS policies.

-- videos: public browse, authenticated CRUD (RLS gates rows)
GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;

-- posts: public feed, authenticated CRUD (RLS gates rows)
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

-- reports: admin/moderator screens + user submissions (authenticated only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

-- user_roles: used by useAdminRole hook (authenticated only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
