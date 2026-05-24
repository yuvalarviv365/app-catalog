import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutGridIcon, CheckCircleIcon, GlobeIcon } from "lucide-react"

interface SummaryCardsProps {
  total: number
  active: number
  marketCount: number
}

export function SummaryCards({ total, active, marketCount }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Apps",
      value: total,
      Icon: LayoutGridIcon,
      iconClass: "text-blue-600",
    },
    {
      label: "Active Apps",
      value: active,
      Icon: CheckCircleIcon,
      iconClass: "text-green-600",
    },
    {
      label: "Markets Covered",
      value: marketCount,
      Icon: GlobeIcon,
      iconClass: "text-indigo-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, Icon, iconClass }) => (
        <Card key={label}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`size-5 ${iconClass}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
