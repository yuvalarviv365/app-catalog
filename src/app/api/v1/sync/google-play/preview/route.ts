/**
 * GET /api/v1/sync/google-play/preview?packageName=com.x.y[&detectMarkets=false]
 *
 * Fetches app info from the Play Store without persisting the app.
 * Pass detectMarkets=false (bulk import) to skip the slow per-country checks —
 * markets are then detected server-side when the app is created.
 */

import { getPlayStoreApp, detectAndSyncMarkets } from "@/lib/google-play"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function guessCategory(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("live") || t.includes("score") || t.includes("livescore")) return "LIVESCORES"
  if (t.includes("casino") || t.includes("slot") || t.includes("poker") || t.includes("bet")) return "CASINO"
  if (t.includes("sport") || t.includes("football") || t.includes("soccer") || t.includes("basketball")) return "SPORTS"
  return "OTHER"
}

export async function GET(request: Request) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || (role !== "ADMIN" && role !== "PM")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const packageName = searchParams.get("packageName")?.trim()
  const detectMarkets = searchParams.get("detectMarkets") !== "false"

  if (!packageName) {
    return Response.json({ error: "packageName is required" }, { status: 400 })
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(packageName)) {
    return Response.json({ error: "Invalid package name format (e.g. com.company.app)" }, { status: 400 })
  }

  const existing = await prisma.app.findFirst({
    where: { packageName },
    select: { slug: true, name: true },
  })
  if (existing) {
    return Response.json(
      { error: `Already imported as "${existing.name}"`, existingSlug: existing.slug },
      { status: 409 }
    )
  }

  try {
    const data = await getPlayStoreApp(packageName)
    const category = guessCategory(data.title)

    // Parse the store release date string (e.g. "Sep 21, 2010") into an ISO string
    const storeReleasedAt = data.released ? new Date(data.released).toISOString() : null

    if (!detectMarkets) {
      // Fast path — skip country checks, markets detected on create
      return Response.json({
        title: data.title,
        icon: data.icon,
        version: data.version,
        releaseNotes: data.releaseNotes,
        score: data.score,
        installs: data.installs,
        storeReleasedAt,
        category,
        availableMarkets: null, // null = will be detected on create
      })
    }

    // Slow path — detect markets now (single-app import)
    const availableMarkets = await detectAndSyncMarkets(packageName)

    return Response.json({
      title: data.title,
      icon: data.icon,
      version: data.version,
      releaseNotes: data.releaseNotes,
      score: data.score,
      installs: data.installs,
      storeReleasedAt,
      category,
      availableMarkets,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch from Play Store"
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("404")) {
      return Response.json({ error: "App not found on Play Store. Check the package name." }, { status: 404 })
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
