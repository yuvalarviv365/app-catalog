import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type HealthStatus = "HEALTHY" | "DEGRADED" | "OUTAGE" | "MAINTENANCE" | "UNKNOWN"

const statusConfig: Record<HealthStatus, { label: string; className: string }> = {
  HEALTHY: {
    label: "Healthy",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  DEGRADED: {
    label: "Degraded",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  OUTAGE: {
    label: "Outage",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  UNKNOWN: {
    label: "Unknown",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
}

interface HealthStatusBadgeProps {
  status: string
  className?: string
}

export function HealthStatusBadge({ status, className }: HealthStatusBadgeProps) {
  const config = statusConfig[(status as HealthStatus)] ?? statusConfig.UNKNOWN
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
