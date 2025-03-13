'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import { useLanguage } from '@/i18n/LanguageProvider'
import { languageNames, locales, ValidLocale } from '@/i18n/settings'
import { useTranslation } from '@/i18n/useTranslation'
import { Check } from 'lucide-react'

interface LanguageSwitcherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const languageIcons: Record<string, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  vi: '🇻🇳',
}

export function LanguageSwitcherModal({ open, onOpenChange }: LanguageSwitcherModalProps) {
  const { locale, setLocale } = useLanguage()
  const { t } = useTranslation(locale)

  const handleLanguageChange = (newLocale: ValidLocale) => {
    console.log('Changing language to:', newLocale)
    setLocale(newLocale)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.language')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {locales.map((loc) => (
              <Button
                key={loc}
                variant={locale === loc ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleLanguageChange(loc)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{languageIcons[loc]}</span>
                    <span>{languageNames[loc]}</span>
                  </div>
                  {locale === loc && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 