/**
 * POST /api/v1/apps/detect-markets
 * Body: { slugs: string[] }
 *
 * Runs Play Store market detection for a list of apps and saves results.
 * Called after bulk import to set markets without blocking the create flow.
 */

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { detectAndSyncMarkets } from "@/lib/google-play"

export async function POST(request: Request) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || (role !== "ADMIN" && role !== "PM")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slugs } = await request.json() as { slugs: string[] }
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return Response.json({ error: "slugs array required" }, { status: 400 })
  }

  const apps = await prisma.app.findMany({
    where: { slug: { in: slugs }, packageName: { not: null } },
    select: { id: true, slug: true, name: true, packageName: true },
  })

  const APP_CONCURRENCY = 3
  const results: Array<{ slug: string; name: string; markets: number; error?: string }> = []

  for (let i = 0; i < apps.length; i += APP_CONCURRENCY) {
    const batch = apps.slice(i, i + APP_CONCURRENCY)
    const batchResults = await Promise.all(batch.map(async (app) => {
      try {
        const markets = await detectAndSyncMarkets(app.packageName!)
        if (markets.length > 0) {
          await prisma.appMarket.createMany({
            data: markets.map((m) => ({
              appId: app.id,
              marketId: m.id,
              status: "LIVE",
              launchDate: new Date(),
            })),
            skipDuplicates: true,
          })
          await prisma.app.update({ where: { id: app.id }, data: { status: "ACTIVE" } })
        } else {
          await prisma.app.update({ where: { id: app.id }, data: { status: "NOT_ACTIVE" } })
        }
        return { slug: app.slug, name: app.name, markets: markets.length }
      } catch (err) {
        return { slug: app.slug, name: app.name, markets: 0, error: err instanceof Error ? err.message : "Failed" }
      }
    }))
    results.push(...batchResults)
  }

  return Response.json({ results })
}
