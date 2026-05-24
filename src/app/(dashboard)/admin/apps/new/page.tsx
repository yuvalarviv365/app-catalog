"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchIcon, Loader2Icon, StoreIcon } from "lucide-react"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
}

interface DetectedMarket {
  id: string
  code: string
  name: string
  region: string
  flagEmoji: string | null
}

interface PlayStorePreview {
  title: string
  icon: string
  version: string
  releaseNotes: string
  score: number
  installs: string
  category: string
  availableMarkets: DetectedMarket[]
}

export default function NewAppPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Play Store import state
  const [importPkg, setImportPkg] = useState("")
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PlayStorePreview | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [platform, setPlatform] = useState("")
  const [category, setCategory] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [packageName, setPackageName] = useState("")
  const [detectedMarketIds, setDetectedMarketIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(slugify(value))
  }

  async function handleImport() {
    const pkg = importPkg.trim()
    if (!pkg) return
    setImporting(true)
    setImportError(null)
    setPreview(null)
    setDetectedMarketIds([])

    try {
      const res = await fetch(`/api/v1/sync/google-play/preview?packageName=${encodeURIComponent(pkg)}`)
      const data = await res.json()

      if (!res.ok) {
        setImportError(
          res.status === 409 && data.existingSlug
            ? `${data.error} — view it at /apps/${data.existingSlug}`
            : (data.error ?? "Failed to fetch from Play Store")
        )
        return
      }

      setPreview(data)
      setDetectedMarketIds((data.availableMarkets ?? []).map((m: DetectedMarket) => m.id))

      // Auto-populate form fields
      handleNameChange(data.title)
      setPackageName(pkg)
      setIconUrl(data.icon ?? "")
      if (data.category) setCategory(data.category)
      setPlatform("ANDROID")
    } catch {
      setImportError("Network error — could not reach Play Store")
    } finally {
      setImporting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/v1/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          platform,
          category,
          iconUrl: iconUrl || undefined,
          repositoryUrl: repositoryUrl || undefined,
          packageName: packageName || undefined,
          marketIds: detectedMarketIds.length > 0 ? detectedMarketIds : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        const fieldErrors = data.error?.fieldErrors
        if (fieldErrors) {
          const msgs = Object.values(fieldErrors).flat().join(", ")
          setError(msgs)
        } else {
          setError(data.error?.message ?? "Failed to create app.")
        }
        return
      }

      const app = await res.json()
      router.push(`/apps/${app.slug}`)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Play Store import card */}
      <Card className="border-dashed border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <StoreIcon className="size-4 text-green-600" />
            Import from Play Store
          </CardTitle>
          <CardDescription>
            Enter a package name to auto-fill app details and detect which markets it&apos;s available in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="com.company.appname"
              value={importPkg}
              onChange={(e) => setImportPkg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleImport())}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleImport}
              disabled={importing || !importPkg.trim()}
            >
              {importing ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SearchIcon className="size-4" />
              )}
              {importing ? "Fetching…" : "Fetch"}
            </Button>
          </div>

          {importing && (
            <p className="mt-2 text-xs text-muted-foreground animate-pulse">
              Fetching app info and checking market availability across all regions…
            </p>
          )}

          {importError && (
            <p className="mt-2 text-sm text-destructive">{importError}</p>
          )}

          {preview && (
            <div className="mt-3 flex flex-col gap-3">
              {/* App info row */}
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-3">
                {preview.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.icon}
                    alt={preview.title}
                    referrerPolicy="no-referrer"
                    className="size-12 rounded-xl shrink-0 object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{preview.title}</p>
                  <p className="text-xs text-muted-foreground">
                    v{preview.version}
                    {preview.score ? ` · ★ ${preview.score.toFixed(1)}` : ""}
                    {preview.installs ? ` · ${preview.installs} installs` : ""}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                    ✓ Form populated — review and submit below
                  </p>
                </div>
              </div>

              {/* Detected markets */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Markets detected ({preview.availableMarkets?.length ?? 0})
                </p>
                {preview.availableMarkets?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No markets found in our catalog for this app.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {preview.availableMarkets?.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {m.flagEmoji && <span>{m.flagEmoji}</span>}
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  These markets will be assigned automatically when the app is created.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main form */}
      <Card>
        <CardHeader>
          <CardTitle>New App</CardTitle>
          <CardDescription>Review details and create the app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My App"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">
                Slug
                <span className="ml-1 text-xs text-muted-foreground">(auto-generated)</span>
              </Label>
              <Input
                id="slug"
                placeholder="my-app"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the app…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v ?? "")}>
                <SelectTrigger id="platform" className="w-full">
                  <SelectValue placeholder="Select platform…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">Web</SelectItem>
                  <SelectItem value="IOS">iOS</SelectItem>
                  <SelectItem value="ANDROID">Android</SelectItem>
                  <SelectItem value="CROSS_PLATFORM">Cross-Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIVESCORES">Livescores</SelectItem>
                  <SelectItem value="CASINO">Casino</SelectItem>
                  <SelectItem value="SPORTS">Sports</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <div className="flex items-center gap-2">
                {iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconUrl}
                    alt="icon preview"
                    referrerPolicy="no-referrer"
                    className="size-10 rounded-xl shrink-0 object-cover border border-border"
                  />
                )}
                <Input
                  id="iconUrl"
                  type="url"
                  placeholder="https://cdn.example.com/icon.png"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repositoryUrl">Repository URL (optional)</Label>
              <Input
                id="repositoryUrl"
                type="url"
                placeholder="https://github.com/org/repo"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="packageName">
                Play Store Package Name
                <span className="ml-1 text-xs text-muted-foreground">(Android only, for sync)</span>
              </Label>
              <Input
                id="packageName"
                placeholder="com.yourcompany.appname"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
              {packageName && (
                <a
                  href={`https://play.google.com/store/apps/details?id=${packageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Preview on Play Store ↗
                </a>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create App"}
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
