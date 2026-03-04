import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import HeroSection from '@/components/home/HeroSection';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, TrendingUp, Users, Layers, Star, Clock } from 'lucide-react';
import { VIDEO_CATEGORIES } from '@/types/database';
import { motion } from 'framer-motion';

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Index = () => {
  const [trending, setTrending] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { data: trendingData },
        { data: featuredData },
        { data: latestData },
        { data: creatorsData },
      ] = await Promise.all([
        supabase.from('videos').select('*, profiles:creator_id(username, display_name, avatar_url)').eq('is_disabled', false).eq('visibility', 'public').order('views', { ascending: false }).limit(8),
        supabase.from('videos').select('*, profiles:creator_id(username, display_name, avatar_url)').eq('is_disabled', false).eq('visibility', 'public').eq('is_featured', true).order('created_at', { ascending: false }).limit(4),
        supabase.from('videos').select('*, profiles:creator_id(username, display_name, avatar_url)').eq('is_disabled', false).eq('visibility', 'public').order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(7),
      ]);

      setTrending(trendingData ?? []);
      setFeatured(featuredData ?? []);
      setLatest(latestData ?? []);
      setCreators(creatorsData ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const renderVideoGrid = (videos: any[], cols = 4) => {
    if (loading) {
      return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-5`}>
          {[...Array(cols)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
        </div>
      );
    }
    if (videos.length === 0) {
      return <p className="text-sm text-muted-foreground py-8 text-center">No videos yet. Be the first to upload!</p>;
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {videos.map(v => {
          const p = (v as any).profiles;
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
    );
  };

  const COLORS = ['hsl(200 80% 50%)', 'hsl(160 70% 45%)', 'hsl(320 70% 50%)', 'hsl(280 60% 50%)', 'hsl(38 92% 55%)', 'hsl(225 50% 55%)', 'hsl(120 50% 45%)'];

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Categories */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {VIDEO_CATEGORIES.slice(0, 12).map(cat => (
            <Button key={cat} variant="secondary" size="sm" className="shrink-0 rounded-full text-xs">
              {cat}
            </Button>
          ))}
        </div>
      </section>

      <AdSlot slot="home-top" format="horizontal" className="container mx-auto px-4 mb-8" />

      {/* Trending */}
      <section className="container mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-foreground">Trending Now</h2>
        </div>
        {renderVideoGrid(trending.slice(0, 4))}
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Featured Videos</h2>
          </div>
          {renderVideoGrid(featured)}
        </section>
      )}

      <AdSlot slot="home-mid" format="horizontal" className="container mx-auto px-4 mb-8" />

      {/* Creators */}
      <section className="container mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Creators</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="w-40 h-40 rounded-xl shrink-0" />) : creators.map((c, i) => (
            <Link key={c.id} to={`/channel/${c.username || c.id}`}>
              <motion.div
                whileHover={{ y: -4 }}
                className="shrink-0 w-40 rounded-xl bg-card border border-border p-5 text-center hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold overflow-hidden" style={{ background: COLORS[i % COLORS.length], color: 'hsl(225 30% 5%)' }}>
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (c.display_name || c.username || '?')[0].toUpperCase()
                  )}
                </div>
                <p className="font-semibold text-foreground text-sm mb-1 truncate">{c.display_name || c.username || 'Creator'}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Uploads */}
      <section className="container mx-auto px-4 mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Latest Uploads</h2>
        </div>
        {renderVideoGrid(latest)}
      </section>

      {/* More to Explore */}
      {trending.length > 4 && (
        <section className="container mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">More to Explore</h2>
          </div>
          {renderVideoGrid(trending.slice(4))}
        </section>
      )}

      <AdSlot slot="home-bottom" format="horizontal" className="container mx-auto px-4 mb-8" />

      {/* CTA */}
      <section className="container mx-auto px-4 mb-16">
        <div className="rounded-2xl bg-card border border-border p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.3), transparent 70%)' }} />
          <div className="relative z-10">
            <Layers className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Ready to share your story?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Join creators building their audience on VSTREAM.</p>
            <Button size="lg" className="glow-primary" asChild><Link to="/signup">Get Started Free</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
