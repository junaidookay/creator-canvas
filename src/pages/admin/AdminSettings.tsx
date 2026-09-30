import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { saveSupabaseConfig, getSupabaseConfig, clearSupabaseConfig } from '@/lib/supabase';
import { getBunnyConfig, saveBunnyConfig, clearBunnyConfig } from '@/lib/bunny';
import type { StorageProvider } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Database, HardDrive, User, Rabbit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { user } = useAuth();

  // Supabase config
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [sbSaved, setSbSaved] = useState(false);

  // Storage provider
  const [provider, setProvider] = useState<StorageProvider>('supabase');
  const [providerSaved, setProviderSaved] = useState(false);

  // Bunny config
  const [bunnyLibraryId, setBunnyLibraryId] = useState('');
  const [bunnyApiKey, setBunnyApiKey] = useState('');
  const [bunnyCdnHost, setBunnyCdnHost] = useState('');
  const [bunnySaved, setBunnySaved] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    if (config) { setSbUrl(config.url); setSbKey(config.anonKey); }

    const storedProvider = localStorage.getItem('joulecorp_storage_provider') as StorageProvider | null;
    setProvider(storedProvider || 'supabase');

    const bunny = getBunnyConfig();
    if (bunny) {
      setBunnyLibraryId(bunny.libraryId);
      setBunnyApiKey(bunny.apiKey);
      setBunnyCdnHost(bunny.cdnHost);
    }

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

  const handleSaveProvider = () => {
    localStorage.setItem('joulecorp_storage_provider', provider);
    setProviderSaved(true);
    setTimeout(() => setProviderSaved(false), 2000);
    toast({ title: 'Storage provider updated', description: `Now using ${provider === 'bunny' ? 'Bunny Stream' : 'Supabase Storage'}.` });
  };

  const handleSaveBunny = () => {
    if (!bunnyLibraryId.trim() || !bunnyApiKey.trim() || !bunnyCdnHost.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in Library ID, API Key, and CDN Host.', variant: 'destructive' });
      return;
    }
    saveBunnyConfig({
      libraryId: bunnyLibraryId.trim(),
      apiKey: bunnyApiKey.trim(),
      cdnHost: bunnyCdnHost.trim(),
    });
    setBunnySaved(true);
    setTimeout(() => setBunnySaved(false), 2000);
    toast({ title: 'Bunny Stream saved' });
  };

  const handleClearBunny = () => {
    clearBunnyConfig();
    setBunnyLibraryId('');
    setBunnyApiKey('');
    setBunnyCdnHost('');
    toast({ title: 'Bunny Stream configuration cleared' });
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
            <h2 className="font-semibold text-foreground mb-1">Storage Provider</h2>
            <p className="text-sm text-muted-foreground mb-4">Choose where video files are uploaded.</p>
            <RadioGroup value={provider} onValueChange={v => setProvider(v as StorageProvider)} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="supabase" id="provider-supabase" />
                <Label htmlFor="provider-supabase" className="font-normal cursor-pointer">
                  Supabase Storage <span className="text-muted-foreground text-xs">(built-in)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bunny" id="provider-bunny" />
                <Label htmlFor="provider-bunny" className="font-normal cursor-pointer">
                  Bunny Stream <span className="text-muted-foreground text-xs">(video CDN)</span>
                </Label>
              </div>
            </RadioGroup>
            <Button onClick={handleSaveProvider} className="mt-4" size="sm">
              {providerSaved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved</> : 'Save Provider'}
            </Button>
          </div>

          {provider === 'bunny' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Rabbit className="w-4 h-4" /> Bunny Stream Configuration
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Bunny Stream library. Find these values in the Bunny dashboard under Stream → your library.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Library ID</Label>
                  <Input value={bunnyLibraryId} onChange={e => setBunnyLibraryId(e.target.value)} placeholder="e.g. 12345" />
                </div>
                <div className="space-y-2">
                  <Label>Stream API Key</Label>
                  <Input value={bunnyApiKey} onChange={e => setBunnyApiKey(e.target.value)} type="password" placeholder="Found in Library → API section" />
                </div>
                <div className="space-y-2">
                  <Label>CDN Host</Label>
                  <Input value={bunnyCdnHost} onChange={e => setBunnyCdnHost(e.target.value)} placeholder="e.g. vz-xxxxx.b-cdn.net" />
                  <p className="text-xs text-muted-foreground">The pull zone hostname from your library's CDN settings.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveBunny} disabled={bunnySaved} size="sm">
                    {bunnySaved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved</> : 'Save Configuration'}
                  </Button>
                  <Button variant="outline" onClick={handleClearBunny} size="sm">Clear</Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-1">Storage Notes</h2>
            <p className="text-sm text-muted-foreground">
              Thumbnails and images always use Supabase Storage. Videos use the selected provider.
              The database stores <code className="text-primary">storage_type</code> and <code className="text-primary">video_path</code> per video for seamless migration.
            </p>
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
