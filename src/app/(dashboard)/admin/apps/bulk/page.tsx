"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  StoreIcon,
  PlusIcon,
  GlobeIcon,
} from "lucide-react"

type FetchStatus = "pending" | "fetching" | "done" | "error" | "exists"

interface AppEntry {
  packageName: string
  status: FetchStatus
  error?: string
  title?: string
  icon?: string
  version?: string
  category?: string
  score?: number
  storeReleasedAt?: string | null
  slug?: string
  created?: boolean
  existingSlug?: string
  markets?: number        // filled after market detection
}

function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
}

function parsePackageNames(raw: string): string[] {
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(s))
}

export default function BulkImportPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [input, setInput] = useState("")
  const [entries, setEntries] = useState<AppEntry[]>([])
  const [phase, setPhase] = useState<"input" | "fetching" | "review" | "creating" | "done" | "detecting">("input")
  const [detectingMsg, setDetectingMsg] = useState("")
  const [detectProgress, setDetectProgress] = useState({ done: 0, total: 0 })

  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === "ADMIN"

  if (status === "loading") return null
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  function updateEntry(packageName: string, patch: Partial<AppEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.packageName === packageName ? { ...e, ...patch } : e))
    )
  }

  async function fetchOne(packageName: string) {
    updateEntry(packageName, { status: "fetching" })
    try {
      const res = await fetch(
        `/api/v1/sync/google-play/preview?packageName=${encodeURIComponent(packageName)}&detectMarkets=false`
      )
      const data = await res.json()
      if (res.status === 409 && data.existingSlug) {
        updateEntry(packageName, { status: "exists", title: data.error, existingSlug: data.existingSlug })
        return
      }
      if (!res.ok) {
        updateEntry(packageName, { status: "error", error: data.error ?? "Failed" })
        return
      }
      updateEntry(packageName, {
        status: "done",
        title: data.title,
        icon: data.icon,
        version: data.version,
        category: data.category,
        score: data.score,
        storeReleasedAt: data.storeReleasedAt ?? null,
      })
    } catch {
      updateEntry(packageName, { status: "error", error: "Network error" })
    }
  }

  async function handleFetch() {
    const packages = parsePackageNames(input)
    if (packages.length === 0) return
    setEntries(packages.map((p) => ({ packageName: p, status: "pending" })))
    setPhase("fetching")
    for (const pkg of packages) {
      await fetchOne(pkg)
    }
    setPhase("review")
  }

  async function handleCreateAll() {
    setPhase("creating")
    const toCreate = entries.filter((e) => e.status === "done" && !e.created)

    for (const entry of toCreate) {
      try {
        const res = await fetch("/api/v1/apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: entry.title!,
            slug: slugify(entry.title!),
            platform: "ANDROID",
            category: entry.category ?? "OTHER",
            iconUrl: entry.icon,
            packageName: entry.packageName,
            storeReleasedAt: entry.storeReleasedAt ?? null,
          }),
        })
        if (res.ok) {
          const app = await res.json()
          updateEntry(entry.packageName, { created: true, slug: app.slug })
        } else {
          const data = await res.json()
          updateEntry(entry.packageName, { status: "error", error: data.error?.message ?? "Failed to create" })
        }
      } catch {
        updateEntry(entry.packageName, { status: "error", error: "Network error" })
      }
    }
    setPhase("done")
  }

  async function handleDetectMarkets() {
    const created = entries.filter((e) => e.created && e.slug)
    if (created.length === 0) return

    setPhase("detecting")
    setDetectProgress({ done: 0, total: created.length })

    const BATCH = 3
    let done = 0

    for (let i = 0; i < created.length; i += BATCH) {
      const batch = created.slice(i, i + BATCH)
      setDetectingMsg(batch.map((e) => e.title ?? e.packageName).join(", "))

      try {
        const res = await fetch("/api/v1/apps/detect-markets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs: batch.map((e) => e.slug) }),
        })
        const data = await res.json()
        for (const result of data.results ?? []) {
          const entry = entries.find((e) => e.slug === result.slug)
          if (entry) updateEntry(entry.packageName, { markets: result.markets ?? 0 })
        }
      } catch {
        // continue even if a batch fails
      }

      done += batch.length
      setDetectProgress({ done, total: created.length })
    }

    setDetectingMsg("")
    setPhase("done")
  }

  const fetchedOk = entries.filter((e) => e.status === "done")
  const fetchedErr = entries.filter((e) => e.status === "error")
  const alreadyExists = entries.filter((e) => e.status === "exists")
  const createdOk = entries.filter((e) => e.created)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Import from Play Store</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste package names (one per line). App info is fetched instantly — markets are detected in a separate step.
        </p>
      </div>

      {/* Input */}
      {phase === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <StoreIcon className="size-4 text-green-600" />
              Package Names
            </CardTitle>
            <CardDescription>One package name per line, e.g. com.company.app</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="packages">Package names</Label>
              <Textarea
                id="packages"
                placeholder={`com.company.app1\ncom.company.app2\ncom.company.app3`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {parsePackageNames(input).length} valid package name{parsePackageNames(input).length !== 1 ? "s" : ""} detected
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFetch} disabled={parsePackageNames(input).length === 0}>
                <StoreIcon className="size-4" />
                Fetch from Play Store
              </Button>
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {phase !== "input" && (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="font-medium">{entries.length} apps</span>
            {fetchedOk.length > 0 && <span className="text-green-700">{fetchedOk.length} fetched</span>}
            {alreadyExists.length > 0 && <span className="text-yellow-600">{alreadyExists.length} already imported</span>}
            {fetchedErr.length > 0 && <span className="text-red-600">{fetchedErr.length} failed</span>}
            {phase === "fetching" && (
              <span className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                <Loader2Icon className="size-3.5 animate-spin" />Fetching…
              </span>
            )}
            {phase === "done" && (
              <span className="text-green-700 ml-auto">✓ {createdOk.length} app{createdOk.length !== 1 ? "s" : ""} created</span>
            )}
            {phase === "detecting" && (
              <span className="flex items-center gap-1.5 text-muted-foreground ml-auto text-xs">
                <Loader2Icon className="size-3.5 animate-spin" />
                {detectProgress.done}/{detectProgress.total} apps
              </span>
            )}
          </div>

          {/* App rows */}
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {entries.map((entry) => (
              <div key={entry.packageName} className="flex items-center gap-3 px-4 py-3">
                {/* Icon */}
                <div className="shrink-0">
                  {entry.status === "fetching" || entry.status === "pending" ? (
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                      {entry.status === "fetching"
                        ? <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                        : <div className="size-2 rounded-full bg-muted-foreground/30" />}
                    </div>
                  ) : entry.status === "exists" ? (
                    <div className="size-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                      <CheckCircleIcon className="size-5 text-yellow-500" />
                    </div>
                  ) : entry.status === "error" ? (
                    <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <XCircleIcon className="size-5 text-red-500" />
                    </div>
                  ) : entry.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.icon} alt={entry.title} referrerPolicy="no-referrer"
                      className="size-10 rounded-xl object-cover" />
                  ) : (
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {entry.title?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{entry.title ?? entry.packageName}</p>
                    {entry.created && <CheckCircleIcon className="size-4 text-green-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{entry.packageName}</p>
                  {entry.status === "exists" && entry.existingSlug && (
                    <p className="mt-0.5 text-xs text-yellow-700">
                      Already imported — <a href={`/apps/${entry.existingSlug}`} className="underline">view app →</a>
                    </p>
                  )}
                  {entry.status === "error" && (
                    <p className="mt-0.5 text-xs text-red-500">{entry.error}</p>
                  )}
                  {entry.created && entry.slug && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <a href={`/apps/${entry.slug}`} className="text-xs text-blue-600 hover:underline">View app →</a>
                      {entry.markets !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GlobeIcon className="size-3" />
                          {entry.markets} market{entry.markets !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Version */}
                {entry.version && (
                  <span className="text-xs font-mono text-muted-foreground shrink-0">v{entry.version}</span>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          {phase === "review" && (
            <div className="flex gap-2">
              <Button onClick={handleCreateAll} disabled={fetchedOk.length === 0}>
                <PlusIcon className="size-4" />
                {fetchedOk.length > 0 ? `Create ${fetchedOk.length} App${fetchedOk.length !== 1 ? "s" : ""}` : "Nothing new to create"}
              </Button>
              <Button variant="outline" onClick={() => { setPhase("input"); setEntries([]) }}>Start Over</Button>
            </div>
          )}

          {phase === "creating" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />Creating apps…
            </div>
          )}

          {phase === "detecting" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate max-w-sm">Checking: {detectingMsg}</span>
                <span className="shrink-0 ml-2 font-medium">
                  {detectProgress.done} / {detectProgress.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${detectProgress.total ? (detectProgress.done / detectProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="flex gap-2">
              {createdOk.length > 0 && (
                <Button variant="outline" onClick={handleDetectMarkets}>
                  <GlobeIcon className="size-4" />
                  Detect Markets for All
                </Button>
              )}
              <Button onClick={() => router.push("/apps")}>View All Apps</Button>
              <Button variant="outline" onClick={() => { setPhase("input"); setEntries([]) }}>Import More</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
