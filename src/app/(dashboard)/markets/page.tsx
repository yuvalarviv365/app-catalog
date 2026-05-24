import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Market {
  id: string
  code: string
  name: string
  region: string
  flagEmoji: string | null
  _count: { apps: number }
}

async function getMarkets(): Promise<Market[]> {
  return prisma.market.findMany({
    include: { _count: { select: { apps: true } } },
    orderBy: { name: "asc" },
  })
}

export default async function MarketsPage() {
  const markets = await getMarkets()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {markets.length} market{markets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          No markets found.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Flag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Apps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {markets.map((market) => (
                <TableRow key={market.id}>
                  <TableCell className="text-xl">{market.flagEmoji ?? "🌐"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/markets/${market.code}`}
                      className="font-medium hover:underline"
                    >
                      {market.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {market.code}
                  </TableCell>
                  <TableCell className="text-sm">{market.region}</TableCell>
                  <TableCell className="text-right text-sm">{market._count.apps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
