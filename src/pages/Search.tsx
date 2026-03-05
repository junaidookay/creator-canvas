import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoCard from '@/components/video/VideoCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { VIDEO_CATEGORIES } from '@/types/database';
import { motion } from 'framer-motion';

const formatCount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialSort = searchParams.get('sort') || 'relevance';

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const PAGE_SIZE = 12;

  const search = async (resetPage = false) => {
    const currentPage = resetPage ? 0 : page;
    if (resetPage) setPage(0);
    setLoading(true);

    let q = supabase
      .from('videos')
      .select('*, profiles:creator_id(username, display_name, avatar_url)', { count: 'exact' })
      .eq('is_disabled', false)
      .eq('visibility', 'public');

    if (query.trim()) {
      q = q.or(`title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
    }

    if (category && category !== 'all') {
      q = q.eq('category', category);
    }

    if (sort === 'views') {
      q = q.order('views', { ascending: false });
    } else if (sort === 'newest') {
      q = q.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      q = q.order('created_at', { ascending: true });
    } else {
      // relevance: if query exists, order by views as proxy
      q = q.order('views', { ascending: false });
    }

    const { data, count } = await q.range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    setVideos(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);

    // Update URL params
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (category && category !== 'all') params.category = category;
    if (sort !== 'relevance') params.sort = sort;
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    search(true);
  }, [category, sort]);

  useEffect(() => {
    if (initialQuery) search(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(true);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Search Header */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search videos, creators..."
                className="pl-11 h-12 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" className="px-6">
              <SearchIcon className="w-4 h-4 mr-2" /> Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-3 mb-6 p-4 bg-card rounded-xl border border-border"
          >
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={category || 'all'} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {VIDEO_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(category || sort !== 'relevance') && (
              <Button
                variant="ghost"
                size="sm"
                className="self-end text-muted-foreground"
                onClick={() => { setCategory(''); setSort('relevance'); }}
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Results info */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {total} result{total !== 1 ? 's' : ''}{query.trim() ? ` for "${query.trim()}"` : ''}
          </p>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No videos found</h2>
            <p className="text-muted-foreground text-sm">Try different keywords or adjust your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map(v => {
              const p = (v as any).profiles;
              return (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  thumbnail={v.thumbnail_url}
                  creator={p?.display_name || p?.username || 'Unknown'}
                  views={formatCount(v.views || 0)}
                  date={new Date(v.created_at).toLocaleDateString()}
                  category={v.category}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage(p => p - 1); search(); }}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); search(); }}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
