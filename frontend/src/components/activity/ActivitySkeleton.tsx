export default function ActivitySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton h-9 w-full rounded-md mt-1" />
      </div>
    </div>
  );
}
