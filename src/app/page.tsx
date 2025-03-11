import Link from "next/link"
import { ArrowRight, Code2, Database, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    name: "Modern Stack",
    description:
      "Built with Next.js 14, React, TypeScript, and Tailwind CSS for a modern development experience.",
    icon: Code2,
  },
  {
    name: "Authentication",
    description:
      "Secure authentication with NextAuth.js, supporting multiple providers and session management.",
    icon: Lock,
  },
  {
    name: "Database",
    description:
      "Type-safe database operations with Drizzle ORM and Turso for scalable data management.",
    icon: Database,
  },
]

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            A modern starter template for your Next.js project
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Build your next project with this starter template. Includes
            authentication, database, and modern UI components.
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link href="/docs">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/docs/components">Components</Link>
            </Button>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Features
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            This starter template includes everything you need to build your next
            project.
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative overflow-hidden rounded-lg border bg-background p-2"
            >
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <feature.icon className="h-12 w-12" />
                <div className="space-y-2">
                  <h3 className="font-bold">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
