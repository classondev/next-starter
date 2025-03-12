'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/i18n/LanguageProvider'
import { languageNames, locales, ValidLocale } from '@/i18n/settings'
import { useTranslation } from '@/i18n/useTranslation'

// Language icons mapping
const languageIcons: Record<string, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  vi: '🇻🇳',
}

export function SettingsMenu() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLanguage()
  const { t } = useTranslation(locale)

  console.log('Current locale:', locale)
  console.log('Available locales:', locales)
  console.log('Language names:', languageNames)

  const handleLanguageChange = (newLocale: ValidLocale) => {
    console.log('Changing language to:', newLocale)
    setLocale(newLocale)
    console.log('Language changed, new locale:', newLocale)
  }

  const handleThemeChange = (newTheme: string) => {
    console.log('Changing theme to:', newTheme)
    setTheme(newTheme)
  }

  console.log('Rendering SettingsMenu with theme:', theme)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel>{t('settings.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="font-normal">
          {t('settings.language')} ({languageIcons[locale]})
        </DropdownMenuLabel>
        {locales.map((loc) => {
          console.log('Rendering language option:', loc)
          return (
            <DropdownMenuItem
              key={loc}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLanguageChange(loc)
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{languageIcons[loc]}</span>
                  <span>{languageNames[loc]}</span>
                </div>
                {locale === loc && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </div>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="font-normal">
          {t('settings.theme')}
        </DropdownMenuLabel>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('settings.light')}</span>
            {theme === 'light' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('settings.dark')}</span>
            {theme === 'dark' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('settings.system')}</span>
            {theme === 'system' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 