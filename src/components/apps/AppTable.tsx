"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlatformBadge } from "@/components/apps/PlatformBadge"
import { HealthStatusBadge } from "@/components/health/HealthStatusBadge"
import { SearchIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"

const categoryColors: Record<string, string> = {
  LIVESCORES: "bg-cyan-100 text-cyan-800 border-cyan-200",
  CASINO: "bg-pink-100 text-pink-800 border-pink-200",
  SPORTS: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OTHER: "bg-gray-100 text-gray-700 border-gray-200",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  DEPRECATED: "bg-orange-100 text-orange-800 border-orange-200",
  SUNSET: "bg-red-100 text-red-800 border-red-200",
  NOT_ACTIVE: "bg-blue-100 text-blue-800 border-blue-200",
}

interface AppRow {
  id: string
  name: string
  slug: string
  platform: string
  category: string
  status: string
  updatedAt: string
  _count: { markets: number }
  health: Array<{ status: string }>
}

type SortKey = "name" | "platform" | "category" | "status" | "markets" | "health" | "updatedAt"
type SortDir = "asc" | "desc"

interface AppTableProps {
  apps: AppRow[]
}

export function AppTable({ apps }: AppTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return apps.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.platform.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    )
  }, [apps, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "platform":
          cmp = a.platform.localeCompare(b.platform)
          break
        case "category":
          cmp = a.category.localeCompare(b.category)
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
        case "markets":
          cmp = a._count.markets - b._count.markets
          break
        case "health": {
          const ah = a.health?.[0]?.status ?? "UNKNOWN"
          const bh = b.health?.[0]?.status ?? "UNKNOWN"
          cmp = ah.localeCompare(bh)
          break
        }
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null
    return sortDir === "asc"
      ? <ChevronUpIcon className="inline size-3.5 ml-1" />
      : <ChevronDownIcon className="inline size-3.5 ml-1" />
  }

  function ColHead({ col, label }: { col: SortKey; label: string }) {
    return (
      <TableHead
        className="cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortIcon col={col} />
      </TableHead>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8"
          placeholder="Search apps…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
          No apps match your search.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <ColHead col="name" label="Name" />
                <ColHead col="platform" label="Platform" />
                <ColHead col="markets" label="Markets" />
                <ColHead col="status" label="Status" />
                <ColHead col="health" label="Health" />
                <ColHead col="updatedAt" label="Last Updated" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((app) => {
                const latestHealth = app.health?.[0]?.status ?? "UNKNOWN"
                return (
                  <TableRow key={app.id} className="group">
                    <TableCell>
                      <Link
                        href={`/apps/${app.slug}`}
                        className="font-medium hover:underline"
                      >
                        {app.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlatformBadge platform={app.platform} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app._count.markets}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[app.status] ?? ""}>
                        {app.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <HealthStatusBadge status={latestHealth} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(app.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
