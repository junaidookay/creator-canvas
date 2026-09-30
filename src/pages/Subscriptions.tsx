import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/video/VideoCard';
import { Users, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 12;

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchVideos = useCallback(async (offset = 0, reset = false) => {
    if (!user) return;
    if (offset === 0) setLoading(true); else setLoadingMore(true);

    // Get creator IDs the user follows
    const { data: subs } = await supabase.from('subscriptions').select('creator_id').eq('follower_id', user.id);
    const creatorIds = subs?.map(s => s.creator_id) ?? [];

    if (creatorIds.length === 0) {
      setVideos([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const { data } = await supabase
      .from('videos')
      .select('*, profiles:creator_id(username, display_name, avatar_url)')
      .in('creator_id', creatorIds)
      .eq('is_disabled', false)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const fetched = data ?? [];
    setVideos(prev => reset || offset === 0 ? fetched : [...prev, ...fetched]);
    setHasMore(fetched.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => { fetchVideos(0, true); }, [fetchVideos]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">Log in to see videos from channels you follow.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg mb-2">No videos from your subscriptions yet</p>
            <p className="text-sm mb-6">Subscribe to channels to see their latest content here.</p>
            <Button onClick={() => navigate('/videos')}>Explore Videos</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map(v => {
                const p = v.profiles as any;
                return (
                  <VideoCard
                    key={v.id}
                    id={v.id}
                    title={v.title}
                    thumbnail={v.thumbnail_url}
                    creator={p?.display_name || p?.username || 'Unknown'}
                    views={formatCount(v.views || 0)}
                    date={new Date(v.created_at).toLocaleDateString()}
                    category={v.category}
                  />
                );
              })}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" disabled={loadingMore} onClick={() => fetchVideos(videos.length)}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
