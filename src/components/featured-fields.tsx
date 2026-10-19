import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FieldDefinition } from '@/lib/types';

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
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              Demand not available
            </span>
          </div>
          <div>
            <h3 className="font-semibold tracking-tight text-foreground">{field.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{field.category}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              Difficulty not available
            </span>
            <div className="text-xs text-muted-foreground">Salary not available</div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
            Explore field <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      ))}
    </div>
  );
}
