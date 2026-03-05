import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const { count: c } = await (supabase as any)
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setCount(c ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
};

export const sendNotification = async (
  actorId: string,
  userId: string,
  type: string,
  targetId?: string,
  targetType?: string,
  message?: string
) => {
  if (actorId === userId) return; // don't notify yourself
  await (supabase as any).from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    target_id: targetId || null,
    target_type: targetType || null,
    message: message || null,
  });
};
