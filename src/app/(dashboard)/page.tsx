import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { WorldMap, type MarketPin } from "@/components/dashboard/WorldMap"
import { RecentReleases } from "@/components/dashboard/RecentReleases"

const BASE = "http://localhost:3000"

async function getSummary() {
  const res = await fetch(`${BASE}/api/v1/health/summary`, { cache: "no-store" })
  if (!res.ok) return { total: 0, active: 0, openIncidents: 0, marketCount: 0 }
  return res.json()
}

async function getCurrentHealth() {
  const res = await fetch(`${BASE}/api/v1/health/current`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

async function getRecentReleases() {
  const res = await fetch(`${BASE}/api/v1/releases?limit=5`, { cache: "no-store" })
  if (!res.ok) return { data: [] }
  return res.json()
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
