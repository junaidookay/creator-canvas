import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { User, Users, Calendar, MapPin, Video, UserPlus, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const MOCK_CHANNELS: Record<string, {
  username: string;
  displayName: string;
  bio: string;
  followers: number;
  joined: string;
  location: string;
  bannerGradient: string;
  avatarColor: string;
  videos: { id: string; title: string; views: string; date: string; gradient: string }[];
}> = {
  urbanlens: {
    username: 'UrbanLens',
    displayName: 'Urban Lens',
    bio: 'Capturing the soul of cities through cinematic timelapse and drone footage. Based in NYC.',
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
  },
  devmaster: {
    username: 'DevMaster',
    displayName: 'Dev Master',
    bio: 'Full-stack developer sharing the journey of building products from zero to launch.',
    followers: 34200,
    joined: 'Mar 2025',
    location: 'San Francisco, USA',
    bannerGradient: 'linear-gradient(135deg, hsl(160 70% 20%), hsl(200 80% 25%))',
    avatarColor: 'hsl(160 70% 45%)',
    videos: [
      { id: '2', title: 'How I Built a Million Dollar App in 30 Days', views: '189K', date: '5d ago', gradient: 'linear-gradient(135deg, hsl(160 70% 35%), hsl(200 80% 40%))' },
      { id: '12', title: 'React vs Svelte - The Real Comparison', views: '145K', date: '2w ago', gradient: 'linear-gradient(135deg, hsl(180 60% 35%), hsl(220 70% 40%))' },
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

        {/* Videos */}
        <div className="mb-16">
          <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" /> Videos
          </h2>
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
        </div>
      </div>
    </div>
  );
};

export default Channel;
