type Stat = { label: string; value: string | number; hint?: string };

export function LiveStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="mt-10 grid grid-cols-3 gap-4">
      {stats.map(({ label, value, hint }) => (
        <div key={label} className="stat-card" title={hint}>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1.5 text-2xl font-semibold text-foreground">{value}</div>
          {hint ? <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
