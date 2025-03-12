'use client'

import { useCallback } from 'react'
import { defaultLocale, ValidLocale } from './settings'

// Import all locale files
import en from './locales/en.json'
import vi from './locales/vi.json'
import de from './locales/de.json'

const TRANSLATIONS = { en, vi, de }

export type TranslationKey = keyof typeof en
type NestedKeys<T> = T extends string ? [] : {
  [K in keyof T]: [K, ...NestedKeys<T[K]>]
}[keyof T]

type Join<T extends any[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F extends string
    ? F
    : never
  : T extends [infer F, ...infer R]
  ? F extends string
    ? R extends any[]
      ? `${F}${D}${Join<R, D> & string}`
      : never
    : never
  : string

export type TranslationPath = Join<NestedKeys<typeof en>, '.'>

export function useTranslation(locale: ValidLocale = defaultLocale) {
  const translations = TRANSLATIONS[locale]

  const t = useCallback((key: TranslationPath) => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }

    return value as string
  }, [translations])

  return { t }
} 