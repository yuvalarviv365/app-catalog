import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SyncButton } from "@/components/apps/SyncButton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { PlusIcon } from "lucide-react"
import { auth } from "@/lib/auth"

const BASE = "http://localhost:3000"

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
  app: { id: string; name: string; slug: string }
}

async function getReleases(): Promise<{ data: Release[]; pagination: { total: number } }> {
  const res = await fetch(`${BASE}/api/v1/releases?limit=50`, { cache: "no-store" })
  if (!res.ok) return { data: [], pagination: { total: 0 } }
  return res.json()
}

export default async function ReleasesPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  const canCreate = user?.role === "ADMIN" || user?.role === "PM"

  const { data: releases, pagination } = await getReleases()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total} release{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton label="Sync Play Store" />
          {canCreate && (
            <Link href="/releases/new">
              <Button size="sm">
                <PlusIcon className="size-4" />
                New Release
              </Button>
            </Link>
          )}
        </div>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          No releases yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell>
                    <Link
                      href={`/apps/${release.app.slug}`}
                      className="font-medium hover:underline"
                    >
                      {release.app.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">v{release.version}</TableCell>
                  <TableCell><PlatformBadge platform={release.platform} /></TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={releaseTypeColors[release.releaseType] ?? ""}
                    >
                      {release.releaseType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(release.releaseDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                    {release.releaseNotes ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
