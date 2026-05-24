/**
 * POST /api/v1/sync/app-mapping
 *
 * Fetches the package-name → redashName mapping from Redash query 3211
 * and updates App.redashName for any app whose packageName matches.
 *
 * Triggered automatically when a new app is created, and by daily cron.
 *
 * Cron schedule (once per day):
 *   0 2 * * * /path/to/scripts/sync.sh app-mapping
 */

import { prisma } from "@/lib/prisma"
import { executeRedashQuery } from "@/lib/redash"
import { auth } from "@/lib/auth"

const QUERY_ID = process.env.REDASH_MAPPING_QUERY_ID ?? "3211"
const API_KEY  = process.env.REDASH_MAPPING_API_KEY  ?? ""

interface MappingRow {
  application_name: string   // → App.redashName
  appsflyer_app_id: string   // → App.packageName
}

export async function POST(request: Request) {
  // Accept bearer token (cron) or admin/PM session (browser)
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

  // Fetch mapping from Redash
  let rows: MappingRow[]
  try {
    const result = await executeRedashQuery<MappingRow>(QUERY_ID, {}, API_KEY)
    rows = result.rows
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch mapping from Redash" },
      { status: 502 },
    )
  }

  if (rows.length === 0) {
    return Response.json({ message: "No mapping rows returned from Redash.", updated: 0 })
  }

  // Build lookup: packageName (lowercase) → redashName
  const mapping = new Map(
    rows.map((r) => [r.appsflyer_app_id.toLowerCase(), r.application_name])
  )

  // Fetch all apps that have a packageName
  const apps = await prisma.app.findMany({
    where: { packageName: { not: null } },
    select: { id: true, packageName: true, redashName: true },
  })

  let updated = 0, skipped = 0

  for (const app of apps) {
    const newRedashName = mapping.get(app.packageName!.toLowerCase())
    if (!newRedashName) { skipped++; continue }
    if (app.redashName === newRedashName) { skipped++; continue }

    await prisma.app.update({
      where: { id: app.id },
      data: { redashName: newRedashName },
    })
    updated++
  }

  return Response.json({
    updated,
    skipped,
    total: rows.length,
  })
}

// GET allowed in dev for easy browser testing
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "GET only allowed in development" }, { status: 405 })
  }
  return POST(request)
}
