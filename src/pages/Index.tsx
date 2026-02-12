import HeroSection from '@/components/home/HeroSection';
import VideoCard from '@/components/video/VideoCard';
import { Link } from 'react-router-dom';
import AdSlot from '@/components/ads/AdSlot';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, Users, Layers } from 'lucide-react';
import { VIDEO_CATEGORIES } from '@/types/database';
import { motion } from 'framer-motion';

const MOCK_TRENDING = [
  { id: '1', title: 'Cinematic City Timelapse - New York After Dark', creator: 'UrbanLens', views: '245K', date: '2d ago', category: 'Film', gradient: 'linear-gradient(135deg, hsl(200 80% 40%), hsl(250 60% 30%))' },
  { id: '2', title: 'How I Built a Million Dollar App in 30 Days', creator: 'DevMaster', views: '189K', date: '5d ago', category: 'Technology', gradient: 'linear-gradient(135deg, hsl(160 70% 35%), hsl(200 80% 40%))' },
  { id: '3', title: 'Abstract Art Process - Digital Painting Tutorial', creator: 'ArtFlow', views: '67K', date: '1d ago', category: 'Art', gradient: 'linear-gradient(135deg, hsl(320 70% 45%), hsl(38 92% 55%))' },
  { id: '4', title: 'Deep Ambient Electronic Mix - 2 Hour Session', creator: 'SonicWave', views: '312K', date: '3d ago', category: 'Music', gradient: 'linear-gradient(135deg, hsl(280 60% 40%), hsl(187 85% 53%))' },
  { id: '5', title: 'Street Food Tour - Bangkok Night Markets', creator: 'GlobeTrotter', views: '156K', date: '1w ago', category: 'Travel', gradient: 'linear-gradient(135deg, hsl(38 92% 45%), hsl(0 70% 50%))' },
  { id: '6', title: 'Mastering Composition in Photography', creator: 'FrameByFrame', views: '93K', date: '4d ago', category: 'Education', gradient: 'linear-gradient(135deg, hsl(225 50% 40%), hsl(187 85% 53%))' },
  { id: '7', title: 'Indie Game Dev Log #14 - Boss Fight Design', creator: 'PixelForge', views: '78K', date: '6d ago', category: 'Gaming', gradient: 'linear-gradient(135deg, hsl(120 50% 35%), hsl(60 80% 45%))' },
  { id: '8', title: 'Pro Workout Routine - Full Body HIIT', creator: 'FitnessPro', views: '201K', date: '2d ago', category: 'Fitness', gradient: 'linear-gradient(135deg, hsl(0 70% 45%), hsl(38 92% 55%))' },
];

const MOCK_CREATORS = [
  { name: 'UrbanLens', followers: '12.5K', initial: 'U', color: 'hsl(200 80% 50%)' },
  { name: 'DevMaster', followers: '34.2K', initial: 'D', color: 'hsl(160 70% 45%)' },
  { name: 'ArtFlow', followers: '8.9K', initial: 'A', color: 'hsl(320 70% 50%)' },
  { name: 'SonicWave', followers: '45.1K', initial: 'S', color: 'hsl(280 60% 50%)' },
  { name: 'GlobeTrotter', followers: '21.3K', initial: 'G', color: 'hsl(38 92% 55%)' },
];

const Index = () => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MOCK_TRENDING.slice(0, 4).map(v => (
          <VideoCard key={v.id} {...v} />
        ))}
      </div>
    </section>

    <AdSlot slot="home-mid" format="horizontal" className="container mx-auto px-4 mb-8" />

    {/* Featured Creators */}
    <section className="container mx-auto px-4 mb-16">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Featured Creators</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {MOCK_CREATORS.map(c => (
          <Link key={c.name} to={`/channel/${c.name}`}>
            <motion.div
              whileHover={{ y: -4 }}
              className="shrink-0 w-40 rounded-xl bg-card border border-border p-5 text-center hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold" style={{ background: c.color, color: 'hsl(225 30% 5%)' }}>
                {c.initial}
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.followers} followers</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>

    {/* Latest */}
    <section className="container mx-auto px-4 mb-16">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Latest Uploads</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MOCK_TRENDING.slice(4).map(v => (
          <VideoCard key={v.id} {...v} />
        ))}
      </div>
    </section>

    <AdSlot slot="home-bottom" format="horizontal" className="container mx-auto px-4 mb-8" />

    {/* CTA */}
    <section className="container mx-auto px-4 mb-16">
      <div className="rounded-2xl bg-card border border-border p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at center, hsl(187 85% 53% / 0.3), transparent 70%)' }} />
        <div className="relative z-10">
          <Layers className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready to share your story?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Join thousands of creators building their audience on VSTREAM.</p>
          <Button size="lg" className="glow-primary">Get Started Free</Button>
        </div>
      </div>
    </section>
  </div>
);

export default Index;
