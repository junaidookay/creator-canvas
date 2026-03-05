import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Trash2, Film, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  actor_id: string;
  target_id: string | null;
  target_type: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor_profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

const ICON_MAP: Record<string, typeof Heart> = {
  follow: UserPlus,
  like_video: Heart,
  like_post: Heart,
  comment_video: MessageSquare,
  comment_post: MessageSquare,
};

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const getNotifLink = (n: Notification) => {
  if (n.target_type === 'video' && n.target_id) return `/watch/${n.target_id}`;
  if (n.target_type === 'post' && n.target_id) return `/post/${n.target_id}`;
  if (n.type === 'follow') return `/channel/${n.actor_profile?.username || n.actor_id}`;
  return '#';
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Fetch actor profiles
      const actorIds = [...new Set(data.map((n: any) => n.actor_id))] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', actorIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      const enriched = data.map((n: any) => ({
        ...n,
        actor_profile: profileMap.get(n.actor_id) || null,
      }));
      setNotifications(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast({ title: 'All notifications marked as read' });
  };

  const deleteAll = async () => {
    if (!user) return;
    await (supabase as any)
      .from('notifications')
      .delete()
      .eq('user_id', user.id);
    setNotifications([]);
    toast({ title: 'All notifications cleared' });
  };

  if (authLoading) return <div className="min-h-screen pt-20 px-4"><Skeleton className="h-8 w-48 mx-auto" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={deleteAll} className="text-muted-foreground">
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h2>
            <p className="text-muted-foreground text-sm">When someone interacts with your content, you'll see it here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {notifications.map(n => {
                const Icon = ICON_MAP[n.type] || Bell;
                const link = getNotifLink(n);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                  >
                    <Link
                      to={link}
                      className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                        n.is_read ? 'bg-card hover:bg-muted/50' : 'bg-primary/5 hover:bg-primary/10 border border-primary/10'
                      }`}
                      onClick={async () => {
                        if (!n.is_read) {
                          await (supabase as any).from('notifications').update({ is_read: true }).eq('id', n.id);
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {n.actor_profile?.avatar_url ? (
                          <img src={n.actor_profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          <Icon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">
                            {n.actor_profile?.display_name || n.actor_profile?.username || 'Someone'}
                          </span>{' '}
                          {n.message || getDefaultMessage(n.type)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

const getDefaultMessage = (type: string) => {
  switch (type) {
    case 'follow': return 'started following you';
    case 'like_video': return 'liked your video';
    case 'like_post': return 'liked your post';
    case 'comment_video': return 'commented on your video';
    case 'comment_post': return 'commented on your post';
    default: return 'interacted with your content';
  }
};

export default Notifications;
