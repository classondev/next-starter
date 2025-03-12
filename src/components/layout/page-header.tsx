import { usePathname } from "next/navigation";

export function PageHeader() {
  const pathname = usePathname();
  const title = pathname
    ?.split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="flex h-14 items-center border-b px-4 bg-background">
      <h1 className="text-base font-medium capitalize">{title}</h1>
    </div>
  );
} 