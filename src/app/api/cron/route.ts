/**
 * GET /api/cron
 * Called daily by Vercel Cron (Hobby plan).
 * Triggers the Google Play sync.
 */

import { prisma } from "@/lib/prisma"
import { getPlayStoreApps } from "@/lib/google-play"
import { sendTelegramMessage, formatNewReleaseMessage } from "@/lib/notify"

export async function GET(request: Request) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization") ?? ""

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

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
    return Response.json({ synced: 0, newReleases: 0, errors: 0 })
  }

  const storeData = await getPlayStoreApps(apps.map((a) => a.packageName!))

  let newReleases = 0, errors = 0

  for (const app of apps) {
    const data = storeData.get(app.packageName!)
    if (!data || data instanceof Error) { errors++; continue }

    await prisma.app.update({
      where: { id: app.id },
      data: {
        ...(data.icon ? { iconUrl: data.icon } : {}),
        ...(data.released && !app.storeReleasedAt ? { storeReleasedAt: new Date(data.released) } : {}),
      },
    })

    const storeVersion = data.version
    const catalogVersion = app.releases[0]?.version
    if (catalogVersion === storeVersion) continue

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

    newReleases++
  }

  return Response.json({ synced: apps.length, newReleases, errors })
}
