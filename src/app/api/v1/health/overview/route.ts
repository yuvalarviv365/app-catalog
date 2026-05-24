/**
 * GET /api/v1/health/overview?days=7
 *
 * Returns BP metrics for ALL apps that have redashName configured,
 * aggregated by day, in a single query. Powers the Health overview page.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 30)

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  // All apps (with and without redashName) for the full list
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
        where: { date: { gte: since } },
        orderBy: { date: "asc" },
        select: {
          date: true,
          version: true,
          firstOpened: true,
          firstBP: true,
          perc: true,
          afCoverage: true,
          medianAfParamsLoad: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const result = apps.map((app) => {
    if (!app.redashName || app.bpMetrics.length === 0) {
      return {
        id: app.id,
        name: app.name,
        slug: app.slug,
        iconUrl: app.iconUrl,
        category: app.category,
        configured: !!app.redashName,
        data: [],
        latest: null,
        trend: null,
      }
    }

    // Aggregate by day across versions
    const byDay = new Map<string, {
      date: string
      firstOpened: number
      firstBP: number
      afCoverageSum: number
      afCoverageCount: number
    }>()

    for (const m of app.bpMetrics) {
      const dayKey = m.date.toISOString().slice(0, 10)
      const existing = byDay.get(dayKey)
      if (!existing) {
        byDay.set(dayKey, {
          date: dayKey,
          firstOpened: m.firstOpened,
          firstBP: m.firstBP,
          afCoverageSum: m.afCoverage ?? 0,
          afCoverageCount: m.afCoverage !== null ? 1 : 0,
        })
      } else {
        existing.firstOpened += m.firstOpened
        existing.firstBP += m.firstBP
        if (m.afCoverage !== null) {
          existing.afCoverageSum += m.afCoverage
          existing.afCoverageCount++
        }
      }
    }

    const data = Array.from(byDay.values()).map((d) => ({
      date: d.date,
      perc: d.firstOpened > 0
        ? Math.round((d.firstBP / d.firstOpened) * 10000) / 100
        : 0,
      firstOpened: d.firstOpened,
      afCoverage: d.afCoverageCount > 0
        ? Math.round((d.afCoverageSum / d.afCoverageCount) * 100) / 100
        : null,
    }))

    const latest = data.at(-1) ?? null
    const prev = data.at(-2) ?? null

    return {
      id: app.id,
      name: app.name,
      slug: app.slug,
      iconUrl: app.iconUrl,
      category: app.category,
      configured: true,
      data,
      latest,
      trend: latest && prev
        ? Math.round((latest.perc - prev.perc) * 100) / 100
        : null,
    }
  })

  // Configured apps first, then unconfigured
  result.sort((a, b) => {
    if (a.configured !== b.configured) return a.configured ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return Response.json(result)
}
