"use client"

import { useState } from "react"
import { RefreshCwIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type State = "idle" | "loading" | "success" | "error"

export function SyncButton() {
  const [state, setState] = useState<State>("idle")
  const [detail, setDetail] = useState<string>("")

  async function handleSync() {
    setState("loading")
    setDetail("")
    try {
      const res = await fetch("/api/v1/sync/bp", { method: "POST" })
      const json = await res.json() as {
        synced?: number; skipped?: number; total?: number; error?: string
      }
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      setDetail(`+${json.synced ?? 0} rows · ${json.total ?? "?"} processed`)
      setState("success")
      // Reset to idle after 4s
      setTimeout(() => setState("idle"), 4000)
    } catch (e) {
      setDetail(e instanceof Error ? e.message : "Unknown error")
      setState("error")
      setTimeout(() => setState("idle"), 5000)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={state === "loading"}
        className={cn(
          state === "success" && "border-emerald-300 text-emerald-700 hover:text-emerald-700",
          state === "error"   && "border-red-300 text-red-600 hover:text-red-600",
        )}
      >
        {state === "loading" && <RefreshCwIcon className="size-3.5 animate-spin" />}
        {state === "success" && <CheckIcon className="size-3.5" />}
        {state === "error"   && <AlertCircleIcon className="size-3.5" />}
        {state === "idle"    && <RefreshCwIcon className="size-3.5" />}
        {state === "loading" ? "Syncing…" : "Sync from Redash"}
      </Button>
      {detail && (
        <span className={cn(
          "text-xs",
          state === "success" ? "text-emerald-600" : "text-red-500"
        )}>
          {detail}
        </span>
      )}
    </div>
  )
}
