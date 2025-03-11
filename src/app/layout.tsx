import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"

import { Header } from "@/components/header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Next.js Starter",
  description: "A modern Next.js starter template",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="container py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
