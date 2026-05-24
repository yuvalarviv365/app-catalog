import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/apps/PlatformBadge"

const releaseTypeColors: Record<string, string> = {
  MAJOR: "bg-red-100 text-red-800 border-red-200",
  MINOR: "bg-blue-100 text-blue-800 border-blue-200",
  PATCH: "bg-gray-100 text-gray-700 border-gray-200",
  HOTFIX: "bg-orange-100 text-orange-800 border-orange-200",
}

interface Release {
  id: string
  version: string
  platform: string
  releaseType: string
  releaseDate: string
  releaseNotes: string | null
}

interface ReleaseTimelineProps {
  releases: Release[]
}

export function ReleaseTimeline({ releases }: ReleaseTimelineProps) {
  if (releases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No releases yet.</p>
    )
  }

  return (
    <ol className="relative border-l border-border pl-6 flex flex-col gap-6">
      {releases.map((release) => (
        <li key={release.id} className="relative">
          {/* Timeline dot */}
          <span className="absolute -left-[1.5625rem] top-1 flex size-3.5 items-center justify-center rounded-full border-2 border-background bg-primary ring-2 ring-border" />

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm">v{release.version}</span>
            <Badge
              variant="outline"
              className={releaseTypeColors[release.releaseType] ?? "bg-gray-100 text-gray-700"}
            >
              {release.releaseType}
            </Badge>
            <PlatformBadge platform={release.platform} />
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(release.releaseDate), "MMM d, yyyy")}
            </span>
          </div>

          {release.releaseNotes && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {release.releaseNotes}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
