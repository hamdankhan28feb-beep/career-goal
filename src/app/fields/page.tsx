'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Filter } from 'lucide-react';

import { getFields, getFieldCategories } from '@/lib/fields-data';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Hard: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  'Very Hard': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const DEMAND_COLOR: Record<string, string> = {
  Low: 'bg-slate-500/10 text-slate-500',
  Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  High: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Very High': 'bg-primary/10 text-primary',
};

export default function FieldsPage() {
  const allFields = getFields();
  const categories = ['All', ...getFieldCategories()];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allFields.filter((f) => {
      const matchQ = !q || f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      const matchCat = category === 'All' || f.category === category;
      return matchQ && matchCat;
    });
  }, [allFields, query, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm text-primary">
          🗺️ Field Explorer — Find your path
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">Explore Academic Fields</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Browse {allFields.length} fields with complete roadmaps, career paths, salary ranges, and higher education options.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing <strong className="text-foreground">{filtered.length}</strong> fields
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((field) => (
            <Link
              key={field.slug}
              href={`/fields/${field.slug}`}
              className="group flex flex-col rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-4xl">{field.icon}</span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${DIFFICULTY_COLOR[field.difficultyLevel]}`}>
                  {field.difficultyLevel}
                </span>
              </div>
              <div className="mt-3 flex-1">
                <h2 className="font-semibold text-foreground">{field.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{field.category}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-3">{field.overview}</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DEMAND_COLOR[field.industryDemand]}`}>
                    {field.industryDemand} demand
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {Math.round(field.salaryRange.min / 1000)}K–{Math.round(field.salaryRange.max / 1000)}K/mo
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{field.degreeDuration}</div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Explore roadmap <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-20 text-center">
          <div className="text-5xl">🔍</div>
          <h3 className="mt-4 text-xl font-semibold">No fields found</h3>
          <button onClick={() => { setQuery(''); setCategory('All'); }} className="btn-secondary mt-4">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
