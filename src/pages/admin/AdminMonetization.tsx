import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DollarSign, CheckCircle } from 'lucide-react';

const AD_SLOTS = [
  { key: 'home-top', label: 'Homepage Top' },
  { key: 'home-mid', label: 'Homepage Middle' },
  { key: 'home-bottom', label: 'Homepage Bottom' },
  { key: 'watch-mid', label: 'Watch Page' },
  { key: 'watch-sidebar', label: 'Watch Sidebar' },
  { key: 'channel-top', label: 'Channel Page' },
  { key: 'feed-top', label: 'Feed Page' },
];

const AdminMonetization = () => {
  const [pubId, setPubId] = useState('');
  const [saved, setSaved] = useState(false);
  const [globalAds, setGlobalAds] = useState(true);
  const [slotToggles, setSlotToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedPub = localStorage.getItem('joulecorp_adsense_pub_id') || '';
    setPubId(storedPub);
    const storedGlobal = localStorage.getItem('joulecorp_ads_enabled');
    setGlobalAds(storedGlobal !== 'false');
    const storedSlots = localStorage.getItem('joulecorp_ad_slots');
    if (storedSlots) {
      try { setSlotToggles(JSON.parse(storedSlots)); } catch { /* ignore */ }
    } else {
      const defaults: Record<string, boolean> = {};
      AD_SLOTS.forEach(s => { defaults[s.key] = true; });
      setSlotToggles(defaults);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('joulecorp_adsense_pub_id', pubId.trim());
    localStorage.setItem('joulecorp_ads_enabled', String(globalAds));
    localStorage.setItem('joulecorp_ad_slots', JSON.stringify(slotToggles));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Monetization & Ads</h1>

      <div className="space-y-6 max-w-2xl">
        {/* AdSense Config */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Google AdSense
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Configure your AdSense Publisher ID and control ad placements.</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Publisher ID</Label>
              <Input value={pubId} onChange={e => setPubId(e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable ads globally</Label>
              <Switch checked={globalAds} onCheckedChange={setGlobalAds} />
            </div>
          </div>
        </div>

        {/* Ad Slot Toggles */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Ad Slot Configuration</h2>
          <div className="space-y-3">
            {AD_SLOTS.map(slot => (
              <div key={slot.key} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{slot.label}</span>
                <Switch
                  checked={slotToggles[slot.key] !== false}
                  onCheckedChange={v => setSlotToggles(prev => ({ ...prev, [slot.key]: v }))}
                  disabled={!globalAds}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Future Stripe placeholder */}
        <div className="bg-card rounded-xl border border-border p-6 opacity-60">
          <h2 className="font-semibold text-foreground mb-1">Stripe Payments</h2>
          <p className="text-sm text-muted-foreground">Creator monetization and subscription payments via Stripe. Coming soon.</p>
        </div>

        <Button onClick={handleSave} disabled={saved}>
          {saved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved!</> : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default AdminMonetization;
