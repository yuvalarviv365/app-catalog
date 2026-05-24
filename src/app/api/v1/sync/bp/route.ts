/**
 * POST /api/v1/sync/bp
 *
 * Executes the Redash BP query with dynamic parameters (last 30 days, Day
 * granularity) for both android and ios, then upserts results into BPMetric
 * keyed by app × version × userType × date.
 *
 * Cron schedule (every hour):
 *   0 * * * * /path/to/scripts/sync.sh bp
 */

import { prisma } from "@/lib/prisma"
import { executeRedashQuery, type BPRow } from "@/lib/redash"
import { auth } from "@/lib/auth"

const BP_QUERY_ID = process.env.REDASH_BP_QUERY_ID ?? "3209"

/** Parse Redash date_trunc — JSON API returns ISO: "2026-05-23T00:00:00" */
function parseDateTrunc(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw.includes("T") ? raw + "Z" : raw.replace(" ", "T") + "Z")
  return isNaN(d.getTime()) ? null : d
}

function buildDateRange(days = 30) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} 00:00`
  return { start: fmt(start), end: fmt(end) }
}

async function fetchForPlatform(osType: string): Promise<BPRow[]> {
  const { start, end } = buildDateRange(30)
  const result = await executeRedashQuery<BPRow>(BP_QUERY_ID, {
    "Date Range": { start, end },
    "OS Type": osType,
    "Timeframe": "Day",
  })
  return result.rows
}

async function processRows(
  rows: BPRow[],
  nameToId: Map<string, string>,
): Promise<{ synced: number; skipped: number; errors: string[] }> {
  let synced = 0, skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    const appId = nameToId.get(row.application.toLowerCase())
    if (!appId) { skipped++; continue }

    const date = parseDateTrunc(row.date_trunc)
    if (!date) {
      errors.push(`Bad date: ${row.date_trunc}`)
      continue
    }

    const firstOpened = row.first_opened
    const firstBP     = row.first_bp
    const perc        = row.perc
    const afCoverage  = row.af_coverage  ?? null
    const medianLoad  = row.median_af_params_load ?? null

    if (!firstOpened) { skipped++; continue }

    const version  = row.version  || ""
    const userType = row.mergeduatype || "Organic"

    try {
      await prisma.bPMetric.upsert({
        where: { appId_version_userType_date: { appId, version, userType, date } },
        create: { appId, application: row.application, version, userType, date, firstOpened, firstBP, perc, afCoverage, medianAfParamsLoad: medianLoad },
        update: { firstOpened, firstBP, perc, afCoverage, medianAfParamsLoad: medianLoad, syncedAt: new Date() },
      })
      synced++
    } catch (err) {
      errors.push(`${row.application} v${version} ${userType} ${row.date_trunc}: ${err instanceof Error ? err.message : "unknown"}`)
    }
  }

  return { synced, skipped, errors }
}

export async function POST(request: Request) {
  // Accept bearer token (cron) or admin session (browser)
  const secret = process.env.SYNC_SECRET
  const authHeader = request.headers.get("authorization") ?? ""
  const tokenValid = secret && authHeader === `Bearer ${secret}`

  if (!tokenValid) {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user || (role !== "ADMIN" && role !== "PM")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const apps = await prisma.app.findMany({
    where: { redashName: { not: null } },
    select: { id: true, redashName: true },
  })

  if (apps.length === 0) {
    return Response.json({ message: "No apps configured.", synced: 0 })
  }

  const nameToId = new Map(apps.map((a) => [a.redashName!.toLowerCase(), a.id]))

  // Run query for both platforms in parallel
  let androidRows: BPRow[] = []

  try {
    const dateRange = buildDateRange(30)
    ;({ rows: androidRows } = await executeRedashQuery<BPRow>(BP_QUERY_ID, {
      "Date Range": dateRange,
      "OS Type": "android",
      "Timeframe": "Day",
    }))
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch from Redash" },
      { status: 502 },
    )
  }

  const { synced, skipped, errors } = await processRows(androidRows, nameToId)

  return Response.json({
    synced,
    skipped,
    total: androidRows.length,
    ...(errors.length > 0 ? { errors } : {}),
  })
}

// GET allowed in dev for easy browser testing
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "GET only allowed in development" }, { status: 405 })
  }
  return POST(request)
}
