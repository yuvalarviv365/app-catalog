/**
 * Google Play Store scraper
 * Uses google-play-scraper — no credentials or API keys required.
 * Reads publicly available data from the Play Store page.
 */

import gplay from "google-play-scraper"

export interface PlayAppInfo {
  version: string         // e.g. "3.2.1"
  released: string        // Original release date string, e.g. "Sep 21, 2010"
  updated: number         // Unix timestamp ms of last update
  score: number           // Store rating 0–5
  ratings: number         // Number of ratings
  installs: string        // e.g. "5,000,000+"
  releaseNotes: string    // "What's new" section
  title: string
  icon: string            // Icon URL from the store
}

/**
 * Fetch current production info for an Android app by package name.
 * e.g. packageName = "com.yourcompany.livescore"
 */
export async function getPlayStoreApp(packageName: string): Promise<PlayAppInfo> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Play Store request timed out")), 15000)
  )
  const result = await Promise.race([
    gplay.app({ appId: packageName, throttle: 10 }),
    timeout,
  ])

  return {
    version: result.version,
    released: result.released ?? "",
    updated: result.updated,
    score: result.score,
    ratings: result.ratings,
    installs: result.installs,
    releaseNotes: result.recentChanges ?? "",
    title: result.title,
    icon: result.icon,
  }
}

/**
 * Fetch multiple apps in parallel with a concurrency cap to avoid rate limiting.
 */
export async function getPlayStoreApps(
  packageNames: string[],
  concurrency = 3
): Promise<Map<string, PlayAppInfo | Error>> {
  const results = new Map<string, PlayAppInfo | Error>()
  const chunks = chunkArray(packageNames, concurrency)

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (pkg) => {
        try {
          results.set(pkg, await getPlayStoreApp(pkg))
        } catch (err) {
          results.set(pkg, err instanceof Error ? err : new Error(String(err)))
        }
      })
    )
  }

  return results
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Check if an app is available for download in a specific country.
 * Returns false on timeout (8s) or any error.
 */
export async function isAvailableIn(packageName: string, countryCode: string): Promise<boolean> {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 8000)
    )
    const result = await Promise.race([
      gplay.app({ appId: packageName, country: countryCode.toLowerCase(), throttle: 10 }),
      timeout,
    ])
    return result.available === true
  } catch {
    return false
  }
}

/**
 * Detect which countries from our COUNTRIES list an app is available in,
 * then upsert those as Market rows in the DB and return their records.
 * Import prisma and COUNTRIES inside to avoid circular deps at module level.
 */
export async function detectAndSyncMarkets(packageName: string) {
  const { prisma } = await import("@/lib/prisma")
  const { COUNTRIES, flagEmoji } = await import("@/lib/countries")

  const CONCURRENCY = 15
  const availableCodes: string[] = []

  for (let i = 0; i < COUNTRIES.length; i += CONCURRENCY) {
    const batch = COUNTRIES.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (c) => ({ code: c.code, available: await isAvailableIn(packageName, c.code) }))
    )
    for (const { code, available } of results) {
      if (available) availableCodes.push(code)
    }
  }

  if (availableCodes.length === 0) return []

  const existing = await prisma.market.findMany({
    where: { code: { in: availableCodes } },
    select: { id: true, code: true, name: true, region: true, flagEmoji: true },
  })
  const existingCodes = new Set(existing.map((m) => m.code))

  const created = await Promise.all(
    availableCodes
      .filter((c) => !existingCodes.has(c))
      .map((code) => {
        const info = COUNTRIES.find((c) => c.code === code)!
        return prisma.market.create({
          data: { code: info.code, name: info.name, region: info.region, flagEmoji: flagEmoji(info.code) },
          select: { id: true, code: true, name: true, region: true, flagEmoji: true },
        })
      })
  )

  return [...existing, ...created].sort((a, b) => a.name.localeCompare(b.name))
}
