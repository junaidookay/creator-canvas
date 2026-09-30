import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import VideoCard from '@/components/video/VideoCard';
import { User, Calendar, Users, Settings, Video, Home, FileText, Zap, Send, Image as ImageIcon, MessageSquare, Play, Pencil, Trash2, X as XIcon, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { uploadFile, validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/storage';

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [shorts, setShorts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Post creation
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  // Video management
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) { setLoading(false); return; }
    const db = supabase as any;
    const [{ data: prof }, { data: allVids }, { data: postsData }, { count: followers }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db.from('videos').select('*').eq('creator_id', user.id).eq('is_disabled', false).order('created_at', { ascending: false }),
      supabase.from('posts').select('*').eq('user_id', user.id).eq('is_hidden', false).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    ]);
    setProfile(prof);
    const allVideos = allVids ?? [];
    setVideos(allVideos.filter((v: any) => !v.is_short));
    setShorts(allVideos.filter((v: any) => v.is_short));
    setPosts(postsData ?? []);
    setFollowerCount(followers ?? 0);
    if (prof) {
      setDisplayName(prof.display_name || '');
      setUsername(prof.username || '');
      setBio(prof.bio || '');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;
    if (avatarFile) {
      const err = validateFile(avatarFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
      if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); setSaving(false); return; }
      try {
        const result = await uploadFile(avatarFile, 'post-images', `avatars/${user.id}`);
        avatarUrl = result.url;
      } catch (e: any) {
        toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      username: username.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
    }).eq('id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProfile((p: any) => ({ ...p, display_name: displayName.trim(), username: username.trim(), bio: bio.trim(), avatar_url: avatarUrl }));
      setEditing(false);
      setAvatarFile(null);
      toast({ title: 'Profile updated!' });
    }
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
      loadData();
    }
    setPosting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">Log in to view your profile.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-16">
        <Skeleton className="h-48 md:h-64 w-full" />
        <div className="container mx-auto px-4 -mt-16 space-y-4">
          <div className="flex gap-6"><Skeleton className="w-28 h-28 rounded-2xl" /><div className="space-y-2 flex-1"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-60" /></div></div>
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        </div>
      </div>
    );
  }

  const creatorName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Creator';

  return (
    <div className="min-h-screen pt-16">
      {/* Banner */}
      <div className="h-48 md:h-64 relative bg-secondary">
        {profile?.banner_url ? (
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--secondary)))' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row gap-6 items-start mb-10">
          <div className="w-28 h-28 rounded-2xl border-4 border-background overflow-hidden shadow-lg bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{creatorName}</h1>
            <p className="text-sm text-muted-foreground mb-3">@{profile?.username || user.email?.split('@')[0] || 'creator'}</p>
            {profile?.bio && <p className="text-sm text-foreground/70 mb-4 max-w-lg">{profile.bio}</p>}
            <div className="flex gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formatCount(followerCount)} followers</span>
              <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {videos.length + shorts.length} videos</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
              <Settings className="w-4 h-4 mr-1.5" /> {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </motion.div>

        {/* Edit form */}
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card rounded-xl border border-border p-6 mb-10 max-w-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about yourself..." rows={4} maxLength={500} />
              </div>
              <div className="space-y-2">
                <Label>Avatar</Label>
                <Input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="home" className="mb-16">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="home" className="gap-1.5"><Home className="w-4 h-4" /> Home</TabsTrigger>
            <TabsTrigger value="videos" className="gap-1.5"><Video className="w-4 h-4" /> Videos</TabsTrigger>
            <TabsTrigger value="shorts" className="gap-1.5"><Zap className="w-4 h-4" /> Shorts</TabsTrigger>
            <TabsTrigger value="posts" className="gap-1.5"><FileText className="w-4 h-4" /> Posts</TabsTrigger>
          </TabsList>

          {/* HOME TAB */}
          <TabsContent value="home">
            <div className="space-y-10">
              {videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Play className="w-5 h-5 text-primary" /> Recent Videos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {videos.slice(0, 6).map(v => (
                      <VideoCard key={v.id} id={v.id} title={v.title} thumbnail={v.thumbnail_url} creator={creatorName} views={formatCount(v.views || 0)} date={new Date(v.created_at).toLocaleDateString()} category={v.category} />
                    ))}
                  </div>
                </div>
              )}

              {shorts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Shorts</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {shorts.slice(0, 5).map(v => (
                      <Link key={v.id} to={`/watch/${v.id}`} className="group">
                        <div className="aspect-[9/16] rounded-xl overflow-hidden bg-secondary relative">
                          {v.thumbnail_url ? (
                            <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Zap className="w-8 h-8 text-muted-foreground" /></div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
                            <p className="text-white/60 text-[10px]">{formatCount(v.views || 0)} views</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Recent Posts</h3>
                  <div className="space-y-4 max-w-2xl">
                    {posts.slice(0, 3).map(post => (
                      <div key={post.id} className="rounded-xl bg-card border border-border p-5">
                        <p className="text-foreground mb-3 whitespace-pre-wrap text-sm">{post.content}</p>
                        {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover mb-3" />}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" /> View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videos.length === 0 && shorts.length === 0 && posts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No content yet. Start by uploading a video or creating a post!</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button onClick={() => navigate('/upload')}>Upload Video</Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* VIDEOS TAB */}
          <TabsContent value="videos">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {videos.map(v => (
                  <div key={v.id} className="relative group">
                    <VideoCard id={v.id} title={v.title} thumbnail={v.thumbnail_url} creator={creatorName} views={formatCount(v.views || 0)} date={new Date(v.created_at).toLocaleDateString()} category={v.category} />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setEditingVideo(v); setEditTitle(v.title); setEditDesc(v.description || ''); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.preventDefault(); setDeleteConfirm(v.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No videos uploaded yet.</p>
                <Button className="mt-4" onClick={() => navigate('/upload')}>Upload your first video</Button>
              </div>
            )}

            {/* Edit Video Dialog */}
            <Dialog open={!!editingVideo} onOpenChange={open => { if (!open) setEditingVideo(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Video</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} maxLength={2000} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingVideo(null)}>Cancel</Button>
                  <Button disabled={editSaving || !editTitle.trim()} onClick={async () => {
                    if (!editingVideo) return;
                    setEditSaving(true);
                    const { error } = await supabase.from('videos').update({ title: editTitle.trim(), description: editDesc.trim() || null }).eq('id', editingVideo.id);
                    setEditSaving(false);
                    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
                    else { setEditingVideo(null); loadData(); toast({ title: 'Video updated!' }); }
                  }}>{editSaving ? 'Saving...' : 'Save'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Delete Video?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This action cannot be undone. The video will be permanently deleted.</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={async () => {
                    if (!deleteConfirm) return;
                    const { error } = await supabase.from('videos').delete().eq('id', deleteConfirm);
                    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
                    else { setDeleteConfirm(null); loadData(); toast({ title: 'Video deleted' }); }
                  }}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SHORTS TAB */}
          <TabsContent value="shorts">
            {shorts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {shorts.map(v => (
                  <Link key={v.id} to={`/watch/${v.id}`} className="group">
                    <div className="aspect-[9/16] rounded-xl overflow-hidden bg-secondary relative">
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Zap className="w-8 h-8 text-muted-foreground" /></div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
                        <p className="text-white/60 text-[10px]">{formatCount(v.views || 0)} views</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No shorts yet.</p>
                <Button className="mt-4" onClick={() => navigate('/upload')}>Upload a short</Button>
              </div>
            )}
          </TabsContent>

          {/* POSTS TAB */}
          <TabsContent value="posts">
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
                <p>No posts yet. Share your first update above!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
