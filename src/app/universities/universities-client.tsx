'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { UniversityCard } from '@/components/university-card';
import type { University } from '@/lib/types';

const CITIES = ['All Cities', 'Karachi', 'Islamabad', 'Lahore', 'Hyderabad'];
const TYPES = ['All Types', 'Public', 'Private'];

export function UniversitiesClient({ universities: initialUniversities }: { universities: University[] }) {
  const [universities, setUniversities] = useState(initialUniversities);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All Cities');
  const [type, setType] = useState('All Types');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return universities.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
      const matchCity = city === 'All Cities' || u.city === city;
      const matchType = type === 'All Types' || u.universityType === type;
      return matchQ && matchCity && matchType;
    });
  }, [universities, query, city, type]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // Use the last university ID as cursor
      const lastId = universities.length > 0 ? universities[universities.length - 1].id : 0;
      const res = await fetch(`/api/universities?cursor=${lastId}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setUniversities(prev => [...prev, ...data.universities]);
        setNextCursor(data.nextCursor);
        setHasAttemptedLoad(true);
      }
    } catch (err) {
      console.error('Failed to load more universities:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, universities]);

  const hasFilters = query || city !== 'All Cities' || type !== 'All Types';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary">
          <Search className="h-4 w-4" />
          Real data — verified from official university sources
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">University Explorer</h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse {universities.length} Pakistani universities with source-verified profiles. Filter by city, type, and more.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search universities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-10"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field w-auto"
          >
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="input-field w-auto"
          >
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setQuery(''); setCity('All Cities'); setType('All Types'); }}
              className="rounded-full border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing <strong className="text-foreground">{filtered.length}</strong> universities</span>
        {hasFilters && <span>· filtered from {universities.length}</span>}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((university) => (
            <UniversityCard key={university.slug} university={university} />
          ))}
        </div>
      ) : (
        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <div className="text-5xl">🔍</div>
          <h3 className="mt-4 text-xl font-semibold">No universities found</h3>
          <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
          <button onClick={() => { setQuery(''); setCity('All Cities'); setType('All Types'); }} className="btn-secondary mt-4">
            Clear filters
          </button>
        </div>
      )}

      {/* Load More */}
      {filtered.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore || (hasAttemptedLoad && nextCursor === null)}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : hasAttemptedLoad && nextCursor === null ? (
              'All universities loaded'
            ) : (
              'Load more universities'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
