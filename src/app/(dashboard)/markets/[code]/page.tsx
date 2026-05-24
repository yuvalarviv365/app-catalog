import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HealthStatusBadge } from "@/components/health/HealthStatusBadge"
import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { prisma } from "@/lib/prisma"

async function getMarket(code: string) {
  return prisma.market.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      apps: {
        include: {
          app: {
            include: {
              health: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  })
}

export default async function MarketDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const market = await getMarket(code)

  if (!market) notFound()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{market.flagEmoji ?? "🌐"}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{market.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-sm text-muted-foreground">{market.code}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{market.region}</span>
          </div>
        </div>
      </div>

      {/* Apps table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Apps in this market ({market.apps?.length ?? 0})
        </h2>

        {market.apps?.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
            No apps in this market.
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Market Status</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {market.apps?.map((am: {
                  status: string
                  app: {
                    id: string
                    name: string
                    slug: string
                    platform: string
                    health: Array<{ status: string }>
                  }
                }) => {
                  const latestHealth = am.app.health?.[0]?.status ?? "UNKNOWN"
                  return (
                    <TableRow key={am.app.id}>
                      <TableCell>
                        <Link
                          href={`/apps/${am.app.slug}`}
                          className="font-medium hover:underline"
                        >
                          {am.app.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlatformBadge platform={am.app.platform} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{am.status.replace("_", " ")}</span>
                      </TableCell>
                      <TableCell>
                        <HealthStatusBadge status={latestHealth} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
