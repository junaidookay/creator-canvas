import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { ThumbsUp, Share2, Eye, Calendar, MessageSquare, User, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_SUGGESTED = [
  { id: '2', title: 'How I Built a Million Dollar App', creator: 'DevMaster', views: '189K', date: '5d ago', gradient: 'linear-gradient(135deg, hsl(160 70% 35%), hsl(200 80% 40%))' },
  { id: '3', title: 'Abstract Art Process - Digital Painting', creator: 'ArtFlow', views: '67K', date: '1d ago', gradient: 'linear-gradient(135deg, hsl(320 70% 45%), hsl(38 92% 55%))' },
  { id: '4', title: 'Deep Ambient Electronic Mix', creator: 'SonicWave', views: '312K', date: '3d ago', gradient: 'linear-gradient(135deg, hsl(280 60% 40%), hsl(187 85% 53%))' },
  { id: '5', title: 'Street Food Tour - Bangkok', creator: 'GlobeTrotter', views: '156K', date: '1w ago', gradient: 'linear-gradient(135deg, hsl(38 92% 45%), hsl(0 70% 50%))' },
];

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');

  // Mock video data — in production, fetch from Supabase using id
  const video = {
    id,
    title: 'Cinematic City Timelapse - New York After Dark',
    description: 'Experience the mesmerizing beauty of New York City at night through this stunning 4K timelapse. Shot over 30 nights across Manhattan, Brooklyn, and Queens.',
    creator: 'UrbanLens',
    views: '245,892',
    date: 'Feb 10, 2026',
    likes: 4523,
    category: 'Film',
  };

  const mockComments = [
    { id: '1', user: 'FilmFan42', content: 'This is absolutely stunning! The lighting is incredible.', date: '1d ago' },
    { id: '2', user: 'NightOwl', content: 'New York never looked so beautiful. What camera did you use?', date: '2d ago' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(200 80% 40%), hsl(250 60% 30%))' }}>
                <p className="text-foreground/60 text-sm">Video player — connect Supabase to load real videos</p>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-xl font-bold text-foreground mb-2">{video.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {video.views} views</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {video.date}</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{video.category}</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 border-y border-border mb-4">
                <Link to={`/channel/${video.creator}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{video.creator}</p>
                    <p className="text-xs text-muted-foreground">12.5K followers</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant={liked ? 'default' : 'outline'} size="sm" onClick={() => setLiked(!liked)}>
                    <ThumbsUp className="w-4 h-4 mr-1" /> {liked ? video.likes + 1 : video.likes}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-lg p-4 mb-6 border border-border">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{video.description}</p>
              </div>

              <AdSlot slot="watch-mid" format="horizontal" className="mb-6" />

              {/* Comments */}
              <div>
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Comments ({mockComments.length})
                </h2>

                {user && (
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-semibold">{user.email?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={2} className="mb-2" maxLength={1000} />
                      <Button size="sm" disabled={!comment.trim()}>
                        <Send className="w-3 h-3 mr-1" /> Post
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {mockComments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-foreground text-xs font-semibold">{c.user[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{c.user}</span>
                          <span className="text-xs text-muted-foreground">{c.date}</span>
                        </div>
                        <p className="text-sm text-foreground/80">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <AdSlot slot="watch-sidebar" format="vertical" className="mb-4" />
            <h3 className="font-semibold text-foreground text-sm">Suggested Videos</h3>
            <div className="space-y-4">
              {MOCK_SUGGESTED.map(v => <VideoCard key={v.id} {...v} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
