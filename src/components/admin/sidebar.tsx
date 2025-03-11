"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Content",
    href: "/admin/content",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar({ open, onOpenChange }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform lg:static",
        !open && "-translate-x-full lg:translate-x-0 lg:w-20"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2 font-semibold",
            !open && "lg:justify-center"
          )}
        >
          <LayoutDashboard className="h-6 w-6" />
          {open && <span>Admin Panel</span>}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                !open && "lg:justify-center lg:px-2"
              )}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                {open && <span className="ml-3">{item.name}</span>}
              </Link>
            </Button>
          )
        })}
      </nav>
    </aside>
  )
} 