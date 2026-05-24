"use client"

import { useEffect, useState, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import { format, parseISO } from "date-fns"
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon, AlertCircleIcon, SettingsIcon, ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

type UserType = "Organic" | "UA"

interface DayData {
  date: string
  firstOpened: number
  firstBP: number
  perc: number
  afCoverage: number | null
  medianAfLoad: number | null
}

interface BPResponse {
  configured: boolean
  redashName?: string
  userType?: string
  version?: string
  versions?: string[]
  data: DayData[]
  latest: DayData | null
  trend: number | null
  syncedAt: string | null
}

const RANGE_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
]

const USER_TYPES: { label: string; value: UserType }[] = [
  { label: "Organic", value: "Organic" },
  { label: "UA", value: "UA" },
]

function KpiCard({
  label, value, suffix = "%", trend, sub, color,
}: {
  label: string; value: number | null | undefined
  suffix?: string; trend?: number | null; sub?: string; color?: string
}) {
  const hasValue = value !== null && value !== undefined
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold tabular-nums" style={color ? { color } : undefined}>
          {hasValue ? value!.toFixed(1) : "—"}
        </span>
        {hasValue && <span className="text-lg text-muted-foreground mb-0.5">{suffix}</span>}
      </div>
      {trend !== null && trend !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-muted-foreground"
        )}>
          {trend > 0 ? <TrendingUpIcon className="size-3.5" />
            : trend < 0 ? <TrendingDownIcon className="size-3.5" />
            : <MinusIcon className="size-3.5" />}
          {trend > 0 ? "+" : ""}{trend.toFixed(1)}% vs prev day
        </div>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label ?? ""}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value.toFixed(1)}%</span>
        </p>
      ))}
    </div>
  )
}

export function BPHealthTab({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  const [data, setData]         = useState<BPResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [days, setDays]         = useState(14)
  const [userType, setUserType] = useState<UserType>("Organic")
  const [version, setVersion]   = useState<string>("all")
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/apps/${slug}/health/bp?days=${days}&userType=${userType}&version=${version}`
      )
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const j = await res.json() as { error?: string }; if (j.error) msg += `: ${j.error}` } catch {}
        throw new Error(msg)
      }
      const json = await res.json() as BPResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [slug, days, userType, version])

  useEffect(() => { load() }, [load])

  // Reset version to "all" whenever userType or days changes
  // (versions available may differ per user type / range)
  const handleUserTypeChange = (ut: UserType) => {
    setVersion("all")
    setUserType(ut)
  }
  const handleDaysChange = (d: number) => {
    setVersion("all")
    setDays(d)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading health data…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-destructive text-sm">
        <AlertCircleIcon className="size-4" />
        {error}
      </div>
    )
  }

  if (!data?.configured) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="rounded-full bg-muted p-4">
          <SettingsIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">BP monitoring not configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set the Redash app name to start tracking BP %.
          </p>
        </div>
        {isAdmin && (
          <Link href={`/apps/${slug}/edit`}>
            <Button size="sm" variant="outline">Configure in Edit App</Button>
          </Link>
        )}
      </div>
    )
  }

  const availableVersions = data.versions ?? []

  const chartData = data.data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }))

  const avgBP = data.data.length > 0
    ? data.data.reduce((s, d) => s + d.perc, 0) / data.data.length
    : null

  const versionLabel = version === "all"
    ? `All versions (${availableVersions.length})`
    : `v${version}`

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Redash: <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">{data.redashName}</code>
          </h2>
          {data.syncedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last synced {format(new Date(data.syncedAt), "MMM d, HH:mm")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* User Type toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {USER_TYPES.map((ut) => (
              <button
                key={ut.value}
                onClick={() => handleUserTypeChange(ut.value)}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  userType === ut.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {ut.label}
              </button>
            ))}
          </div>

          {/* Version dropdown — only shown when versions are available */}
          {availableVersions.length > 0 && (
            <div className="relative">
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer appearance-none"
              >
                <option value="all">All versions ({availableVersions.length})</option>
                {availableVersions.map((v) => (
                  <option key={v} value={v}>v{v}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>
          )}

          {/* Range selector */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.days}
                onClick={() => handleDaysChange(o.days)}
                className={cn(
                  "px-3 py-1.5 transition-colors",
                  days === o.days
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCwIcon className={cn("size-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="BP % (latest day)"
          value={data.latest?.perc}
          trend={data.trend}
          color={
            data.latest?.perc === undefined ? undefined
            : data.latest.perc >= 90 ? "#16a34a"
            : data.latest.perc >= 75 ? "#ca8a04"
            : "#dc2626"
          }
        />
        <KpiCard
          label="AF Coverage (latest day)"
          value={data.latest?.afCoverage}
          sub={`Avg over ${days}d: ${avgBP !== null ? avgBP.toFixed(1) + "%" : "—"}`}
        />
        <KpiCard
          label="Median AF Load"
          value={data.latest?.medianAfLoad}
          suffix="s"
          sub={`Users opened: ${data.latest?.firstOpened ?? "—"}`}
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">
            BP % — last {days} days · {userType} · {versionLabel}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[
                  (min: number) => Math.max(0, Math.floor(min - 5)),
                  (max: number) => Math.min(100, Math.ceil(max + 5)),
                ]}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              {avgBP !== null && (
                <ReferenceLine
                  y={avgBP}
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  label={{ value: `avg ${avgBP.toFixed(1)}%`, position: "insideTopRight", fontSize: 10, fill: "#9ca3af" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="perc"
                name="BP %"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          No data for {userType} users{version !== "all" ? ` · v${version}` : ""} in this range.
        </div>
      )}

      {/* Data table */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Users Opened</th>
                <th className="px-4 py-2.5 text-right font-medium">Saw BP</th>
                <th className="px-4 py-2.5 text-right font-medium">BP %</th>
                <th className="px-4 py-2.5 text-right font-medium">AF Coverage</th>
                <th className="px-4 py-2.5 text-right font-medium">AF Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...chartData].reverse().map((row) => (
                <tr key={row.date} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium">
                    {format(parseISO(row.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.firstOpened.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.firstBP.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                    <span className={cn(
                      row.perc >= 90 ? "text-emerald-600"
                      : row.perc >= 75 ? "text-yellow-600"
                      : "text-red-500"
                    )}>
                      {row.perc.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.afCoverage !== null ? `${row.afCoverage.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {row.medianAfLoad !== null ? `${row.medianAfLoad.toFixed(2)}s` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
