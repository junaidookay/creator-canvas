import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, EyeOff, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 20;

const AdminCommunity = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    setPosts(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [page]);

  const toggleHide = async (id: string, current: boolean) => {
    await supabase.from('posts').update({ is_hidden: !current }).eq('id', id);
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post deleted' });
      fetchPosts();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Community Posts</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No community posts yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Content</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground max-w-[300px] truncate">{p.content}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.image_url ? 'Image' : 'Text'}</td>
                  <td className="px-4 py-3">
                    {p.is_hidden
                      ? <span className="px-2 py-0.5 rounded text-[10px] bg-destructive/20 text-destructive font-medium">Hidden</span>
                      : <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">Visible</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleHide(p.id, p.is_hidden)} title={p.is_hidden ? 'Unhide' : 'Hide'}>
                        {p.is_hidden ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete post?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this post.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePost(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{total} posts total</p>
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

export default AdminCommunity;
