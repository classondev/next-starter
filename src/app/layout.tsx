import type { Metadata } from "next";
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"
import { LanguageProvider } from '@/i18n/LanguageProvider'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Product Management",
  description: "A simple product management system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <Providers>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main className="container px-2">{children}</main>
              <Toaster />
            </ThemeProvider>
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  )
}
