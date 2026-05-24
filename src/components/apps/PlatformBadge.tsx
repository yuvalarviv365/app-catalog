import { Badge } from "@/components/ui/badge"
import { MonitorIcon, SmartphoneIcon, TabletSmartphoneIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Platform = "WEB" | "IOS" | "ANDROID" | "CROSS_PLATFORM"

const platformConfig: Record<Platform, { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }> = {
  WEB: {
    label: "Web",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    Icon: MonitorIcon,
  },
  IOS: {
    label: "iOS",
    className: "bg-slate-100 text-slate-800 border-slate-200",
    Icon: SmartphoneIcon,
  },
  ANDROID: {
    label: "Android",
    className: "bg-green-100 text-green-800 border-green-200",
    Icon: SmartphoneIcon,
  },
  CROSS_PLATFORM: {
    label: "Cross-Platform",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    Icon: TabletSmartphoneIcon,
  },
}

interface PlatformBadgeProps {
  platform: string
  className?: string
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config = platformConfig[(platform as Platform)] ?? {
    label: platform,
    className: "bg-gray-100 text-gray-700 border-gray-200",
    Icon: MonitorIcon,
  }
  const { Icon } = config
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
