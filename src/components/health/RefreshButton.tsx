"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleRefresh() {
    setState("loading")
    try {
      const res = await fetch("/api/v1/sync/bp-webhook", { method: "POST" })
      if (!res.ok) throw new Error("Webhook failed")
      setState("success")
      router.refresh()
      setTimeout(() => setState("idle"), 3000)
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={state === "loading"}>
      {state === "loading" ? (
        <RefreshCwIcon className="size-4 animate-spin" />
      ) : state === "success" ? (
        <CheckIcon className="size-4 text-green-600" />
      ) : state === "error" ? (
        <AlertCircleIcon className="size-4 text-red-500" />
      ) : (
        <RefreshCwIcon className="size-4" />
      )}
      {state === "loading" ? "Refreshing…" : state === "success" ? "Done" : state === "error" ? "Failed" : "Refresh"}
    </Button>
  )
}
