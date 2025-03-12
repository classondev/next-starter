export const defaultLocale = 'en'
export const locales = ['en', 'vi', 'de'] as const
export type ValidLocale = typeof locales[number]

export const languageNames = {
  en: 'English',
  vi: 'Tiếng Việt',
  de: 'Deutsch'
}

export function isValidLocale(locale: string): locale is ValidLocale {
  return locales.includes(locale as ValidLocale)
} 