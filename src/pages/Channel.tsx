import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { User, Users, Calendar, MapPin, Video, UserPlus, UserCheck, FileText, Info, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const MOCK_CHANNELS: Record<string, {
  username: string;
  displayName: string;
  bio: string;
  about: string;
  followers: number;
  joined: string;
  location: string;
  bannerGradient: string;
  avatarColor: string;
  videos: { id: string; title: string; views: string; date: string; gradient: string }[];
  posts: { id: string; content: string; date: string; likes: number }[];
}> = {
  urbanlens: {
    username: 'UrbanLens',
    displayName: 'Urban Lens',
    bio: 'Capturing the soul of cities through cinematic timelapse and drone footage. Based in NYC.',
    about: 'Urban Lens is a cinematic photography and videography channel focused on capturing the raw beauty of metropolitan life. From stunning skyline timelapses to immersive street-level drone footage, we bring the energy of cities to your screen.\n\nEquipment: Sony A7S III, DJI Mavic 3, Zhiyun Crane 4\n\nFor collaborations: urbanlens@email.com',
    followers: 12500,
    joined: 'Jan 2025',
    location: 'New York, USA',
    bannerGradient: 'linear-gradient(135deg, hsl(200 80% 25%), hsl(250 60% 20%))',
    avatarColor: 'hsl(200 80% 50%)',
    videos: [
      { id: '1', title: 'Cinematic City Timelapse - New York After Dark', views: '245K', date: '2d ago', gradient: 'linear-gradient(135deg, hsl(200 80% 40%), hsl(250 60% 30%))' },
      { id: '10', title: 'Golden Hour in Manhattan - 4K Drone', views: '128K', date: '1w ago', gradient: 'linear-gradient(135deg, hsl(38 80% 45%), hsl(200 70% 35%))' },
      { id: '11', title: 'Brooklyn Bridge at Night', views: '89K', date: '2w ago', gradient: 'linear-gradient(135deg, hsl(220 60% 30%), hsl(260 50% 25%))' },
    ],
    posts: [
      { id: 'p1', content: 'Just wrapped an incredible shoot in Times Square at 3AM. The city never sleeps and neither do I 🌃', date: '1d ago', likes: 342 },
      { id: 'p2', content: 'New drone footage dropping this Friday! Manhattan has never looked this good from above.', date: '4d ago', likes: 218 },
    ],
  },
  devmaster: {
    username: 'DevMaster',
    displayName: 'Dev Master',
    bio: 'Full-stack developer sharing the journey of building products from zero to launch.',
    about: 'Dev Master is your go-to channel for real-world software development. No tutorials — just raw, unfiltered build logs showing you the journey from idea to shipped product.\n\nStack: React, Node.js, PostgreSQL, AWS\n\nBusiness inquiries: devmaster@email.com',
    followers: 34200,
    joined: 'Mar 2025',
    location: 'San Francisco, USA',
    bannerGradient: 'linear-gradient(135deg, hsl(160 70% 20%), hsl(200 80% 25%))',
    avatarColor: 'hsl(160 70% 45%)',
    videos: [
      { id: '2', title: 'How I Built a Million Dollar App in 30 Days', views: '189K', date: '5d ago', gradient: 'linear-gradient(135deg, hsl(160 70% 35%), hsl(200 80% 40%))' },
      { id: '12', title: 'React vs Svelte - The Real Comparison', views: '145K', date: '2w ago', gradient: 'linear-gradient(135deg, hsl(180 60% 35%), hsl(220 70% 40%))' },
    ],
    posts: [
      { id: 'p3', content: 'Shipped v2.0 of my SaaS today. 14 hour days for 3 weeks straight. Worth it. 🚀', date: '2d ago', likes: 891 },
    ],
  },
};

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Channel = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);

  const key = username?.toLowerCase() || '';
  const channel = MOCK_CHANNELS[key];

  if (!channel) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Channel not found</h1>
          <p className="text-muted-foreground mb-6">The creator @{username} doesn't exist yet.</p>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Banner */}
      <div className="h-48 md:h-64 relative" style={{ background: channel.bannerGradient }}>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 items-start mb-10"
        >
          <div
            className="w-28 h-28 rounded-2xl border-4 border-background flex items-center justify-center shadow-lg text-3xl font-bold"
            style={{ background: channel.avatarColor, color: 'hsl(225 30% 5%)' }}
          >
            {channel.username[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{channel.displayName}</h1>
              {user && (
                <Button
                  size="sm"
                  variant={following ? 'secondary' : 'default'}
                  onClick={() => setFollowing(!following)}
                  className="gap-1.5"
                >
                  {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">@{channel.username}</p>
            <p className="text-sm text-foreground/70 mb-4 max-w-lg">{channel.bio}</p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {formatFollowers(following ? channel.followers + 1 : channel.followers)} followers
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" /> {channel.videos.length} videos
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {channel.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {channel.joined}
              </span>
            </div>
          </div>
        </motion.div>

        <AdSlot slot="channel-top" format="horizontal" className="mb-8" />

        {/* Tabs */}
        <Tabs defaultValue="videos" className="mb-16">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="videos" className="gap-1.5">
              <Video className="w-4 h-4" /> Videos
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5">
              <FileText className="w-4 h-4" /> Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5">
              <Info className="w-4 h-4" /> About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {channel.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {channel.videos.map(v => (
                  <VideoCard key={v.id} {...v} creator={channel.username} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No videos uploaded yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts">
            {channel.posts.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {channel.posts.map(post => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-card border border-border p-5"
                  >
                    <p className="text-foreground mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post.likes} likes
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No posts yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <div className="max-w-2xl rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">About {channel.displayName}</h3>
              <p className="text-foreground/70 whitespace-pre-line leading-relaxed">{channel.about}</p>
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{formatFollowers(channel.followers)}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{channel.videos.length}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{channel.joined}</p>
                  <p className="text-xs text-muted-foreground">Joined</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{channel.location}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Channel;
