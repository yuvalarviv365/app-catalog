import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PlusIcon, SmartphoneIcon, MonitorIcon, TabletIcon, LayersIcon } from "lucide-react"
import { AppsFilterBar } from "@/components/apps/AppsFilterBar"
import { Suspense } from "react"

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

const CATEGORY_GRADIENTS: Record<string, string> = {
  LIVESCORES: "from-cyan-500 to-blue-600",
  CASINO: "from-pink-500 to-rose-600",
  SPORTS: "from-emerald-500 to-green-600",
  OTHER: "from-slate-500 to-slate-700",
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  IOS: SmartphoneIcon,
  ANDROID: SmartphoneIcon,
  WEB: MonitorIcon,
  CROSS_PLATFORM: LayersIcon,
}

const CATEGORY_LABELS: Record<string, string> = {
  LIVESCORES: "Livescores",
  CASINO: "Casino",
  SPORTS: "Sports",
  OTHER: "Other",
}

interface AppData {
  id: string
  name: string
  slug: string
  platform: string
  category: string
  status: string
  iconUrl?: string | null
  _count: { markets: number }
}

interface Market {
  id: string
  code: string
  name: string
  flagEmoji: string | null
}

async function getApps(category?: string, marketCode?: string): Promise<AppData[]> {
  const params = new URLSearchParams()
  if (category && category !== "ALL") params.set("category", category)
  if (marketCode && marketCode !== "ALL") params.set("marketCode", marketCode)
  const res = await fetch(`${BASE}/api/v1/apps?${params}`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

async function getMarkets(): Promise<Market[]> {
  const res = await fetch(`${BASE}/api/v1/markets`, { cache: "no-store" })
  if (!res.ok) return []
  return res.json()
}

interface SearchParams {
  category?: string
  marketCode?: string
}

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { category = "ALL", marketCode = "ALL" } = params

  const [session, apps, markets] = await Promise.all([
    auth(),
    getApps(category, marketCode),
    getMarkets(),
  ])

  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === "ADMIN"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {apps.length} app{apps.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/admin/apps/bulk">
              <Button size="sm" variant="outline">
                <PlusIcon className="size-4" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/admin/apps/new">
              <Button size="sm">
                <PlusIcon className="size-4" />
                Add App
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filter bar — client component needs Suspense for useSearchParams */}
      <Suspense fallback={<div className="h-12 border-b border-border" />}>
        <AppsFilterBar
          markets={markets}
          category={category}
          marketCode={marketCode}
        />
      </Suspense>

      {/* App grid */}
      {apps.length === 0 ? (
        <div className="rounded-xl border border-border p-16 text-center text-muted-foreground">
          No apps match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {apps.map((app) => {
            const gradient = CATEGORY_GRADIENTS[app.category] ?? "from-slate-500 to-slate-700"
            const initials = app.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 3)
            const PlatformIcon = PLATFORM_ICONS[app.platform] ?? TabletIcon

            return (
              <Link key={app.id} href={`/apps/${app.slug}`} className="group flex flex-col gap-2">
                {/* App icon tile — wrapper allows dot to overflow the rounded tile */}
                <div className="relative rounded-[22%]">
                  <div className={`relative aspect-square rounded-[22%] bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden`}>
                    {app.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl tracking-tight drop-shadow-sm">
                        {initials}
                      </span>
                    )}
                    {/* Platform icon — bottom-left */}
                    <span className="absolute bottom-1.5 left-1.5 bg-black/30 rounded-md p-0.5">
                      <PlatformIcon className="size-3 text-white/90" />
                    </span>
                  </div>
                  {/* Availability dot — straddles bottom-right corner */}
                  <span
                    title={app._count.markets > 0 ? `Live in ${app._count.markets} market${app._count.markets !== 1 ? "s" : ""}` : "Not live in any market"}
                    className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 size-5 rounded-full border-[3px] border-white"
                    style={{ backgroundColor: app._count.markets > 0 ? "#22c55e" : "#ef4444" }}
                  />
                </div>

                {/* App info */}
                <div className="px-0.5">
                  <p className="text-xs font-medium leading-tight truncate group-hover:underline decoration-1">
                    {app.name}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
