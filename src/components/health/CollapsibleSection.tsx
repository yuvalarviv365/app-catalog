"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

export function CollapsibleSection({ title, count, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-col gap-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide w-fit hover:text-foreground transition-colors"
      >
        {open
          ? <ChevronDownIcon className="size-4" />
          : <ChevronRightIcon className="size-4" />}
        {title}
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-muted-foreground">
          {count}
        </span>
      </button>

      {open && children}
    </section>
  )
}
