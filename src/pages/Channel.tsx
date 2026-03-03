import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { User, Users, Calendar, MapPin, Video, UserPlus, UserCheck, FileText, Info, MessageSquare, Heart, Send, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { uploadFile, validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/storage';

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Channel = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Post creation
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const isOwner = user && profile && user.id === profile.id;

  const fetchChannel = async () => {
    if (!username) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
    if (!prof) { setLoading(false); return; }
    setProfile(prof);

    const [
      { data: vids },
      { data: postsData },
      { count: followers },
    ] = await Promise.all([
      supabase.from('videos').select('*').eq('creator_id', prof.id).eq('is_disabled', false).order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('user_id', prof.id).eq('is_hidden', false).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', prof.id),
    ]);

    setVideos(vids ?? []);
    setPosts(postsData ?? []);
    setFollowerCount(followers ?? 0);

    if (user) {
      const { data: sub } = await supabase.from('subscriptions').select('id').eq('creator_id', prof.id).eq('follower_id', user.id).maybeSingle();
      setFollowing(!!sub);
    }

    setLoading(false);
  };

  useEffect(() => { fetchChannel(); }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    if (following) {
      await supabase.from('subscriptions').delete().eq('creator_id', profile.id).eq('follower_id', user.id);
      setFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from('subscriptions').insert({ creator_id: profile.id, follower_id: user.id });
      setFollowing(true);
      setFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  };

  const submitPost = async () => {
    if (!user || !newPostText.trim()) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (newPostImage) {
      const err = validateFile(newPostImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
      if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); setPosting(false); return; }
      try {
        const result = await uploadFile(newPostImage, 'post-images', user.id);
        imageUrl = result.url;
      } catch (e: any) {
        toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
        setPosting(false);
        return;
      }
    }

    const { error } = await supabase.from('posts').insert({ user_id: user.id, content: newPostText.trim(), image_url: imageUrl });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewPostText('');
      setNewPostImage(null);
      fetchChannel();
    }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <Skeleton className="h-48 md:h-64 w-full" />
        <div className="container mx-auto px-4 -mt-16 space-y-4">
          <div className="flex gap-6"><Skeleton className="w-28 h-28 rounded-2xl" /><div className="space-y-2 flex-1"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60" /></div></div>
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Channel not found</h1>
          <p className="text-muted-foreground mb-6">The creator @{username} doesn't exist yet.</p>
          <Button asChild variant="outline"><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Banner */}
      <div className="h-48 md:h-64 relative bg-secondary">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--secondary)))' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-6 items-start mb-10">
          <div className="w-28 h-28 rounded-2xl border-4 border-background overflow-hidden shadow-lg bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.display_name || profile.username}</h1>
              {user && user.id !== profile.id && (
                <Button size="sm" variant={following ? 'secondary' : 'default'} onClick={toggleFollow} disabled={followLoading} className="gap-1.5">
                  {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>
            {profile.bio && <p className="text-sm text-foreground/70 mb-4 max-w-lg">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formatFollowers(followerCount)} followers</span>
              <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {videos.length} videos</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </motion.div>

        <AdSlot slot="channel-top" format="horizontal" className="mb-8" />

        <Tabs defaultValue="videos" className="mb-16">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="videos" className="gap-1.5"><Video className="w-4 h-4" /> Videos</TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5"><FileText className="w-4 h-4" /> Posts</TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5"><Info className="w-4 h-4" /> About</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.map(v => (
                  <VideoCard key={v.id} id={v.id} title={v.title} thumbnail={v.thumbnail_url} creator={profile.display_name || profile.username} views={formatFollowers(v.views || 0)} date={new Date(v.created_at).toLocaleDateString()} category={v.category} />
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
            {/* Post composer for channel owner */}
            {isOwner && (
              <div className="bg-card rounded-xl border border-border p-4 mb-6 max-w-2xl">
                <Textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="Share an update with your community..." rows={3} maxLength={2000} className="mb-3" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span>{newPostImage ? newPostImage.name : 'Add image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setNewPostImage(e.target.files?.[0] || null)} />
                  </label>
                  <Button size="sm" disabled={!newPostText.trim() || posting} onClick={submitPost}>
                    <Send className="w-3 h-3 mr-1" /> {posting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            )}

            {posts.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {posts.map(post => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card border border-border p-5">
                    <p className="text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
                    {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover mb-3" />}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> View
                      </Link>
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
              <h3 className="text-lg font-semibold text-foreground mb-4">About {profile.display_name || profile.username}</h3>
              <p className="text-foreground/70 whitespace-pre-line leading-relaxed">{profile.bio || 'No bio yet.'}</p>
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-foreground">{formatFollowers(followerCount)}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{videos.length}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</p>
                  <p className="text-xs text-muted-foreground">Joined</p>
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
