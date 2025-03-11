import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  Users,
  FileText,
  BarChart3,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  {
    name: "Total Users",
    value: "2,350",
    change: "+12.3%",
    trend: "up",
    icon: Users,
  },
  {
    name: "Active Posts",
    value: "124",
    change: "+4.5%",
    trend: "up",
    icon: FileText,
  },
  {
    name: "Engagement Rate",
    value: "5.2%",
    change: "-0.4%",
    trend: "down",
    icon: BarChart3,
  },
]

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend === "up" ? ArrowUpIcon : ArrowDownIcon
          const trendColor = metric.trend === "up" ? "text-green-500" : "text-red-500"

          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center pt-1">
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                  <span className={`text-xs ${trendColor}`}>{metric.change}</span>
                  <ArrowRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 