import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Type helper for new tables not yet in generated types
const db = supabase as any;
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageSquare, Share2, User, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    if (!id) return;
    const { data: postData } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
    if (!postData) { setLoading(false); return; }
    setPost(postData);

    const [
      { data: profileData },
      { data: commentsData },
      { count: likes },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', postData.user_id).maybeSingle(),
      db.from('post_comments').select('*, profiles:user_id(id, username, display_name, avatar_url)').eq('post_id', id).order('created_at', { ascending: true }),
      db.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    ]);

    setProfile(profileData);
    setComments(commentsData ?? []);
    setLikeCount(likes ?? 0);

    if (user) {
      const { data: myLike } = await db.from('post_likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle();
      setLiked(!!myLike);
    }

    setLoading(false);
  };

  useEffect(() => { fetchPost(); }, [id, user]);

  const toggleLike = async () => {
    if (!user || !id) return;
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const submitComment = async () => {
    if (!user || !id || !commentText.trim()) return;
    const { error } = await supabase.from('post_comments').insert({ post_id: id, user_id: user.id, content: commentText.trim() });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setCommentText('');
      fetchPost();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Post not found</h1>
          <Button asChild variant="outline"><Link to="/feed">Back to Feed</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-6 mb-6">
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <Link to={`/channel/${profile?.username || ''}`} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <User className="w-5 h-5 text-primary" />
              }
            </Link>
            <div>
              <Link to={`/channel/${profile?.username || ''}`} className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                {profile?.display_name || profile?.username || 'Unknown'}
              </Link>
              <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Content */}
          <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} alt="" className="rounded-lg w-full max-h-96 object-cover mb-4" />
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
              disabled={!user}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likeCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" /> {comments.length}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied' }); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </motion.div>

        {/* Comments */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Comments ({comments.length})</h2>

          {user && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-semibold">{user.email?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." rows={2} className="mb-2" maxLength={1000} />
                <Button size="sm" disabled={!commentText.trim()} onClick={submitComment}>
                  <Send className="w-3 h-3 mr-1" /> Post
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet.</p>
            ) : (
              comments.map(c => {
                const cp = (c as any).profiles;
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-foreground text-xs font-semibold">{cp?.display_name?.[0] || cp?.username?.[0] || '?'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{cp?.display_name || cp?.username || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
