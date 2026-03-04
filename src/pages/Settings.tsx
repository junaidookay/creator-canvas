import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { User, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFile, validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/storage';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
      }
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">Log in to access settings.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;
    let bannerUrl = profile?.banner_url || null;

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

    if (bannerFile) {
      const err = validateFile(bannerFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
      if (err) { toast({ title: 'Error', description: err, variant: 'destructive' }); setSaving(false); return; }
      try {
        const result = await uploadFile(bannerFile, 'post-images', `banners/${user.id}`);
        bannerUrl = result.url;
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
      banner_url: bannerUrl,
    }).eq('id', user.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setAvatarFile(null);
      setBannerFile(null);
      toast({ title: 'Settings saved!' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Edit Profile</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <Input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label>Banner</Label>
                <Input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Platform settings (Supabase, Storage, AdSense) are managed in the <Button variant="link" className="text-xs p-0 h-auto" onClick={() => navigate('/admin')}>Admin Panel</Button>.
        </p>
      </div>
    </div>
  );
};

export default Settings;
