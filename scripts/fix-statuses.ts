import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: "postgresql://yuvalarviv@localhost:5432/app_catalog" })
const prisma = new PrismaClient({ adapter })

async function main() {
  const result = await prisma.app.updateMany({
    where: { markets: { none: {} }, status: "ACTIVE" },
    data: { status: "NOT_ACTIVE" },
  })
  console.log(`Marked ${result.count} app(s) with no markets as NOT_ACTIVE`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
