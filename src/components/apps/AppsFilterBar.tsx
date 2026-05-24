"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface Market {
  id: string
  code: string
  name: string
  flagEmoji: string | null
}

interface AppsFilterBarProps {
  markets: Market[]
  category: string
  marketCode: string
}

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "LIVESCORES", label: "Livescores" },
  { value: "CASINO", label: "Casino" },
  { value: "SPORTS", label: "Sports" },
  { value: "OTHER", label: "Other" },
]

export function AppsFilterBar({ markets, category, marketCode }: AppsFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/apps?${params.toString()}`)
  }

  const selectClass =
    "h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer appearance-none bg-no-repeat"
  const wrapClass = "relative"
  const chevron = (
    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )

  return (
    <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border">
      {/* Market */}
      <div className={wrapClass}>
        <select
          value={marketCode}
          onChange={(e) => navigate("marketCode", e.target.value)}
          className={selectClass}
        >
          <option value="ALL">All Markets</option>
          {markets.map((m) => (
            <option key={m.code} value={m.code}>
              {m.flagEmoji ? `${m.flagEmoji} ${m.name}` : m.name}
            </option>
          ))}
        </select>
        {chevron}
      </div>
    </div>
  )
}
