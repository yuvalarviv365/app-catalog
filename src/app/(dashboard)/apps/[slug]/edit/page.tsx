"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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

export default function EditAppPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [platform, setPlatform] = useState("")
  const [category, setCategory] = useState("")
  const [appStatus, setAppStatus] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [packageName, setPackageName] = useState("")
  const [redashName, setRedashName] = useState("")

  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    fetch(`/api/v1/apps/${slug}`)
      .then((r) => r.json())
      .then((app) => {
        setName(app.name ?? "")
        setDescription(app.description ?? "")
        setPlatform(app.platform ?? "")
        setCategory(app.category ?? "")
        setAppStatus(app.status ?? "")
        setIconUrl(app.iconUrl ?? "")
        setRepositoryUrl(app.repositoryUrl ?? "")
        setPackageName(app.packageName ?? "")
        setRedashName(app.redashName ?? "")
        setLoading(false)
      })
      .catch(() => { setError("Failed to load app."); setLoading(false) })
  }, [slug])

  if (status === "loading" || loading) return null
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/apps/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          platform,
          category,
          status: appStatus,
          iconUrl: iconUrl || undefined,
          repositoryUrl: repositoryUrl || undefined,
          packageName: packageName || undefined,
          redashName: redashName || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error?.message ?? "Failed to save.")
        return
      }
      router.push(`/apps/${slug}`)
    } catch {
      setError("Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit App</CardTitle>
          <CardDescription>Update app details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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
              <Label htmlFor="appStatus">Status</Label>
              <Select value={appStatus} onValueChange={(v) => setAppStatus(v ?? "")}>
                <SelectTrigger id="appStatus" className="w-full">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="NOT_ACTIVE">Not Active</SelectItem>
                  <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                  <SelectItem value="SUNSET">Sunset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iconUrl">Icon URL (optional)</Label>
              <Input id="iconUrl" type="url" placeholder="https://..." value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repositoryUrl">Repository URL (optional)</Label>
              <Input id="repositoryUrl" type="url" placeholder="https://github.com/org/repo" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} />
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
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Preview on Play Store ↗
                </a>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="redashName">
                Redash App Name
                <span className="ml-1 text-xs text-muted-foreground">(for BP % monitoring)</span>
              </Label>
              <Input
                id="redashName"
                placeholder="e.g. BwinAustria-LS"
                value={redashName}
                onChange={(e) => setRedashName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must match exactly the <code className="font-mono bg-muted px-1 rounded">application</code> value in the Redash BP query.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
