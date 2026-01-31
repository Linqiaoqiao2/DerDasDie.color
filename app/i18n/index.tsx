'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { en } from './translations/en'
import { de } from './translations/de'
import { zh } from './translations/zh'

const translations = { en, de, zh }
const LanguageContext = createContext<any>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState('en')

  useEffect(() => {
    setLang(localStorage.getItem('lang') || navigator.language.slice(0, 2) || 'en')
  }, [])

  const setLanguage = (lang: string) => {
    setLang(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language as 'en'] || translations.en }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

export const interpolate = (s: string, v: Record<string, any>) => 
  s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')
