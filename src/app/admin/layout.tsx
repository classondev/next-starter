"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/header"
import { AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="relative flex min-h-screen">
      <AdminSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col">
        <AdminHeader open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
} 