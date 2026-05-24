"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const USER_TYPES = [
  { label: "Organic", value: "Organic" },
  { label: "UA", value: "UA" },
] as const

export function UserTypeToggle({ current }: { current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "Organic") {
      params.delete("userType")
    } else {
      params.set("userType", value)
    }
    router.push(`/health?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm">
      {USER_TYPES.map((ut) => (
        <button
          key={ut.value}
          onClick={() => select(ut.value)}
          className={cn(
            "px-3 py-1.5 transition-colors",
            current === ut.value
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          {ut.label}
        </button>
      ))}
    </div>
  )
}
