"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { ReleaseTimeline } from "@/components/releases/ReleaseTimeline"
import { HealthLog } from "@/components/health/HealthLog"
import { GitBranchIcon, UserIcon, CalendarIcon, GlobeIcon, ExternalLinkIcon } from "lucide-react"

const categoryColors: Record<string, string> = {
  LIVESCORES: "bg-cyan-100 text-cyan-800 border-cyan-200",
  CASINO: "bg-pink-100 text-pink-800 border-pink-200",
  SPORTS: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
}

const marketStatusColors: Record<string, string> = {
  LIVE: "bg-green-100 text-green-800 border-green-200",
  SOFT_LAUNCH: "bg-cyan-100 text-cyan-800 border-cyan-200",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PLANNED: "bg-blue-100 text-blue-800 border-blue-200",
  RETIRED: "bg-gray-100 text-gray-700 border-gray-200",
}

interface AppDetailProps {
  app: {
    id: string
    name: string
    slug: string
    platform: string
    category: string
    status: string
    description: string | null
    repositoryUrl: string | null
    createdAt: string
    owner: { name: string | null; email: string | null } | null
    markets: Array<{
      status: string
      launchDate: string | null
      market: { id: string; code: string; name: string; region: string; flagEmoji: string | null }
    }>
    releases: Array<{
      id: string
      version: string
      platform: string
      releaseType: string
      releaseDate: string
      releaseNotes: string | null
    }>
    health: Array<{
      id: string
      status: string
      createdAt: string
      notes: string | null
      market: { name: string; code: string } | null
      reportedBy?: { name: string | null; email: string | null } | null
    }>
  }
}

export function AppDetail({ app }: AppDetailProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="releases">
          Releases
          {app.releases.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({app.releases.length})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="markets">
          Markets
          {app.markets.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({app.markets.length})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="health">Health Log</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="pt-4">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {app.description && (
            <div className="col-span-full flex flex-col gap-1">
              <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</dt>
              <dd className="text-sm leading-relaxed">{app.description}</dd>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platform</dt>
            <dd><PlatformBadge platform={app.platform} /></dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</dt>
            <dd>
              <Badge variant="outline" className={categoryColors[app.category] ?? ""}>
                {app.category}
              </Badge>
            </dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</dt>
            <dd className="text-sm">{app.status.replace(/_/g, " ")}</dd>
          </div>

          {app.repositoryUrl && (
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <GitBranchIcon className="size-3.5" /> Repository
              </dt>
              <dd>
                <a
                  href={app.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline break-all"
                >
                  {app.repositoryUrl}
                  <ExternalLinkIcon className="size-3 shrink-0" />
                </a>
              </dd>
            </div>
          )}

          {app.owner && (
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <UserIcon className="size-3.5" /> Owner
              </dt>
              <dd className="text-sm">{app.owner.name ?? app.owner.email}</dd>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CalendarIcon className="size-3.5" /> Created
            </dt>
            <dd className="text-sm">{format(new Date(app.createdAt), "MMM d, yyyy")}</dd>
          </div>

          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <GlobeIcon className="size-3.5" /> Markets
            </dt>
            <dd className="text-sm">
              {app.markets.length} market{app.markets.length !== 1 ? "s" : ""}
            </dd>
          </div>
        </dl>
      </TabsContent>

      {/* Releases */}
      <TabsContent value="releases" className="pt-4">
        <ReleaseTimeline releases={app.releases} />
      </TabsContent>

      {/* Markets */}
      <TabsContent value="markets" className="pt-4">
        {app.markets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No markets assigned.</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {app.markets.map((am) => (
              <div key={am.market.id} className="flex items-center gap-4 px-4 py-3">
                <span className="text-xl shrink-0">{am.market.flagEmoji ?? "🌐"}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/markets/${am.market.code}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {am.market.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{am.market.code}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{am.market.region}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={marketStatusColors[am.status] ?? ""}>
                    {am.status.replace(/_/g, " ")}
                  </Badge>
                  {am.launchDate && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(am.launchDate), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Health Log */}
      <TabsContent value="health" className="pt-4">
        <HealthLog entries={app.health} />
      </TabsContent>
    </Tabs>
  )
}
