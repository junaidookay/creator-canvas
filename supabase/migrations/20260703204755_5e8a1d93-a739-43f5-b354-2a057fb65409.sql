-- Create private schema (not exposed via PostgREST/GraphQL)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Recreate helper functions in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.can_send_notification(_actor uuid, _recipient uuid, _type text, _target_type text, _target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _actor IS NOT NULL
    AND _recipient IS NOT NULL
    AND _actor <> _recipient
    AND (
      (_type = 'follow' AND EXISTS (
         SELECT 1 FROM public.subscriptions
         WHERE follower_id = _actor AND creator_id = _recipient
      ))
      OR (_target_type = 'video' AND EXISTS (
         SELECT 1 FROM public.videos
         WHERE id = _target_id AND creator_id = _recipient
      ))
      OR (_target_type = 'post' AND EXISTS (
         SELECT 1 FROM public.posts
         WHERE id = _target_id AND user_id = _recipient
      ))
      OR (_target_type = 'comment' AND EXISTS (
         SELECT 1 FROM public.comments
         WHERE id = _target_id AND user_id = _recipient
      ))
      OR (_target_type = 'post_comment' AND EXISTS (
         SELECT 1 FROM public.post_comments
         WHERE id = _target_id AND user_id = _recipient
      ))
    )
$$;

CREATE OR REPLACE FUNCTION private.get_default_storage_provider()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT default_provider FROM public.storage_provider_config WHERE id = true;
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_send_notification(uuid, uuid, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.get_default_storage_provider() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_send_notification(uuid, uuid, text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_default_storage_provider() TO service_role;

-- Recreate policies to reference private.* helpers
-- reports
DROP POLICY IF EXISTS "Admin read reports" ON public.reports;
CREATE POLICY "Admin read reports" ON public.reports FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));
DROP POLICY IF EXISTS "Admin update reports" ON public.reports;
CREATE POLICY "Admin update reports" ON public.reports FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admin read all roles" ON public.user_roles;
CREATE POLICY "Admin read all roles" ON public.user_roles FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- posts
DROP POLICY IF EXISTS "Admin update posts" ON public.posts;
CREATE POLICY "Admin update posts" ON public.posts FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));
DROP POLICY IF EXISTS "Admin delete posts" ON public.posts;
CREATE POLICY "Admin delete posts" ON public.posts FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));
DROP POLICY IF EXISTS "Admins read all posts" ON public.posts;
CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

-- videos
DROP POLICY IF EXISTS "Admin update videos" ON public.videos;
CREATE POLICY "Admin update videos" ON public.videos FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));
DROP POLICY IF EXISTS "Admin delete videos" ON public.videos;
CREATE POLICY "Admin delete videos" ON public.videos FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));
DROP POLICY IF EXISTS "Admins read all videos" ON public.videos;
CREATE POLICY "Admins read all videos" ON public.videos FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

-- storage_provider_config
DROP POLICY IF EXISTS "Admins can insert storage config" ON public.storage_provider_config;
CREATE POLICY "Admins can insert storage config" ON public.storage_provider_config FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can delete storage config" ON public.storage_provider_config;
CREATE POLICY "Admins can delete storage config" ON public.storage_provider_config FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can update storage config" ON public.storage_provider_config;
CREATE POLICY "Admins can update storage config" ON public.storage_provider_config FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can read storage config" ON public.storage_provider_config;
CREATE POLICY "Admins can read storage config" ON public.storage_provider_config FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- notifications
DROP POLICY IF EXISTS "Auth insert notifications" ON public.notifications;
CREATE POLICY "Auth insert notifications" ON public.notifications FOR INSERT
  WITH CHECK ((auth.uid() = actor_id) AND private.can_send_notification(actor_id, user_id, type, target_type, target_id));

-- platform_settings
DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Admins can delete platform settings" ON public.platform_settings;
CREATE POLICY "Admins can delete platform settings" ON public.platform_settings FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop the now-unused public copies
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.can_send_notification(uuid, uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.get_default_storage_provider();