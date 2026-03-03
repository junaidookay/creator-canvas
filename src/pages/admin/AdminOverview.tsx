import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Film, Eye, MessageSquare, FileText, Flag, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  users: number;
  videos: number;
  totalViews: number;
  comments: number;
  posts: number;
  reports: number;
  likes: number;
}

const StatCard = ({ icon: Icon, label, value, loading }: { icon: any; label: string; value: string; loading: boolean }) => (
  <div className="bg-card rounded-xl border border-border p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-foreground">{value}</p>}
  </div>
);

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ users: 0, videos: 0, totalViews: 0, comments: 0, posts: 0, reports: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [
        { count: userCount },
        { count: videoCount },
        { data: viewsData },
        { count: commentCount },
        { count: postCount },
        { count: reportCount },
        { count: likeCount },
        { data: videos },
        { data: reports },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('views'),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('videos').select('id, title, created_at, views, creator_id').order('created_at', { ascending: false }).limit(5),
        supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalViews = viewsData?.reduce((sum, v) => sum + (v.views || 0), 0) ?? 0;

      setStats({
        users: userCount ?? 0,
        videos: videoCount ?? 0,
        totalViews,
        comments: commentCount ?? 0,
        posts: postCount ?? 0,
        reports: reportCount ?? 0,
        likes: likeCount ?? 0,
      });
      setRecentVideos(videos ?? []);
      setRecentReports(reports ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={fmt(stats.users)} loading={loading} />
        <StatCard icon={Film} label="Total Videos" value={fmt(stats.videos)} loading={loading} />
        <StatCard icon={Eye} label="Total Views" value={fmt(stats.totalViews)} loading={loading} />
        <StatCard icon={MessageSquare} label="Comments" value={fmt(stats.comments)} loading={loading} />
        <StatCard icon={FileText} label="Posts" value={fmt(stats.posts)} loading={loading} />
        <StatCard icon={Heart} label="Likes" value={fmt(stats.likes)} loading={loading} />
        <StatCard icon={Flag} label="Open Reports" value={fmt(stats.reports)} loading={loading} />
      </div>

      {/* Recent uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Uploads</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : recentVideos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No videos uploaded yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Views</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVideos.map(v => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground truncate max-w-[200px]">{v.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{fmt(v.views || 0)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : recentReports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Flag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No reports yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Reason</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground capitalize">{r.target_type}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === 'open' ? 'bg-accent/20 text-accent' :
                          r.status === 'resolved' ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
