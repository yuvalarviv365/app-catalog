import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppHealthCard } from "@/components/health/AppHealthCard"
import { RefreshButton } from "@/components/health/RefreshButton"
import { CollapsibleSection } from "@/components/health/CollapsibleSection"
import { UserTypeToggle } from "@/components/health/UserTypeToggle"
import { Suspense } from "react"

const DAYS = 7

async function getOverview(userType: string) {
  const since = new Date()
  since.setDate(since.getDate() - DAYS)
  since.setHours(0, 0, 0, 0)

  const apps = await prisma.app.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      iconUrl: true,
      category: true,
      redashName: true,
      bpMetrics: {
        where: { date: { gte: since }, userType },
        orderBy: { date: "asc" },
        select: {
          date: true,
          firstOpened: true,
          firstBP: true,
          afCoverage: true,
          perc: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return apps.map((app) => {
    if (!app.redashName || app.bpMetrics.length === 0) {
      return {
        id: app.id,
        name: app.name,
        slug: app.slug,
        iconUrl: app.iconUrl,
        category: app.category as string,
        configured: !!app.redashName,
        data: [] as { date: string; perc: number; firstOpened: number; afCoverage: number | null }[],
        latest: null,
        trend: null,
      }
    }

    // Aggregate by day across versions using weighted sums
    const byDay = new Map<string, {
      firstOpened: number; firstBP: number
      afCoverageSum: number; afCoverageCount: number
    }>()
    for (const m of app.bpMetrics) {
      const key = m.date.toISOString().slice(0, 10)
      const e = byDay.get(key)
      if (!e) {
        byDay.set(key, {
          firstOpened: m.firstOpened, firstBP: m.firstBP,
          afCoverageSum: m.afCoverage ?? 0, afCoverageCount: m.afCoverage !== null ? 1 : 0,
        })
      } else {
        e.firstOpened += m.firstOpened
        e.firstBP += m.firstBP
        if (m.afCoverage !== null) { e.afCoverageSum += m.afCoverage; e.afCoverageCount++ }
      }
    }

    const data = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        perc: d.firstOpened > 0 ? Math.round((d.firstBP / d.firstOpened) * 10000) / 100 : 0,
        firstOpened: d.firstOpened,
        afCoverage: d.afCoverageCount > 0
          ? Math.round((d.afCoverageSum / d.afCoverageCount) * 100) / 100 : null,
      }))

    const latest = data.at(-1) ?? null
    const prev = data.at(-2) ?? null

    return {
      id: app.id,
      name: app.name,
      slug: app.slug,
      iconUrl: app.iconUrl,
      category: app.category as string,
      configured: true,
      data,
      latest,
      trend: latest && prev
        ? Math.round((latest.perc - prev.perc) * 100) / 100
        : null,
    }
  })
}

interface SearchParams {
  userType?: string
}

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const isAdmin = (session.user as { role?: string })?.role === "ADMIN"

  const { userType = "Organic" } = await searchParams

  const apps = await getOverview(userType)
  const critical      = apps.filter((a) => a.configured && a.latest && a.latest.perc < 75)
  const healthy       = apps.filter((a) => a.configured && a.latest && a.latest.perc >= 75)
  const needsMoreData = apps.filter((a) => !a.configured || !a.latest)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            BP % across all apps — last {DAYS} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <UserTypeToggle current={userType} />
          </Suspense>
          {isAdmin && <RefreshButton isAdmin={isAdmin} />}
        </div>
      </div>

      {/* Summary pills */}
      {(healthy.length > 0 || critical.length > 0) && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            {healthy.length} healthy
          </div>
          {critical.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-sm text-red-700">
              <span className="size-2 rounded-full bg-red-500 inline-block" />
              {critical.length} needs attention
            </div>
          )}
        </div>
      )}

      {/* Apps needing attention */}
      {critical.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Needs Attention</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {critical.map((app) => (
              <AppHealthCard key={app.id} {...app} />
            ))}
          </div>
        </section>
      )}

      {/* Healthy apps */}
      {healthy.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {critical.length > 0 ? "Healthy" : "All Apps"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {healthy.map((app) => (
              <AppHealthCard key={app.id} {...app} />
            ))}
          </div>
        </section>
      )}

      {/* No data / not configured — collapsed by default */}
      {needsMoreData.length > 0 && (
        <CollapsibleSection title="Not enough data" count={needsMoreData.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {needsMoreData.map((app) => (
              <AppHealthCard key={app.id} {...app} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {apps.length === 0 && (
        <div className="rounded-xl border border-border p-16 text-center text-muted-foreground text-sm">
          No apps found.
        </div>
      )}
    </div>
  )
}
