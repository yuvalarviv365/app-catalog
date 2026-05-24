"use client"

import { useState } from "react"
import { RefreshCwIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SyncResult {
  synced: number
  newReleases: number
  errors: number
}

interface SyncButtonProps {
  /** If provided, syncs only this specific app's slug (shown on app detail page).
   *  If omitted, syncs all apps (shown on the releases page). */
  label?: string
}

export function SyncButton({ label = "Sync from Play Store" }: SyncButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [result, setResult] = useState<SyncResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSync() {
    setState("loading")
    setResult(null)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/v1/sync/google-play", {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "Sync failed")
      }

      setResult(data)
      setState("success")
      // Reset after 4s
      setTimeout(() => setState("idle"), 4000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setState("error")
      setTimeout(() => setState("idle"), 5000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <RefreshCwIcon className="size-4 animate-spin" />
        ) : state === "success" ? (
          <CheckIcon className="size-4 text-green-600" />
        ) : state === "error" ? (
          <AlertCircleIcon className="size-4 text-red-500" />
        ) : (
          <RefreshCwIcon className="size-4" />
        )}
        {label}
      </Button>

      {state === "success" && result && (
        <span className="text-sm text-muted-foreground">
          {result.newReleases > 0
            ? `✓ ${result.newReleases} new release${result.newReleases > 1 ? "s" : ""} detected`
            : "✓ All apps up to date"}
        </span>
      )}

      {state === "error" && errorMsg && (
        <span className="text-sm text-red-500">{errorMsg}</span>
      )}
    </div>
  )
}
