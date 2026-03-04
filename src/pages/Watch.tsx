import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/video/VideoCard';
import AdSlot from '@/components/ads/AdSlot';
import { ThumbsUp, Share2, Eye, Calendar, MessageSquare, User, Send, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Watch = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      // Fetch video
      const { data: vid } = await supabase.from('videos').select('*').eq('id', id).maybeSingle();
      if (!vid) { setLoading(false); return; }
      setVideo(vid);

      // Fetch creator profile, comments, likes, suggested in parallel
      const [
        { data: prof },
        { data: cmts },
        { count: likes },
        { data: suggestedVids },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', vid.creator_id).maybeSingle(),
        supabase.from('comments').select('*, profiles:user_id(id, username, display_name, avatar_url)').eq('video_id', id).order('created_at', { ascending: false }).limit(50),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('video_id', id),
        supabase.from('videos').select('*, profiles:creator_id(username, display_name)').neq('id', id).eq('is_disabled', false).eq('visibility', 'public').order('views', { ascending: false }).limit(6),
      ]);

      setCreator(prof);
      setComments(cmts ?? []);
      setLikeCount(likes ?? 0);
      setSuggested(suggestedVids ?? []);

      if (user) {
        const { data: myLike } = await supabase.from('likes').select('id').eq('video_id', id).eq('user_id', user.id).maybeSingle();
        setLiked(!!myLike);
      }

      // Increment views
      await supabase.from('videos').update({ views: (vid.views || 0) + 1 }).eq('id', id);

      setLoading(false);
    };
    load();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user || !id) return;
    if (liked) {
      await supabase.from('likes').delete().eq('video_id', id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ video_id: id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const postComment = async () => {
    if (!user || !id || !comment.trim()) return;
    setPosting(true);
    const { data, error } = await supabase.from('comments').insert({ video_id: id, user_id: user.id, content: comment.trim() }).select('*, profiles:user_id(id, username, display_name, avatar_url)').single();
    setPosting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setComments(prev => [data, ...prev]);
      setComment('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Video not found</h1>
          <Button asChild variant="outline"><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary mb-4">
              {video.video_url ? (
                <video src={video.video_url} controls className="w-full h-full object-contain bg-black" poster={video.thumbnail_url || undefined} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <p className="text-muted-foreground text-sm">Video unavailable</p>
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-xl font-bold text-foreground mb-2">{video.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {formatCount(video.views || 0)} views</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(video.created_at).toLocaleDateString()}</span>
                {video.category && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{video.category}</span>}
              </div>

              <div className="flex items-center justify-between gap-4 py-3 border-y border-border mb-4">
                <Link to={`/channel/${creator?.username || ''}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {creator?.avatar_url ? (
                      <img src={creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{creator?.display_name || creator?.username || 'Unknown'}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant={liked ? 'default' : 'outline'} size="sm" onClick={toggleLike} disabled={!user}>
                    <ThumbsUp className="w-4 h-4 mr-1" /> {likeCount}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied!' }); }}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                </div>
              </div>

              {video.description && (
                <div className="bg-card rounded-lg p-4 mb-6 border border-border">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{video.description}</p>
                </div>
              )}

              <AdSlot slot="watch-mid" format="horizontal" className="mb-6" />

              {/* Comments */}
              <div>
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Comments ({comments.length})
                </h2>

                {user && (
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-semibold">{user.email?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={2} className="mb-2" maxLength={1000} />
                      <Button size="sm" disabled={!comment.trim() || posting} onClick={postComment}>
                        <Send className="w-3 h-3 mr-1" /> {posting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.map(c => {
                    const prof = (c as any).profiles;
                    return (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                          {prof?.avatar_url ? (
                            <img src={prof.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-foreground text-xs font-semibold">{prof?.display_name?.[0] || prof?.username?.[0] || '?'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{prof?.display_name || prof?.username || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-foreground/80">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <AdSlot slot="watch-sidebar" format="vertical" className="mb-4" />
            <h3 className="font-semibold text-foreground text-sm">Suggested Videos</h3>
            <div className="space-y-4">
              {suggested.map(v => {
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
              {suggested.length === 0 && <p className="text-sm text-muted-foreground">No other videos yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
