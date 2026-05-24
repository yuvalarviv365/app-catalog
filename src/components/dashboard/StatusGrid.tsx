import { HealthStatusBadge } from "@/components/health/HealthStatusBadge"
import Link from "next/link"

interface App {
  id: string
  name: string
  slug: string
}

interface Market {
  id: string
  code: string
  name: string
}

interface HealthEntry {
  appId: string
  marketCode: string | null
  status: string
}

interface StatusGridProps {
  apps: App[]
  markets: Market[]
  healthData: HealthEntry[]
}

export function StatusGrid({ apps, markets, healthData }: StatusGridProps) {
  function getStatus(appId: string, marketCode: string | null): string {
    const entry = healthData.find(
      (h) => h.appId === appId && h.marketCode === marketCode
    )
    return entry?.status ?? "UNKNOWN"
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
        No apps found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground">
              App
            </th>
            {markets.map((market) => (
              <th
                key={market.code}
                className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap"
              >
                {market.code}
              </th>
            ))}
            {markets.length === 0 && (
              <th className="px-3 py-3 text-center font-medium text-muted-foreground">
                Global
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {apps.map((app) => (
            <tr key={app.id} className="hover:bg-muted/30 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium hover:bg-muted/30">
                <Link href={`/apps/${app.slug}`} className="hover:underline text-foreground">
                  {app.name}
                </Link>
              </td>
              {markets.length > 0
                ? markets.map((market) => (
                    <td key={market.code} className="px-3 py-3 text-center">
                      <HealthStatusBadge status={getStatus(app.id, market.code)} />
                    </td>
                  ))
                : (
                  <td className="px-3 py-3 text-center">
                    <HealthStatusBadge status={getStatus(app.id, null)} />
                  </td>
                )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
