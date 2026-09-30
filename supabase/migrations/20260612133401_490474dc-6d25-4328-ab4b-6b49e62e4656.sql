
-- 1. Videos: restrict public SELECT to non-disabled, public videos
DROP POLICY IF EXISTS "Public videos" ON public.videos;

CREATE POLICY "Public videos visible"
ON public.videos FOR SELECT
TO public
USING (is_disabled = false AND visibility = 'public');

CREATE POLICY "Creators read own videos"
ON public.videos FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Admins read all videos"
ON public.videos FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 2. Posts: hide is_hidden posts from public; authors & admins still see them
DROP POLICY IF EXISTS "Public posts" ON public.posts;

CREATE POLICY "Public posts visible"
ON public.posts FOR SELECT
TO public
USING (is_hidden = false);

CREATE POLICY "Authors read own posts"
ON public.posts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all posts"
ON public.posts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 3. Notifications: require legitimate relationship between actor and recipient
CREATE OR REPLACE FUNCTION public.can_send_notification(
  _actor uuid,
  _recipient uuid,
  _type text,
  _target_type text,
  _target_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    _actor IS NOT NULL
    AND _recipient IS NOT NULL
    AND _actor <> _recipient
    AND (
      -- follow notification: actor must actually follow recipient
      (_type = 'follow' AND EXISTS (
         SELECT 1 FROM public.subscriptions
         WHERE follower_id = _actor AND creator_id = _recipient
      ))
      -- video interactions: recipient must own the target video
      OR (_target_type = 'video' AND EXISTS (
         SELECT 1 FROM public.videos
         WHERE id = _target_id AND creator_id = _recipient
      ))
      -- post interactions: recipient must own the target post
      OR (_target_type = 'post' AND EXISTS (
         SELECT 1 FROM public.posts
         WHERE id = _target_id AND user_id = _recipient
      ))
      -- comment reply: recipient must own the target comment
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

DROP POLICY IF EXISTS "Auth insert notifications" ON public.notifications;

CREATE POLICY "Auth insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = actor_id
  AND public.can_send_notification(actor_id, user_id, type, target_type, target_id)
);

-- 4. Storage: post-images upload must be in user's own folder
DROP POLICY IF EXISTS "Auth users upload post images" ON storage.objects;

CREATE POLICY "Auth users upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Storage: videos & thumbnails owner-scoped write/update/delete
CREATE POLICY "Auth upload own videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth update own videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth upload own thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth update own thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Auth delete own thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'thumbnails'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
