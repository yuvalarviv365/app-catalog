export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded-lg bg-muted" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/50 ring-1 ring-foreground/10 p-4 flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="size-5 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Status grid skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="h-10 bg-muted/50" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-border px-4 py-3">
              <div className="h-4 w-32 rounded bg-muted" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-16 rounded bg-muted mx-auto" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Recent releases skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
