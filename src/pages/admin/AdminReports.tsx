import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Flag, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const PAGE_SIZE = 20;

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    let query = db.from('reports').select('*', { count: 'exact' });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    setReports(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [page, filter]);

  const resolveReport = async (id: string) => {
    const { error } = await db.from('reports').update({ status: 'resolved', resolved_by: user?.id }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report resolved' });
      fetchReports();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <Select value={filter} onValueChange={v => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="triaged">Triaged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No reports found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Reason</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="px-4 py-3 text-right text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground capitalize">{r.target_type}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      r.status === 'open' ? 'bg-accent/20 text-accent' :
                      r.status === 'resolved' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== 'resolved' && (
                      <Button variant="ghost" size="sm" onClick={() => resolveReport(r.id)} className="text-primary">
                        <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{total} reports total</p>
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

export default AdminReports;
