"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  LayoutGridIcon,
  RocketIcon,
  ActivityIcon,
  PlusCircleIcon,
  GlobeIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", Icon: LayoutDashboardIcon },
  { label: "Apps", href: "/apps", Icon: LayoutGridIcon },
  { label: "Markets", href: "/markets", Icon: GlobeIcon },
  { label: "Releases", href: "/releases", Icon: RocketIcon },
  { label: "Health", href: "/health", Icon: ActivityIcon },
]

const adminNavItems: NavItem[] = [
  { label: "New App", href: "/admin/apps/new", Icon: PlusCircleIcon },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col w-60 shrink-0 h-full bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="font-semibold text-base tracking-tight">App Catalog</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </p>
            </div>
            {adminNavItems.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
