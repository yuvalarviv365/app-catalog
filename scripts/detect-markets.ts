/**
 * Standalone script: detect Play Store markets for apps that have none.
 * Run with: npx tsx scripts/detect-markets.ts
 */
import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import gplay from "google-play-scraper"

const adapter = new PrismaPg({ connectionString: "postgresql://yuvalarviv@localhost:5432/app_catalog" })
const prisma = new PrismaClient({ adapter })

const COUNTRIES = [
  { code: "AT", name: "Austria", region: "EMEA" },
  { code: "BE", name: "Belgium", region: "EMEA" },
  { code: "BG", name: "Bulgaria", region: "EMEA" },
  { code: "HR", name: "Croatia", region: "EMEA" },
  { code: "CY", name: "Cyprus", region: "EMEA" },
  { code: "CZ", name: "Czech Republic", region: "EMEA" },
  { code: "DK", name: "Denmark", region: "EMEA" },
  { code: "EE", name: "Estonia", region: "EMEA" },
  { code: "FI", name: "Finland", region: "EMEA" },
  { code: "FR", name: "France", region: "EMEA" },
  { code: "DE", name: "Germany", region: "EMEA" },
  { code: "GR", name: "Greece", region: "EMEA" },
  { code: "HU", name: "Hungary", region: "EMEA" },
  { code: "IE", name: "Ireland", region: "EMEA" },
  { code: "IT", name: "Italy", region: "EMEA" },
  { code: "LV", name: "Latvia", region: "EMEA" },
  { code: "LT", name: "Lithuania", region: "EMEA" },
  { code: "LU", name: "Luxembourg", region: "EMEA" },
  { code: "MT", name: "Malta", region: "EMEA" },
  { code: "NL", name: "Netherlands", region: "EMEA" },
  { code: "NO", name: "Norway", region: "EMEA" },
  { code: "PL", name: "Poland", region: "EMEA" },
  { code: "PT", name: "Portugal", region: "EMEA" },
  { code: "RO", name: "Romania", region: "EMEA" },
  { code: "SK", name: "Slovakia", region: "EMEA" },
  { code: "SI", name: "Slovenia", region: "EMEA" },
  { code: "ES", name: "Spain", region: "EMEA" },
  { code: "SE", name: "Sweden", region: "EMEA" },
  { code: "CH", name: "Switzerland", region: "EMEA" },
  { code: "GB", name: "United Kingdom", region: "EMEA" },
  { code: "ZA", name: "South Africa", region: "EMEA" },
  { code: "NG", name: "Nigeria", region: "EMEA" },
  { code: "KE", name: "Kenya", region: "EMEA" },
  { code: "GH", name: "Ghana", region: "EMEA" },
  { code: "TZ", name: "Tanzania", region: "EMEA" },
  { code: "AR", name: "Argentina", region: "LATAM" },
  { code: "BR", name: "Brazil", region: "LATAM" },
  { code: "CL", name: "Chile", region: "LATAM" },
  { code: "CO", name: "Colombia", region: "LATAM" },
  { code: "MX", name: "Mexico", region: "LATAM" },
  { code: "PE", name: "Peru", region: "LATAM" },
  { code: "AU", name: "Australia", region: "APAC" },
  { code: "IN", name: "India", region: "APAC" },
  { code: "JP", name: "Japan", region: "APAC" },
  { code: "PH", name: "Philippines", region: "APAC" },
  { code: "SG", name: "Singapore", region: "APAC" },
  { code: "CA", name: "Canada", region: "AMERICAS" },
  { code: "US", name: "United States", region: "AMERICAS" },
]

function flagEmoji(code: string): string {
  return code.toUpperCase().split("").map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join("")
}

async function isAvailableIn(pkg: string, code: string): Promise<boolean> {
  try {
    const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 8000))
    const result = await Promise.race([gplay.app({ appId: pkg, country: code.toLowerCase(), throttle: 10 }), timeout]) as { available?: boolean }
    return result.available === true
  } catch { return false }
}

async function detectForApp(app: { id: string; name: string; packageName: string }, index: number, total: number) {
  process.stdout.write(`[${index}/${total}] ${app.name} ... `)
  const available: string[] = []

  for (let i = 0; i < COUNTRIES.length; i += 15) {
    const batch = COUNTRIES.slice(i, i + 15)
    const results = await Promise.all(
      batch.map(async c => ({ code: c.code, ok: await isAvailableIn(app.packageName, c.code) }))
    )
    for (const { code, ok } of results) if (ok) available.push(code)
  }

  if (available.length === 0) { console.log("no markets"); return }

  const existing = await prisma.market.findMany({
    where: { code: { in: available } },
    select: { id: true, code: true },
  })
  const existingCodes = new Set(existing.map((m: { code: string }) => m.code))
  const created = await Promise.all(
    available.filter(c => !existingCodes.has(c)).map(code => {
      const info = COUNTRIES.find(c2 => c2.code === code)!
      return prisma.market.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { code: info.code, name: info.name, region: info.region as any, flagEmoji: flagEmoji(info.code) },
        select: { id: true, code: true },
      })
    })
  )
  const allMarkets = [...existing, ...created] as { id: string; code: string }[]
  await prisma.appMarket.createMany({
    data: allMarkets.map(m => ({ appId: app.id, marketId: m.id, status: "LIVE", launchDate: new Date() })),
    skipDuplicates: true,
  })
  console.log(`${available.length} markets: ${available.join(", ")}`)
}

async function main() {
  const apps = await prisma.app.findMany({
    where: { packageName: { not: null }, markets: { none: {} } },
    select: { id: true, name: true, packageName: true },
  }) as { id: string; name: string; packageName: string }[]

  console.log(`Detecting markets for ${apps.length} apps (3 at a time)...\n`)

  for (let i = 0; i < apps.length; i += 3) {
    const batch = apps.slice(i, i + 3)
    await Promise.all(batch.map((app, j) => detectForApp(app, i + j + 1, apps.length)))
  }

  console.log("\nDone!")
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
