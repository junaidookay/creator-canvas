import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'admin' | 'moderator' | null;

export const useAdminRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .limit(1)
        .maybeSingle();

      setRole(data?.role as AdminRole ?? null);
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, isAdmin: role === 'admin', isModerator: role === 'moderator', hasAccess: role === 'admin' || role === 'moderator', loading };
};
