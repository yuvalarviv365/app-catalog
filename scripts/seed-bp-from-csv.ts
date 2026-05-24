/**
 * One-time seed: import BP metrics from the exported CSV into the BPMetric table.
 * Usage: npx tsx scripts/seed-bp-from-csv.ts <path-to-csv>
 *
 * CSV format:
 *   application, version, date_trunc, first_opened, first_bp, perc,
 *   af_coverage, median_af_params_load, mergeduatype
 *
 * Apps must already have redashName set in the DB. Any row whose application
 * doesn't match a known redashName is skipped.
 */

import { readFileSync } from "fs"
import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL ?? "postgresql://yuvalarviv@localhost:5432/app_catalog"
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

function parseDateTrunc(raw: string): Date | null {
  // Format: "23/05/26 00:00" → DD/MM/YY HH:MM
  const match = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/)
  if (!match) return null
  const [, day, month, year, hour, min] = match
  return new Date(`20${year}-${month}-${day}T${hour}:${min}:00Z`)
}

async function main() {
  const csvPath = process.argv[2] ?? "./BP_Monitor_-_App_Catalog_2026_05_24.csv"
  const raw = readFileSync(csvPath, "utf8")
  const lines = raw.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

  console.log("Columns detected:", headers.join(", "))

  const col = (row: string[], name: string) => {
    const i = headers.indexOf(name.toLowerCase())
    return i >= 0 ? row[i]?.trim() ?? "" : ""
  }

  const apps = await prisma.app.findMany({
    where: { redashName: { not: null } },
    select: { id: true, redashName: true },
  })
  const nameToId = new Map(apps.map((a) => [a.redashName!.toLowerCase(), a.id]))
  console.log(`Found ${apps.length} apps with redashName configured`)

  let synced = 0, skipped = 0, errors = 0
  const unmatchedApps = new Set<string>()

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const row = line.split(",")

    const application  = col(row, "application")
    const version      = col(row, "version") || "unknown"
    const dateTrunc    = col(row, "date_trunc")
    const firstOpened  = parseInt(col(row, "first_opened"))
    const firstBP      = parseInt(col(row, "first_bp"))
    const perc         = parseFloat(col(row, "perc"))
    const afCoverage   = parseFloat(col(row, "af_coverage")) || null
    const medianLoad   = parseFloat(col(row, "median_af_params_load")) || null
    const userType     = col(row, "mergeduatype") || "Organic"

    const appId = nameToId.get(application.toLowerCase())
    if (!appId) { unmatchedApps.add(application); skipped++; continue }
    if (!firstOpened || isNaN(firstOpened) || firstOpened === 0) { skipped++; continue }

    const date = parseDateTrunc(dateTrunc)
    if (!date) { console.warn(`  Bad date: ${dateTrunc}`); errors++; continue }

    try {
      await prisma.bPMetric.upsert({
        where: { appId_version_userType_date: { appId, version, userType, date } },
        create: { appId, application, version, userType, date, firstOpened, firstBP, perc, afCoverage, medianAfParamsLoad: medianLoad },
        update: { firstOpened, firstBP, perc, afCoverage, medianAfParamsLoad: medianLoad, syncedAt: new Date() },
      })
      synced++
    } catch (e) {
      console.error(`  Error on ${application} v${version} ${userType} ${dateTrunc}:`, e)
      errors++
    }
  }

  if (unmatchedApps.size > 0) {
    console.log(`\nUnmatched applications (${unmatchedApps.size}):`)
    for (const name of [...unmatchedApps].sort()) console.log(`  - ${name}`)
  }

  console.log(`\nDone — synced: ${synced}, skipped: ${skipped}, errors: ${errors}`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
