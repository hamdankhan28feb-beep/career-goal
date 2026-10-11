export function FreshnessLabel({ checkedAt, staleDays = 365 }: { checkedAt?: string | null; staleDays?: number }) {
  if (!checkedAt) {
    return <span className="text-xs text-muted-foreground">Verification date unknown</span>;
  }
  const checked = new Date(checkedAt);
  const ageDays = Number.isNaN(checked.getTime())
    ? Infinity
    : (Date.now() - checked.getTime()) / (1000 * 60 * 60 * 24);
  const stale = ageDays > staleDays;
  return (
    <span className={`text-xs ${stale ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
      Checked {checkedAt}
      {stale ? ' · may be outdated — confirm on the official site' : ''}
    </span>
  );
}
