import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Film, Search, ChevronLeft, ChevronRight, Star, StarOff, EyeOff, Eye, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 20;

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const AdminVideos = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchVideos = async () => {
    setLoading(true);
    let query = supabase.from('videos').select('*', { count: 'exact' });

    if (search.trim()) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    setVideos(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, [page, search]);

  const toggleFeature = async (id: string, current: boolean) => {
    await supabase.from('videos').update({ is_featured: !current }).eq('id', id);
    fetchVideos();
  };

  const toggleDisable = async (id: string, current: boolean) => {
    await supabase.from('videos').update({ is_disabled: !current }).eq('id', id);
    fetchVideos();
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Video deleted' });
      fetchVideos();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Videos</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search videos..." className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No videos found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Views</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="px-4 py-3 text-right text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(v => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground max-w-[250px] truncate">{v.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(v.views || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {v.is_featured && <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-medium">Featured</span>}
                        {v.is_disabled && <span className="px-1.5 py-0.5 rounded text-[10px] bg-destructive/20 text-destructive font-medium">Disabled</span>}
                        {!v.is_featured && !v.is_disabled && <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium capitalize">{v.visibility || 'public'}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleFeature(v.id, v.is_featured)} title={v.is_featured ? 'Unfeature' : 'Feature'}>
                          {v.is_featured ? <StarOff className="w-4 h-4 text-accent" /> : <Star className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleDisable(v.id, v.is_disabled)} title={v.is_disabled ? 'Enable' : 'Disable'}>
                          {v.is_disabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete video?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{v.title}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteVideo(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{total} videos total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideos;
