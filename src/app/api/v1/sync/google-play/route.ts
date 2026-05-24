/**
 * POST /api/v1/sync/google-play
 *
 * Scrapes the Google Play Store for all Android apps that have a `packageName`
 * set. For each app, checks whether the store version is newer than the latest
 * release in the catalog — and if so, creates a Release record and sends a
 * Telegram notification.
 *
 * No credentials required — reads publicly available store data.
 *
 * Protect with SYNC_SECRET in production:
 *   Authorization: Bearer <SYNC_SECRET>
 *
 * Cron example (every 6h):
 *   0 *\/6 * * * curl -s -X POST https://your-app/api/v1/sync/google-play \
 *     -H "Authorization: Bearer $SYNC_SECRET"
 */

import { prisma } from "@/lib/prisma"
import { getPlayStoreApps } from "@/lib/google-play"
import { sendTelegramMessage, formatNewReleaseMessage } from "@/lib/notify"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  // Accept either a logged-in admin session (browser) or a secret token (cron job)
  const secret = process.env.SYNC_SECRET
  const authHeader = request.headers.get("authorization") ?? ""
  const tokenValid = secret && authHeader === `Bearer ${secret}`

  if (!tokenValid) {
    // Fall back to session auth
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    if (!session?.user || (role !== "ADMIN" && role !== "PM")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // All active Android apps with a package name
  const apps = await prisma.app.findMany({
    where: {
      packageName: { not: null },
      platform: { in: ["ANDROID", "CROSS_PLATFORM"] },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      packageName: true,
      platform: true,
      storeReleasedAt: true,
      releases: {
        orderBy: { releaseDate: "desc" },
        take: 1,
        select: { version: true },
      },
    },
  })

  if (apps.length === 0) {
    return Response.json({
      synced: 0,
      newReleases: 0,
      errors: 0,
      message: "No apps with a packageName configured. Edit an app and add its Play Store package name.",
      results: [],
    })
  }

  // Scrape all package names (with concurrency cap)
  const packageNames = apps.map((a) => a.packageName!)
  const storeData = await getPlayStoreApps(packageNames)

  const results: Array<{
    app: string
    packageName: string
    status: "new_release" | "up_to_date" | "error"
    version?: string
    error?: string
  }> = []

  for (const app of apps) {
    const data = storeData.get(app.packageName!)

    if (!data || data instanceof Error) {
      results.push({
        app: app.name,
        packageName: app.packageName!,
        status: "error",
        error: data instanceof Error ? data.message : "No data returned",
      })
      continue
    }

    const storeVersion = data.version
    const catalogVersion = app.releases[0]?.version

    // Always refresh icon and store release date from the store
    await prisma.app.update({
      where: { id: app.id },
      data: {
        ...(data.icon ? { iconUrl: data.icon } : {}),
        ...(data.released && !app.storeReleasedAt
          ? { storeReleasedAt: new Date(data.released) }
          : {}),
      },
    })

    if (catalogVersion === storeVersion) {
      results.push({
        app: app.name,
        packageName: app.packageName!,
        status: "up_to_date",
        version: storeVersion,
      })
      continue
    }

    // New version — create Release and notify
    await prisma.release.create({
      data: {
        appId: app.id,
        version: storeVersion,
        platform: app.platform === "CROSS_PLATFORM" ? "ANDROID" : app.platform,
        releaseDate: new Date(data.updated),
        releaseType: "PATCH",
        releaseNotes: data.releaseNotes || `Version ${storeVersion} released on Google Play.`,
      },
    })

    await sendTelegramMessage(
      formatNewReleaseMessage(app.name, storeVersion, app.packageName!)
    )

    results.push({
      app: app.name,
      packageName: app.packageName!,
      status: "new_release",
      version: storeVersion,
    })
  }

  const newReleases = results.filter((r) => r.status === "new_release").length
  const errors = results.filter((r) => r.status === "error").length

  return Response.json({
    synced: apps.length,
    newReleases,
    errors,
    results,
  })
}

// GET allowed in dev for easy browser testing
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "GET only allowed in development" }, { status: 405 })
  }
  return POST(request)
}
