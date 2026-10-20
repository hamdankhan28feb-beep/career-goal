export default function Loading() {
  return (
    <div className="flex min-h-[calc(100svh-160px)] items-center justify-center" aria-busy="true">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <span className="sr-only">Please wait</span>
      </div>
    </div>
  );
}
