'use client'

import { usePathname } from 'next/navigation'
import { UserNav } from '@/components/user-nav'
import { SettingsMenu } from '@/components/settings-menu'
import { useLanguage } from '@/i18n/LanguageProvider'
import { useTranslation } from '@/i18n/useTranslation'

export function AdminHeader() {
  const pathname = usePathname()
  const { locale } = useLanguage()
  const { t } = useTranslation(locale)
  const pathSegment = pathname?.split('/').pop() || '';
  const title = pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1);

  return (
    <div className="border-b">
      <div className="flex h-12 items-center px-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-base font-medium">{title}</h2>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <SettingsMenu />
          <UserNav />
        </div>
      </div>
    </div>
  )
} 