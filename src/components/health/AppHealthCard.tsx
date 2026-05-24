"use client"

import Link from "next/link"
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, SettingsIcon } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

interface DayData {
  date: string
  perc: number
  firstOpened: number
  afCoverage: number | null
}

interface AppHealthCardProps {
  name: string
  slug: string
  iconUrl?: string | null
  category: string
  configured: boolean
  data: DayData[]
  latest: DayData | null
  trend: number | null
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  LIVESCORES: "from-cyan-500 to-blue-600",
  CASINO: "from-pink-500 to-rose-600",
  SPORTS: "from-emerald-500 to-green-600",
  OTHER: "from-slate-500 to-slate-700",
}

function bpColor(perc: number): string {
  if (perc >= 90) return "#16a34a"
  if (perc >= 75) return "#ca8a04"
  return "#dc2626"
}

function SparklineTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: DayData }> }) {
  if (!active || !payload?.length) return null
  const { value, payload: d } = payload[0]
  const label = d.date
    ? new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null
  return (
    <div className="rounded bg-background/95 border border-border px-2 py-1 text-xs shadow flex flex-col gap-0.5">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="font-semibold">{value.toFixed(1)}%</span>
    </div>
  )
}

export function AppHealthCard({
  name, slug, iconUrl, category, configured, data, latest, trend,
}: AppHealthCardProps) {
  const gradient = CATEGORY_GRADIENTS[category] ?? "from-slate-500 to-slate-700"
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <Link
      href={`/apps/${slug}?tab=health`}
      className="group rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* App icon */}
        <div className={`relative size-10 rounded-[22%] bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 overflow-hidden`}>
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-white font-bold text-sm">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate group-hover:underline decoration-1">{name}</p>
        </div>
      </div>

      {!configured ? (
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 pb-4 pt-2 flex-1 text-center">
          <SettingsIcon className="size-4 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">Not configured</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="px-4 pb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">BP %</p>
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: latest ? bpColor(latest.perc) : "#6b7280" }}
              >
                {latest ? latest.perc.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-muted-foreground ml-0.5">%</span>
            </div>
            {trend !== null && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium mb-1",
                trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {trend > 0
                  ? <TrendingUpIcon className="size-3.5" />
                  : trend < 0
                    ? <TrendingDownIcon className="size-3.5" />
                    : <MinusIcon className="size-3.5" />}
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </div>
            )}
          </div>

          {/* Sparkline */}
          {data.length > 1 ? (
            <div className="px-1 pb-3 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Tooltip content={<SparklineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="perc"
                    stroke={latest ? bpColor(latest.perc) : "#6b7280"}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-xs text-muted-foreground pb-3">
              Not enough data
            </div>
          )}

          {/* Footer stats */}
          <div className="border-t border-border px-4 py-2.5 flex justify-between text-xs text-muted-foreground bg-muted/30">
            <span>Users: <span className="text-foreground font-medium">{latest?.firstOpened?.toLocaleString() ?? "—"}</span></span>
            <span>AF: <span className="text-foreground font-medium">{latest?.afCoverage != null ? `${latest.afCoverage.toFixed(0)}%` : "—"}</span></span>
          </div>
        </>
      )}
    </Link>
  )
}
