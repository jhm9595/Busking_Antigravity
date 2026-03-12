'use client'
import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect } from 'react'

export function LanguageHandler({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()

  useEffect(() => {
    if (typeof document !== 'undefined' && language) {
      document.documentElement.lang = language
    }
  }, [language])

  return <>{children}</>
}
