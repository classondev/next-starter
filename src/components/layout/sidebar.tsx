import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  BarChart,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  Building2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTranslation, TranslationPath } from '@/i18n/useTranslation';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  titleKey: TranslationPath;
  icon: LucideIcon;
  href: string;
}

const menuItems: MenuItem[] = [
  {
    titleKey: "nav.dashboard",
    icon: LayoutGrid,
    href: "/admin/dashboard",
  },
  {
    titleKey: "nav.products",
    icon: Package,
    href: "/admin/products",
  },
  {
    titleKey: "nav.orders",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    titleKey: "nav.analytics",
    icon: BarChart,
    href: "/admin/analytics",
  },
  {
    titleKey: "nav.users",
    icon: Users,
    href: "/admin/users",
  },
  {
    titleKey: "nav.content",
    icon: FileText,
    href: "/admin/content",
  },
  {
    titleKey: "nav.settings",
    icon: Settings,
    href: "/admin/settings",
  },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="flex h-14 items-center border-b px-2 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold text-sm">{t('nav.store')}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-1">
        <nav className="grid gap-0.5 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent" : "transparent",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{t(item.titleKey)}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t p-2">
        <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <>
              <div className="text-xs text-muted-foreground px-2">{t('nav.workspace')}</div>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm h-8">
                <Building2 className="h-4 w-4" />
                {t('nav.change')}
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            className={cn(
              "w-full justify-start gap-2 text-sm h-8",
              collapsed && "w-10 h-8 p-0"
            )}
          >
            <Star className="h-4 w-4" />
            {!collapsed && t('nav.upgrade')}
          </Button>
        </div>
      </div>
    </div>
  );
} 