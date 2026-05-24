"use client"

import { useState, useEffect } from "react"
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

interface App {
  id: string
  name: string
  slug: string
}

export default function NewReleasePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [apps, setApps] = useState<App[]>([])
  const [selectedAppSlug, setSelectedAppSlug] = useState("")
  const [version, setVersion] = useState("")
  const [platform, setPlatform] = useState("")
  const [releaseType, setReleaseType] = useState("")
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0])
  const [releaseNotes, setReleaseNotes] = useState("")
  const [storeUrl, setStoreUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/v1/apps")
      .then((r) => r.json())
      .then(setApps)
      .catch(() => {})
  }, [])

  const user = session?.user as { role?: string } | undefined
  const canCreate = user?.role === "ADMIN" || user?.role === "PM"

  if (status === "loading") return null
  if (!canCreate) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">You do not have permission to create releases.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAppSlug) {
      setError("Please select an app.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/v1/apps/${selectedAppSlug}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          platform,
          releaseType,
          releaseDate,
          releaseNotes: releaseNotes || undefined,
          storeUrl: storeUrl || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.message ?? "Failed to create release.")
        return
      }

      router.push("/releases")
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
          <CardTitle>New Release</CardTitle>
          <CardDescription>Log a new release for an app</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="app">App</Label>
              <Select value={selectedAppSlug} onValueChange={(v) => setSelectedAppSlug(v ?? "")}>
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
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g. 1.2.3"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
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
              <Label htmlFor="releaseType">Release Type</Label>
              <Select value={releaseType} onValueChange={(v) => setReleaseType(v ?? "")}>
                <SelectTrigger id="releaseType" className="w-full">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="PATCH">Patch</SelectItem>
                  <SelectItem value="HOTFIX">Hotfix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="releaseNotes">Release Notes</Label>
              <Textarea
                id="releaseNotes"
                placeholder="What changed in this release…"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="storeUrl">Store URL (optional)</Label>
              <Input
                id="storeUrl"
                type="url"
                placeholder="https://apps.apple.com/…"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Release"}
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
