import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import VideoCard from '@/components/video/VideoCard';
import { User, MapPin, Calendar, Users, Settings, Video } from 'lucide-react';
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
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const [{ data: prof }, { data: vids }, { count: followers }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('videos').select('*').eq('creator_id', user.id).eq('is_disabled', false).order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
      ]);
      setProfile(prof);
      setVideos(vids ?? []);
      setFollowerCount(followers ?? 0);
      if (prof) {
        setDisplayName(prof.display_name || '');
        setUsername(prof.username || '');
        setBio(prof.bio || '');
      }
      setLoading(false);
    };
    load();
  }, [user]);

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
            <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || user.email?.split('@')[0] || 'Creator'}</h1>
            <p className="text-sm text-muted-foreground mb-3">@{profile?.username || user.email?.split('@')[0] || 'creator'}</p>
            {profile?.bio && <p className="text-sm text-foreground/70 mb-4 max-w-lg">{profile.bio}</p>}
            <div className="flex gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {formatCount(followerCount)} followers</span>
              <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {videos.length} videos</span>
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

        <h2 className="text-lg font-bold text-foreground mb-4">Your Videos</h2>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {videos.map(v => (
              <VideoCard key={v.id} id={v.id} title={v.title} thumbnail={v.thumbnail_url} creator={profile?.display_name || profile?.username || 'You'} views={formatCount(v.views || 0)} date={new Date(v.created_at).toLocaleDateString()} category={v.category} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground mb-16">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No videos uploaded yet.</p>
            <Button className="mt-4" onClick={() => navigate('/upload')}>Upload your first video</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
