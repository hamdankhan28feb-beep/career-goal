import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FieldDefinition } from '@/lib/types';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Hard: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Very Hard': 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const DEMAND_COLOR: Record<string, string> = {
  Low: 'bg-slate-500/10 text-slate-500',
  Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  High: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  'Very High': 'bg-primary/10 text-primary',
};

export function FeaturedFields({ fields }: { fields: FieldDefinition[] }) {
  const featured = fields.slice(0, 8);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {featured.map((field) => (
        <Link
          key={field.slug}
          href={`/fields/${field.slug}`}
          className="group flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl">{field.icon}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DEMAND_COLOR[field.industryDemand]}`}>
              {field.industryDemand} demand
            </span>
          </div>
          <div>
            <h3 className="font-semibold tracking-tight text-foreground">{field.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{field.category}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${DIFFICULTY_COLOR[field.difficultyLevel]}`}>
              {field.difficultyLevel}
            </span>
            <div className="text-xs font-semibold text-foreground">
              {Math.round(field.salaryRange.min / 1000)}K–{Math.round(field.salaryRange.max / 1000)}K/mo
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
            Explore field <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      ))}
    </div>
  );
}
