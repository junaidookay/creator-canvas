import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { HardDrive, Eye, EyeOff, CheckCircle2, XCircle, Save, Trash2, ShieldCheck } from 'lucide-react';

type Provider = 'supabase' | 'vimeo' | 'bunny';

interface MaskedConfig {
  default_provider: Provider;
  vimeo_access_token_mask: string | null;
  vimeo_configured: boolean;
  bunny_api_key_mask: string | null;
  bunny_library_id: string | null;
  bunny_cdn_hostname: string | null;
  bunny_configured: boolean;
  updated_at: string | null;
}

const AdminStorage = () => {
  const [cfg, setCfg] = useState<MaskedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState<Provider>('supabase');
  // Secret inputs are ALWAYS write-only. Never populated from the server.
  const [vimeoToken, setVimeoToken] = useState('');
  const [showVimeo, setShowVimeo] = useState(false);
  const [bunnyKey, setBunnyKey] = useState('');
  const [showBunny, setShowBunny] = useState(false);
  const [bunnyLib, setBunnyLib] = useState('');
  const [bunnyCdn, setBunnyCdn] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('storage-admin', { method: 'GET' });
    if (error || data?.error) {
      toast({ title: 'Failed to load config', description: (error?.message || data?.error) ?? '', variant: 'destructive' });
    } else {
      setCfg(data);
      setDefaultProvider(data.default_provider);
      setBunnyLib(data.bunny_library_id ?? '');
      setBunnyCdn(data.bunny_cdn_hostname ?? '');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const validate = (): string | null => {
    if (defaultProvider === 'vimeo' && !cfg?.vimeo_configured && !vimeoToken.trim())
      return 'Vimeo access token is required before setting Vimeo as default.';
    if (vimeoToken.trim() && vimeoToken.trim().length < 20)
      return 'Vimeo access token looks too short.';
    if (defaultProvider === 'bunny') {
      const keyOk = cfg?.bunny_configured || bunnyKey.trim();
      if (!keyOk || !bunnyLib.trim() || !bunnyCdn.trim())
        return 'Bunny requires API key, library ID and CDN hostname.';
    }
    if (bunnyCdn.trim() && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(bunnyCdn.trim()))
      return 'Bunny CDN hostname looks invalid (e.g. vz-xxxxxx.b-cdn.net).';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast({ title: 'Check your inputs', description: err, variant: 'destructive' }); return; }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('storage-admin', {
      method: 'POST',
      body: {
        default_provider: defaultProvider,
        vimeo_access_token: vimeoToken.trim() || undefined,
        bunny_api_key: bunnyKey.trim() || undefined,
        bunny_library_id: bunnyLib.trim(),
        bunny_cdn_hostname: bunnyCdn.trim(),
      },
    });
    setSaving(false);
    if (error || data?.error) {
      toast({ title: 'Save failed', description: (error?.message || data?.error) ?? '', variant: 'destructive' });
      return;
    }
    setVimeoToken('');
    setBunnyKey('');
    toast({ title: 'Storage configuration saved' });
    load();
  };

  if (loading || !cfg) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HardDrive className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Storage</h1>
          <p className="text-sm text-muted-foreground">
            Configure where uploaded videos are stored and streamed from. Secrets are stored
            server-side and are never displayed after saving.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 text-xs text-foreground">
        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <span>
          Access tokens and API keys are write-only. Leave a field blank to keep the existing value.
          Only the last 4 characters are shown for confirmation.
        </span>
      </div>

      {/* Default provider */}
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Default provider</h2>
          <p className="text-xs text-muted-foreground mt-1">
            New uploads will be sent to this provider.
          </p>
        </div>
        <div className="max-w-xs">
          <Select value={defaultProvider} onValueChange={v => setDefaultProvider(v as Provider)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="supabase">Supabase Storage (built-in)</SelectItem>
              <SelectItem value="vimeo" disabled={!cfg.vimeo_configured && !vimeoToken.trim()}>
                Vimeo {!cfg.vimeo_configured && !vimeoToken.trim() && '(not configured)'}
              </SelectItem>
              <SelectItem value="bunny" disabled={!cfg.bunny_configured}>
                Bunny Stream {!cfg.bunny_configured && '(not configured)'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Vimeo */}
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              Vimeo
              {cfg.vimeo_configured ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Personal Access Token from{' '}
              <a href="https://developer.vimeo.com/apps" target="_blank" rel="noreferrer" className="text-primary underline">
                developer.vimeo.com/apps
              </a>
              . Required scopes: <code className="text-[10px]">public private upload edit delete video_files</code>.
            </p>
          </div>
        </div>

        {cfg.vimeo_configured && (
          <p className="text-xs text-muted-foreground">
            Currently saved: <code>{cfg.vimeo_access_token_mask}</code>
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="vimeo_token">
            {cfg.vimeo_configured ? 'Replace access token' : 'Access token'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="vimeo_token"
              type={showVimeo ? 'text' : 'password'}
              value={vimeoToken}
              onChange={e => setVimeoToken(e.target.value)}
              placeholder={cfg.vimeo_configured ? 'Leave blank to keep existing' : 'Paste Vimeo Personal Access Token'}
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setShowVimeo(s => !s)} aria-label={showVimeo ? 'Hide token' : 'Show token'}>
              {showVimeo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Bunny */}
      <section className="bg-card rounded-xl border border-border p-6 space-y-4 opacity-90">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            Bunny Stream
            {cfg.bunny_configured ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Optional. Find these in the{' '}
            <a href="https://dash.bunny.net/stream" target="_blank" rel="noreferrer" className="text-primary underline">
              Bunny Stream dashboard
            </a>.
          </p>
        </div>

        {cfg.bunny_configured && (
          <p className="text-xs text-muted-foreground">
            API key saved: <code>{cfg.bunny_api_key_mask}</code>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bunny_key">
              {cfg.bunny_configured ? 'Replace API key' : 'API key'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="bunny_key"
                type={showBunny ? 'text' : 'password'}
                value={bunnyKey}
                onChange={e => setBunnyKey(e.target.value)}
                placeholder={cfg.bunny_configured ? 'Leave blank to keep existing' : 'Bunny Stream API key'}
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowBunny(s => !s)} aria-label={showBunny ? 'Hide key' : 'Show key'}>
                {showBunny ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bunny_lib">Library ID</Label>
            <Input id="bunny_lib" value={bunnyLib} onChange={e => setBunnyLib(e.target.value)} placeholder="e.g. 123456" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bunny_cdn">CDN Hostname</Label>
            <Input id="bunny_cdn" value={bunnyCdn} onChange={e => setBunnyCdn(e.target.value)} placeholder="vz-xxxxxxx.b-cdn.net" />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {cfg.updated_at ? `Last updated ${new Date(cfg.updated_at).toLocaleString()}` : 'Not yet saved.'}
        </p>
        <div className="flex gap-2">
          {(vimeoToken || bunnyKey) && (
            <Button type="button" variant="outline" onClick={() => { setVimeoToken(''); setBunnyKey(''); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Clear inputs
            </Button>
          )}
          <Button onClick={save} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminStorage;
