/**
 * GET /api/v1/apps/[slug]/health/bp?days=30&userType=Organic&version=0.2.8
 *
 * Returns daily BP metrics for the app.
 * - userType: "Organic" | "UA" (default: "Organic")
 * - version:  specific version string, or omitted / "all" to aggregate across all versions
 *
 * Response includes `versions` — the distinct versions available in the window,
 * so the client can populate a dropdown without a separate request.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug } = await params
  const { searchParams } = new URL(request.url)
  const days     = Math.min(parseInt(searchParams.get("days") ?? "30"), 90)
  const userType = searchParams.get("userType") ?? "Organic"
  const version  = searchParams.get("version") ?? "all"

  const app = await prisma.app.findUnique({
    where: { slug },
    select: { id: true, redashName: true },
  })

  if (!app) return Response.json({ error: "App not found" }, { status: 404 })
  if (!app.redashName) return Response.json({ configured: false, data: [] })

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const metrics = await prisma.bPMetric.findMany({
    where: {
      appId: app.id,
      userType,
      date: { gte: since },
      ...(version !== "all" ? { version } : {}),
    },
    orderBy: { date: "asc" },
  })

  // Collect distinct versions present in this window (for the dropdown)
  const versions = [...new Set(metrics.map((m) => m.version))].sort()

  // Aggregate by day using weighted sums (sum firstBP / sum firstOpened)
  const byDay = new Map<string, {
    date: string
    firstOpened: number
    firstBP: number
    afCoverageSum: number
    afCoverageCount: number
    medianAfLoadSum: number
    medianAfLoadCount: number
  }>()

  for (const m of metrics) {
    const dayKey = m.date.toISOString().slice(0, 10)
    const existing = byDay.get(dayKey)

    if (!existing) {
      byDay.set(dayKey, {
        date: dayKey,
        firstOpened: m.firstOpened,
        firstBP: m.firstBP,
        afCoverageSum: m.afCoverage ?? 0,
        afCoverageCount: m.afCoverage !== null ? 1 : 0,
        medianAfLoadSum: m.medianAfParamsLoad ?? 0,
        medianAfLoadCount: m.medianAfParamsLoad !== null ? 1 : 0,
      })
    } else {
      existing.firstOpened += m.firstOpened
      existing.firstBP += m.firstBP
      if (m.afCoverage !== null) {
        existing.afCoverageSum += m.afCoverage
        existing.afCoverageCount++
      }
      if (m.medianAfParamsLoad !== null) {
        existing.medianAfLoadSum += m.medianAfParamsLoad
        existing.medianAfLoadCount++
      }
    }
  }

  const data = Array.from(byDay.values()).map((d) => ({
    date: d.date,
    firstOpened: d.firstOpened,
    firstBP: d.firstBP,
    perc: d.firstOpened > 0
      ? Math.round((d.firstBP / d.firstOpened) * 10000) / 100
      : 0,
    afCoverage: d.afCoverageCount > 0
      ? Math.round((d.afCoverageSum / d.afCoverageCount) * 100) / 100
      : null,
    medianAfLoad: d.medianAfLoadCount > 0
      ? Math.round((d.medianAfLoadSum / d.medianAfLoadCount) * 1000) / 1000
      : null,
  }))

  const latest = data.at(-1) ?? null
  const prev   = data.at(-2) ?? null

  return Response.json({
    configured: true,
    redashName: app.redashName,
    userType,
    version,
    versions,        // distinct versions available in this window
    data,
    latest,
    trend: latest && prev
      ? Math.round((latest.perc - prev.perc) * 100) / 100
      : null,
    syncedAt: metrics.at(-1)?.syncedAt ?? null,
  })
}
