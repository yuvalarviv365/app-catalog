"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface App {
  id: string
  name: string
  slug: string
}

interface Market {
  id: string
  name: string
  code: string
}

export default function HealthReportPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [apps, setApps] = useState<App[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [selectedMarketId, setSelectedMarketId] = useState<string>("__global__")
  const [healthStatus, setHealthStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/apps").then((r) => r.json()),
      fetch("/api/v1/markets").then((r) => r.json()),
    ]).then(([appsData, marketsData]) => {
      setApps(appsData)
      setMarkets(marketsData)
    }).catch(() => {})
  }, [])

  const user = session?.user as { role?: string } | undefined
  const canCreate = user?.role === "ADMIN" || user?.role === "PM"

  if (status === "loading") return null
  if (!canCreate) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">You do not have permission to report health status.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedApp) {
      setError("Please select an app.")
      return
    }
    if (!healthStatus) {
      setError("Please select a status.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const body: Record<string, unknown> = {
        appId: selectedApp.id,
        status: healthStatus,
        notes: notes || undefined,
      }
      if (selectedMarketId && selectedMarketId !== "__global__") {
        body.marketId = selectedMarketId
      }

      const res = await fetch(`/api/v1/apps/${selectedApp.slug}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.message ?? "Failed to submit health report.")
        return
      }

      router.push("/")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Report Health Status</CardTitle>
          <CardDescription>Submit a health status update for an app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app">App</Label>
              <Select
                value={selectedApp?.slug ?? ""}
                onValueChange={(slug) => {
                  const app = apps.find((a) => a.slug === slug) ?? null
                  setSelectedApp(app)
                }}
              >
                <SelectTrigger id="app" className="w-full">
                  <SelectValue placeholder="Select an app…" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.slug} value={app.slug}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="market">Market (optional)</Label>
              <Select value={selectedMarketId} onValueChange={(v) => setSelectedMarketId(v ?? "")}>
                <SelectTrigger id="market" className="w-full">
                  <SelectValue placeholder="Global (all markets)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">Global (all markets)</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name} ({market.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v ?? "")}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEALTHY">Healthy</SelectItem>
                  <SelectItem value="DEGRADED">Degraded</SelectItem>
                  <SelectItem value="OUTAGE">Outage</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Describe the issue or update…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit Report"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
