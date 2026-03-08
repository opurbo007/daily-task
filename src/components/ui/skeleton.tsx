import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="glass rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 flex-1 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="flex gap-2 ml-7">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            {[...Array(3)].map((_, j) => (
              <TaskCardSkeleton key={j} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };
