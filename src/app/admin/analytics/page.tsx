import { BarChart3, TrendingUp, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  {
    name: "Total Views",
    value: "45.2K",
    change: "+20.1%",
    icon: BarChart3,
  },
  {
    name: "Engagement Rate",
    value: "12.3%",
    change: "+4.3%",
    icon: TrendingUp,
  },
  {
    name: "Active Users",
    value: "1.2K",
    change: "+10.5%",
    icon: Users,
  },
]

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center pt-1">
                  <span className="text-xs text-green-500">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 