type Stat = { label: string; value: string | number; hint?: string };

export function LiveStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map(({ label, value, hint }) => (
        <div key={label} className="stat-card min-w-0 p-4 sm:p-5 last:col-span-2 sm:last:col-span-1" title={hint}>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-xl font-semibold sm:text-2xl text-foreground">{value}</div>
          {hint ? <div className="mt-1 text-2xs text-muted-foreground">{hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
