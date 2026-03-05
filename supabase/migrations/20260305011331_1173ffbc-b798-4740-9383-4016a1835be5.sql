
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'follow', 'like_video', 'like_post', 'comment_video', 'comment_post'
  actor_id uuid NOT NULL,
  target_id uuid, -- video_id, post_id, etc.
  target_type text, -- 'video', 'post', 'comment'
  message text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Own notifications read" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Own notifications update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert notifications (for others)
CREATE POLICY "Auth insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- Users can delete their own notifications
CREATE POLICY "Own notifications delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
