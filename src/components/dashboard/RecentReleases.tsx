import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { format } from "date-fns"
import Link from "next/link"

interface Release {
  id: string
  version: string
  platform: string
  releaseDate: Date | string
  app: {
    name: string
    slug: string
  }
}

interface RecentReleasesProps {
  releases: Release[]
}

export function RecentReleases({ releases }: RecentReleasesProps) {
  if (releases.length === 0) {
    return (
      <div className="rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
        No recent releases.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {releases.map((release) => (
        <div
          key={release.id}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex flex-col min-w-0">
            <Link
              href={`/apps/${release.app.slug}`}
              className="font-medium text-sm hover:underline truncate"
            >
              {release.app.name}
            </Link>
            <span className="text-xs text-muted-foreground">v{release.version}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PlatformBadge platform={release.platform} />
            <span className="text-xs text-muted-foreground">
              {format(new Date(release.releaseDate), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
