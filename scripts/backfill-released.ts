import gplay from "google-play-scraper"
import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: "postgresql://yuvalarviv@localhost:5432/app_catalog" })
const prisma = new PrismaClient({ adapter })

async function main() {
  const apps = await prisma.app.findMany({
    where: { packageName: { not: null }, storeReleasedAt: null },
    select: { id: true, name: true, packageName: true },
  }) as { id: string; name: string; packageName: string }[]

  console.log(`Backfilling storeReleasedAt for ${apps.length} apps...\n`)

  for (const app of apps) {
    try {
      const timeout = new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 12000))
      const data = await Promise.race([
        gplay.app({ appId: app.packageName, throttle: 10 }),
        timeout,
      ]) as { released?: string }

      if (data.released) {
        const date = new Date(data.released)
        await prisma.app.update({ where: { id: app.id }, data: { storeReleasedAt: date } })
        console.log(`✓ ${app.name}: ${data.released}`)
      } else {
        console.log(`- ${app.name}: no released field`)
      }
    } catch (e) {
      console.log(`✗ ${app.name}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log("\nDone!")
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
