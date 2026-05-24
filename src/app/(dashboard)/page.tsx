import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { WorldMap, type MarketPin } from "@/components/dashboard/WorldMap"
import { RecentReleases } from "@/components/dashboard/RecentReleases"
import { prisma } from "@/lib/prisma"
import { AppStatus, IncidentStatus } from "@/generated/prisma/enums"

async function getSummary() {
  const [total, active, openIncidents, marketCount] = await Promise.all([
    prisma.app.count(),
    prisma.app.count({ where: { status: AppStatus.ACTIVE } }),
    prisma.incident.count({ where: { status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] } } }),
    prisma.market.count(),
  ])
  return { total, active, openIncidents, marketCount }
}

async function getCurrentHealth(): Promise<HealthEntry[]> {
  const apps = await prisma.app.findMany({
    include: {
      markets: { include: { market: true } },
      health: { orderBy: { createdAt: "desc" } },
    },
  })
  return apps.flatMap((app): HealthEntry[] => {
    if (app.markets.length === 0) {
      const latest = app.health.find((h) => h.marketId === null) ?? app.health[0]
      return [{ appId: app.id, appName: app.name, appSlug: app.slug, appIconUrl: app.iconUrl ?? null, marketCode: null, marketName: null, status: latest?.status ?? "UNKNOWN" }]
    }
    return app.markets.map(({ market }): HealthEntry => {
      const latest = app.health.find((h) => h.marketId === market.id) ?? app.health.find((h) => h.marketId === null) ?? app.health[0]
      return { appId: app.id, appName: app.name, appSlug: app.slug, appIconUrl: app.iconUrl ?? null, marketCode: market.code, marketName: market.name, status: latest?.status ?? "HEALTHY" }
    })
  })
}

async function getRecentReleases() {
  const data = await prisma.release.findMany({
    take: 5,
    include: { app: { select: { id: true, name: true, slug: true } } },
    orderBy: { releaseDate: "desc" },
  })
  return { data }
}

// Worst-status priority order
const STATUS_PRIORITY = ["OUTAGE", "DEGRADED", "MAINTENANCE", "UNKNOWN", "HEALTHY"]

function worstStatus(statuses: string[]): string {
  for (const s of STATUS_PRIORITY) {
    if (statuses.includes(s)) return s
  }
  return "UNKNOWN"
}

interface HealthEntry {
  appId: string
  appName: string
  appSlug: string
  appIconUrl: string | null
  marketCode: string | null
  marketName: string | null
  status: string
}

export default async function DashboardPage() {
  const [summary, healthData, releasesRes] = await Promise.all([
    getSummary(),
    getCurrentHealth(),
    getRecentReleases(),
  ])

  // Build market pins from health data
  const marketMap = new Map<string, MarketPin>()
  for (const entry of healthData as HealthEntry[]) {
    if (!entry.marketCode) continue
    if (!marketMap.has(entry.marketCode)) {
      marketMap.set(entry.marketCode, {
        marketCode: entry.marketCode,
        marketName: entry.marketName ?? entry.marketCode,
        apps: [],
        worstStatus: "HEALTHY",
      })
    }
    marketMap.get(entry.marketCode)!.apps.push({
      appId: entry.appId,
      appName: entry.appName,
      appSlug: entry.appSlug,
      appIconUrl: entry.appIconUrl,
      status: entry.status,
    })
  }

  // Compute worst status per market
  const pins: MarketPin[] = Array.from(marketMap.values()).map((pin) => ({
    ...pin,
    worstStatus: worstStatus(pin.apps.map((a) => a.status)),
  }))

  const releases = releasesRes.data ?? []

  return (
    <div className="flex flex-col gap-8">
      <SummaryCards
        total={summary.total}
        active={summary.active}
        marketCount={summary.marketCount}
      />

      <section>
        <h2 className="text-lg font-semibold mb-3">Global Market Coverage</h2>
        <WorldMap pins={pins} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Releases</h2>
        <RecentReleases releases={releases} />
      </section>
    </div>
  )
}
