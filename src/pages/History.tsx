import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/video/VideoCard';
import { History as HistoryIcon, User, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 16;

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(async (offset = 0, reset = false) => {
    if (!user) return;
    if (offset === 0) setLoading(true); else setLoadingMore(true);

    const { data } = await supabase
      .from('watch_history')
      .select('*, videos:video_id(*, profiles:creator_id(username, display_name))')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const fetched = (data ?? []).filter(h => h.videos);
    setVideos(prev => reset || offset === 0 ? fetched : [...prev, ...fetched]);
    setHasMore(fetched.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [user]);

  useEffect(() => { fetchHistory(0, true); }, [fetchHistory]);

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from('watch_history').delete().eq('user_id', user.id);
    setVideos([]);
    toast({ title: 'Watch history cleared' });
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">Log in to see your watch history.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Watch History</h1>
          </div>
          {videos.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear History
            </Button>
          )}
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
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg mb-2">No watch history</p>
            <p className="text-sm mb-6">Videos you watch will appear here.</p>
            <Button onClick={() => navigate('/videos')}>Explore Videos</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map(h => {
                const v = h.videos as any;
                const p = v?.profiles as any;
                return (
                  <VideoCard
                    key={h.id}
                    id={v.id}
                    title={v.title}
                    thumbnail={v.thumbnail_url}
                    creator={p?.display_name || p?.username || 'Unknown'}
                    views={formatCount(v.views || 0)}
                    date={new Date(h.watched_at).toLocaleDateString()}
                    category={v.category}
                  />
                );
              })}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" disabled={loadingMore} onClick={() => fetchHistory(videos.length)}>
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

export default History;
