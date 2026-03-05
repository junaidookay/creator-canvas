import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Heart, MessageSquare, User, Image as ImageIcon, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { uploadFile, validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/storage';
import { sendNotification } from '@/hooks/useNotifications';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);

    const postsData = data ?? [];
    setPosts(postsData);

    // Fetch like counts
    if (postsData.length > 0) {
      const ids = postsData.map(p => p.id);
      const { data: likesData } = await db
        .from('post_likes')
        .select('post_id')
        .in('post_id', ids);

      const counts: Record<string, number> = {};
      likesData?.forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
      setLikeCounts(counts);

      // Check if user liked
      if (user) {
        const { data: myLikes } = await db
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', ids);
        setLikedPosts(new Set(myLikes?.map(l => l.post_id) ?? []));
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [user]);

  const submitPost = async () => {
    if (!user || !newPost.trim()) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (newImage) {
      const err = validateFile(newImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
      if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); setPosting(false); return; }
      try {
        const result = await uploadFile(newImage, 'post-images', user.id);
        imageUrl = result.url;
      } catch (e: any) {
        toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
        setPosting(false);
        return;
      }
    }

    const { error } = await supabase.from('posts').insert({ user_id: user.id, content: newPost.trim(), image_url: imageUrl });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewPost('');
      setNewImage(null);
      fetchPosts();
    }
    setPosting(false);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    if (likedPosts.has(postId)) {
      await db.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
    } else {
      await db.from('post_likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Feed</h1>

        {user && (
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <Textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's on your mind?" rows={3} maxLength={2000} className="mb-3" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <ImageIcon className="w-4 h-4" />
                <span>{newImage ? newImage.name : 'Add image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setNewImage(e.target.files?.[0] || null)} />
              </label>
              <Button size="sm" disabled={!newPost.trim() || posting} onClick={submitPost}>
                <Send className="w-3 h-3 mr-1" /> {posting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const prof = (post as any).profiles;
              const isLiked = likedPosts.has(post.id);
              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Link to={`/channel/${prof?.username || ''}`} className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      {prof?.avatar_url
                        ? <img src={prof.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <User className="w-4 h-4 text-primary" />
                      }
                    </Link>
                    <div>
                      <Link to={`/channel/${prof?.username || ''}`} className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                        {prof?.display_name || prof?.username || 'Unknown'}
                      </Link>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover mb-3" />}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-destructive' : 'hover:text-destructive'}`}
                      disabled={!user}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> {likeCounts[post.id] || 0}
                    </button>
                    <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" /> Comments
                    </Link>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); toast({ title: 'Link copied' }); }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
