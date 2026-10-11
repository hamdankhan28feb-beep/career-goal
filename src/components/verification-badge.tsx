import { CheckCircle2, AlertCircle, HelpCircle, CircleDashed } from 'lucide-react';

export type VerificationStatus = 'verified' | 'approximate' | 'unverified' | 'unavailable';

const META: Record<VerificationStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  verified: {
    label: 'Verified',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle2,
  },
  approximate: {
    label: 'Approximate',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Icon: AlertCircle,
  },
  unverified: {
    label: 'Unverified',
    className: 'border-amber-500/40 bg-transparent text-amber-700 dark:text-amber-400',
    Icon: HelpCircle,
  },
  unavailable: {
    label: 'Not available yet',
    className: 'border-dashed border-border text-muted-foreground bg-muted/30',
    Icon: CircleDashed,
  },
};

export function VerificationBadge({
  status,
  source,
  checkedAt,
}: {
  status: VerificationStatus;
  source?: string;
  checkedAt?: string;
}) {
  const { label, className, Icon } = META[status];
  const title = [source, checkedAt ? `Checked ${checkedAt}` : null].filter(Boolean).join(' · ');
  return (
    <span
      title={title || undefined}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
