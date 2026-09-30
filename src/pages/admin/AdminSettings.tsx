import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveSupabaseConfig, getSupabaseConfig, clearSupabaseConfig } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Database, HardDrive, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { user } = useAuth();

  // Supabase config
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbSaved, setSbSaved] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config) { setSbUrl(config.url); setSbKey(config.anonKey); }

    if (user) {
      supabase.from('profiles').select('display_name, bio').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
        }
      });
    }
  }, [user]);

  const handleSaveSupabase = () => {
    if (!sbUrl.trim() || !sbKey.trim()) return;
    saveSupabaseConfig(sbUrl.trim(), sbKey.trim());
    setSbSaved(true);
    setTimeout(() => { setSbSaved(false); window.location.reload(); }, 1500);
  };

  const handleClearSupabase = () => {
    clearSupabaseConfig();
    setSbUrl('');
    setSbKey('');
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim(), bio: bio.trim() }).eq('id', user.id);
    setProfileLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile saved' });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <Tabs defaultValue="supabase" className="max-w-2xl">
        <TabsList className="mb-6 w-full justify-start">
          <TabsTrigger value="supabase"><Database className="w-4 h-4 mr-1.5" /> Supabase</TabsTrigger>
          <TabsTrigger value="storage"><HardDrive className="w-4 h-4 mr-1.5" /> Storage</TabsTrigger>
          {user && <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" /> Profile</TabsTrigger>}
        </TabsList>

        <TabsContent value="supabase" className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-1">Supabase Connection</h2>
            <p className="text-sm text-muted-foreground mb-4">Manage your external Supabase project connection.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <Input value={sbUrl} onChange={e => setSbUrl(e.target.value)} placeholder="https://your-project.supabase.co" />
              </div>
              <div className="space-y-2">
                <Label>Anon Key (public)</Label>
                <Input value={sbKey} onChange={e => setSbKey(e.target.value)} placeholder="eyJhbGciOi..." type="password" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSupabase} disabled={sbSaved}>
                  {sbSaved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved!</> : 'Save Connection'}
                </Button>
                {getSupabaseConfig() && <Button variant="outline" onClick={handleClearSupabase}>Disconnect</Button>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-1">Storage Configuration</h2>
            <p className="text-sm text-muted-foreground mb-4">Current provider: <span className="text-primary font-medium">Supabase Storage</span></p>
            <p className="text-sm text-muted-foreground">The storage layer is modular. Future versions will support:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>AWS S3</li>
              <li>Cloudflare R2</li>
              <li>Backblaze B2</li>
              <li>Local VPS storage (via API endpoint)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">The database stores <code className="text-primary">storage_type</code> and <code className="text-primary">video_path</code> per video for seamless migration.</p>
          </div>
        </TabsContent>

        {user && (
          <TabsContent value="profile" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about yourself..." rows={4} maxLength={500} />
                </div>
                <Button onClick={handleSaveProfile} disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminSettings;
