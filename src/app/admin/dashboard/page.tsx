"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Products",
    value: "2,345",
    icon: Package,
    description: "Active products in store",
  },
  {
    title: "Total Orders",
    value: "12,345",
    icon: ShoppingCart,
    description: "+180 from last month",
  },
  {
    title: "Active Users",
    value: "1,234",
    icon: Users,
    description: "+10% increase",
  },
  {
    title: "Revenue",
    value: "$123,456",
    icon: TrendingUp,
    description: "+20.1% from last month",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-3 space-y-3">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart will be implemented here
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Recent orders list will be implemented here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 