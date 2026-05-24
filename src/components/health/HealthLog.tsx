import { format } from "date-fns"
import { HealthStatusBadge } from "@/components/health/HealthStatusBadge"

interface HealthEntry {
  id: string
  status: string
  createdAt: string
  notes: string | null
  market: { name: string; code: string } | null
  reportedBy?: { name: string | null; email: string | null } | null
}

interface HealthLogProps {
  entries: HealthEntry[]
}

export function HealthLog({ entries }: HealthLogProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No health entries recorded.</p>
    )
  }

  return (
    <ol className="relative border-l border-border pl-6 flex flex-col gap-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          {/* Timeline dot colored by status */}
          <span
            className={`absolute -left-[0.9375rem] top-1.5 size-2.5 rounded-full ring-2 ring-background ${dotColor(entry.status)}`}
          />

          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <HealthStatusBadge status={entry.status} />
            {entry.market && (
              <span className="text-xs text-muted-foreground">
                {entry.market.name} ({entry.market.code})
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
              {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}
            </span>
          </div>

          {entry.notes && (
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.notes}</p>
          )}

          {entry.reportedBy && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Reported by {entry.reportedBy.name ?? entry.reportedBy.email ?? "Unknown"}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}

function dotColor(status: string): string {
  switch (status) {
    case "HEALTHY":
      return "bg-green-500"
    case "DEGRADED":
      return "bg-amber-500"
    case "OUTAGE":
      return "bg-red-500"
    case "MAINTENANCE":
      return "bg-blue-500"
    default:
      return "bg-gray-400"
  }
}
