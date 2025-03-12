"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/header"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminLayout } from "@/components/layout/admin-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
} 