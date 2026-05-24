/**
 * POST /api/v1/sync/health
 *
 * For every active Android app that has markets assigned, checks Play Store
 * availability in each market. If the status has changed since the last check,
 * creates a HealthStatus record and sends a Telegram notification.
 *
 * Protect with SYNC_SECRET in production:
 *   Authorization: Bearer <SYNC_SECRET>
 *
 * Recommended cron schedule (every 4 hours):
 *   0 *\/4 * * * curl -s -X POST https://your-app/api/v1/sync/health \
 *     -H "Authorization: Bearer $SYNC_SECRET"
 */

import { prisma } from "@/lib/prisma"
import { isAvailableIn } from "@/lib/google-play"
import { sendTelegramMessage, formatHealthChangeMessage } from "@/lib/notify"
import { auth } from "@/lib/auth"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ""

// How many apps to process in parallel
const APP_CONCURRENCY = 3

type StatusChange = {
  appName: string
  appSlug: string
  marketName: string
  marketCode: string
  previousStatus: string
  newStatus: string
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

  // Fetch all active Android apps that have at least one market
  const apps = await prisma.app.findMany({
    where: {
      packageName: { not: null },
      platform: { in: ["ANDROID", "CROSS_PLATFORM"] },
      status: "ACTIVE",
      markets: { some: {} },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      packageName: true,
      markets: {
        select: {
          market: { select: { id: true, code: true, name: true } },
        },
      },
      health: {
        orderBy: { createdAt: "desc" },
        // Only need the latest entry per market — fetch enough to cover all markets
        take: 50,
        select: { id: true, marketId: true, status: true },
      },
    },
  })

  const changes: StatusChange[] = []
  const errors: { app: string; market: string; error: string }[] = []
  let checked = 0

  // Process apps in batches
  for (let i = 0; i < apps.length; i += APP_CONCURRENCY) {
    const batch = apps.slice(i, i + APP_CONCURRENCY)

    await Promise.all(batch.map(async (app) => {
      const marketResults: { available: boolean }[] = []

      // Check all markets for this app in parallel
      await Promise.all(app.markets.map(async ({ market }) => {
        checked++
        try {
          const available = await isAvailableIn(app.packageName!, market.code)
          marketResults.push({ available })
          const newStatus = available ? "HEALTHY" : "OUTAGE"

          // Find the latest health entry for this specific market
          const latestForMarket =
            app.health.find((h) => h.marketId === market.id) ??
            app.health.find((h) => h.marketId === null)

          const previousStatus = latestForMarket?.status ?? "HEALTHY"

          // Skip if nothing changed
          if (previousStatus === newStatus) return

          // Persist the new status
          await prisma.healthStatus.create({
            data: {
              appId: app.id,
              marketId: market.id,
              status: newStatus,
              notes: `Automated check — app ${available ? "available" : "unavailable"} on Play Store in ${market.name}.`,
            },
          })

          const change: StatusChange = {
            appName: app.name,
            appSlug: app.slug,
            marketName: market.name,
            marketCode: market.code,
            previousStatus,
            newStatus,
          }
          changes.push(change)

          // Telegram notification
          await sendTelegramMessage(
            formatHealthChangeMessage(
              app.name,
              market.name,
              market.code,
              previousStatus,
              newStatus,
              app.slug,
              APP_URL,
            )
          )
        } catch (err) {
          errors.push({
            app: app.name,
            market: market.code,
            error: err instanceof Error ? err.message : "Unknown error",
          })
        }
      }))

      // If every market came back unavailable, flip the app to IN_DEVELOPMENT
      // If at least one is available, make sure it's ACTIVE
      if (marketResults.length > 0) {
        const allDown = marketResults.every((r) => !r.available)
        await prisma.app.update({
          where: { id: app.id },
          data: { status: allDown ? "NOT_ACTIVE" : "ACTIVE" },
        })
      }
    }))
  }

  return Response.json({
    checked,
    changed: changes.length,
    errors: errors.length,
    changes,
    ...(errors.length > 0 ? { errorDetails: errors } : {}),
  })
}

// GET allowed in dev for easy browser testing
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "GET only allowed in development" }, { status: 405 })
  }
  return POST(request)
}
