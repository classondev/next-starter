'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { defaultLocale, ValidLocale, isValidLocale } from './settings'

type LanguageContextType = {
  locale: ValidLocale
  setLocale: (locale: ValidLocale) => void
}

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {}
})

export function useLanguage() {
  return useContext(LanguageContext)
}

type Props = {
  children: ReactNode
}

export function LanguageProvider({ children }: Props) {
  const [locale, setLocale] = useState<ValidLocale>(() => {
    if (typeof window === 'undefined') return defaultLocale
    
    const savedLocale = localStorage.getItem('locale')
    return savedLocale && isValidLocale(savedLocale) ? savedLocale : defaultLocale
  })

  const handleSetLocale = (newLocale: ValidLocale) => {
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LanguageContext.Provider>
  )
} 