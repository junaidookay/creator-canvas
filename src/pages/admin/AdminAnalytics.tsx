import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Film, Users, Eye } from 'lucide-react';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [topVideos, setTopVideos] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<{ creator_id: string; total_views: number; username?: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      // Top videos by views
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title, views, creator_id')
        .order('views', { ascending: false })
        .limit(10);

      setTopVideos(videos ?? []);

      // Top creators by total views - aggregate from videos
      if (videos && videos.length > 0) {
        const creatorMap: Record<string, number> = {};
        videos.forEach(v => {
          creatorMap[v.creator_id] = (creatorMap[v.creator_id] || 0) + (v.views || 0);
        });

        // Fetch all videos for proper aggregation
        const { data: allVideos } = await supabase.from('videos').select('creator_id, views');
        const fullMap: Record<string, number> = {};
        allVideos?.forEach(v => {
          fullMap[v.creator_id] = (fullMap[v.creator_id] || 0) + (v.views || 0);
        });

        const creatorIds = Object.keys(fullMap);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', creatorIds);

        const creators = Object.entries(fullMap)
          .map(([creator_id, total_views]) => {
            const profile = profiles?.find(p => p.id === creator_id);
            return { creator_id, total_views, username: profile?.display_name || profile?.username || 'Unknown' };
          })
          .sort((a, b) => b.total_views - a.total_views)
          .slice(0, 10);

        setTopCreators(creators);
      }

      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" /> Top Videos by Views
          </h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : topVideos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No data yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topVideos.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{v.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      {fmt(v.views || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Creators */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Top Creators by Total Views
          </h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : topCreators.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No data yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topCreators.map((c, i) => (
                  <div key={c.creator_id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {c.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{c.username}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      {fmt(c.total_views)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
