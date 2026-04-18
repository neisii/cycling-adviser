export function SkeletonCard() {
  return (
    <div className="animate-pulse" data-testid="loading-skeleton">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="flex justify-center mb-6">
        <div className="w-36 h-36 rounded-full bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-3/5" />
      </div>
    </div>
  );
}
