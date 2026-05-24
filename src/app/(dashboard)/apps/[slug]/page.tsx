import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { auth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { BPHealthTab } from "@/components/health/BPHealthTab"
import { GlobeIcon, GitBranchIcon, UserIcon, PackageIcon, TagIcon, CalendarIcon, SmartphoneIcon, ExternalLinkIcon, PencilIcon } from "lucide-react"


const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

const releaseTypeColors: Record<string, string> = {
  MAJOR: "bg-red-100 text-red-800 border-red-200",
  MINOR: "bg-blue-100 text-blue-800 border-blue-200",
  PATCH: "bg-gray-100 text-gray-700 border-gray-200",
  HOTFIX: "bg-orange-100 text-orange-800 border-orange-200",
}

const marketStatusColors: Record<string, string> = {
  LIVE: "bg-green-100 text-green-800 border-green-200",
  SOFT_LAUNCH: "bg-cyan-100 text-cyan-800 border-cyan-200",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PLANNED: "bg-blue-100 text-blue-800 border-blue-200",
  RETIRED: "bg-gray-100 text-gray-700 border-gray-200",
}

async function getApp(slug: string) {
  const res = await fetch(`${BASE}/api/v1/apps/${slug}`, { cache: "no-store" })
  if (res.status === 404) return null
  if (!res.ok) throw new Error("Failed to fetch app")
  return res.json()
}

export default async function AppDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params
  const { tab } = await searchParams
  const [app, session] = await Promise.all([getApp(slug), auth()])

  if (!app) notFound()

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN"

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex items-start gap-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted overflow-hidden text-2xl font-bold text-muted-foreground">
          {app.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.iconUrl} alt={app.name} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            app.name[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
            {isAdmin && (
              <Link href={`/apps/${slug}/edit`}>
                <Button variant="outline" size="sm">
                  <PencilIcon className="size-3.5" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
          {app.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{app.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tab ?? "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {app.description && (
              <div className="col-span-full flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</dt>
                <dd className="text-sm">{app.description}</dd>
              </div>
            )}

            {/* Platform */}
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <SmartphoneIcon className="size-3.5" /> Platform
              </dt>
              <dd className="text-sm">
                <PlatformBadge platform={app.platform} />
              </dd>
            </div>

            {/* Package name */}
            {app.packageName && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <PackageIcon className="size-3.5" /> Package Name
                </dt>
                <dd className="text-sm font-mono text-muted-foreground">{app.packageName}</dd>
              </div>
            )}

            {/* Last version */}
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <TagIcon className="size-3.5" /> Last Version
              </dt>
              <dd className="text-sm">
                {app.releases?.[0]?.version
                  ? <span className="font-mono">v{app.releases[0].version}</span>
                  : <span className="text-muted-foreground">—</span>}
              </dd>
            </div>

            {/* Store launch date */}
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <CalendarIcon className="size-3.5" /> Launch Date
              </dt>
              <dd className="text-sm">
                {app.storeReleasedAt
                  ? format(new Date(app.storeReleasedAt), "MMM d, yyyy")
                  : <span className="text-muted-foreground">—</span>}
              </dd>
            </div>

            {/* Markets */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <GlobeIcon className="size-3.5" /> Markets
              </dt>
              <dd className="text-sm">
                {(app.markets?.length ?? 0) === 0 ? (
                  <span className="text-muted-foreground">Not live in any market</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {app.markets.map((am: { market: { id: string; code: string; name: string; flagEmoji: string | null } }) => (
                      <Link
                        key={am.market.id}
                        href={`/markets/${am.market.code}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                      >
                        <span>{am.market.flagEmoji ?? "🌐"}</span>
                        <span>{am.market.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </dd>
            </div>

            {/* Repository */}
            {app.repositoryUrl && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <GitBranchIcon className="size-3.5" /> Repository
                </dt>
                <dd className="text-sm">
                  <a
                    href={app.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {app.repositoryUrl}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                </dd>
              </div>
            )}

            {/* Owner */}
            {app.owner && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <UserIcon className="size-3.5" /> Owner
                </dt>
                <dd className="text-sm">{app.owner.name ?? app.owner.email}</dd>
              </div>
            )}
          </dl>
        </TabsContent>

        {/* Releases */}
        <TabsContent value="releases" className="pt-4">
          {app.releases?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No releases yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {app.releases?.map((release: {
                  id: string
                  version: string
                  platform: string
                  releaseType: string
                  releaseDate: string
                  releaseNotes: string | null
                }) => (
                  <TableRow key={release.id}>
                    <TableCell className="font-mono font-medium">v{release.version}</TableCell>
                    <TableCell><PlatformBadge platform={release.platform} /></TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={releaseTypeColors[release.releaseType] ?? ""}
                      >
                        {release.releaseType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(release.releaseDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground truncate">
                      {release.releaseNotes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Markets */}
        <TabsContent value="markets" className="pt-4">
          {app.markets?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No markets assigned.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Launch Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {app.markets?.map((am: {
                  market: { id: string; code: string; name: string; region: string; flagEmoji: string | null }
                  status: string
                  launchDate: string | null
                }) => (
                  <TableRow key={am.market.id}>
                    <TableCell>{am.market.flagEmoji ?? "🌐"}</TableCell>
                    <TableCell>
                      <Link
                        href={`/markets/${am.market.code}`}
                        className="font-medium hover:underline"
                      >
                        {am.market.name}
                      </Link>
                      <span className="ml-1.5 text-xs text-muted-foreground">{am.market.code}</span>
                    </TableCell>
                    <TableCell className="text-sm">{am.market.region}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={marketStatusColors[am.status] ?? ""}
                      >
                        {am.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {am.launchDate ? format(new Date(am.launchDate), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* Health Monitoring (BP %) */}
        <TabsContent value="health" className="pt-4">
          <BPHealthTab slug={app.slug} isAdmin={isAdmin} />
        </TabsContent>

      </Tabs>
    </div>
  )
}
