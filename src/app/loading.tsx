export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      </div>
    </div>
  );
}
