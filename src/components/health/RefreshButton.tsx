"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RefreshButton({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      if (isAdmin) {
        await fetch("/api/v1/sync/bp", { method: "POST" })
      }
    } finally {
      router.refresh()
      setTimeout(() => setLoading(false), 800)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
      <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
      Refresh
    </Button>
  )
}
