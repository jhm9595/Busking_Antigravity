'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en } from '@/locales/en'
import { ko } from '@/locales/ko'
import { zh } from '@/locales/zh'
import { ja } from '@/locales/ja'

type Language = 'en' | 'ko' | 'zh' | 'ja'
type LocaleData = typeof en

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')
    const [localeData, setLocaleData] = useState<LocaleData>(en)

    useEffect(() => {
        // Load preference from local storage if available
        const savedLang = localStorage.getItem('app-language') as Language
        if (savedLang && ['en', 'ko', 'zh', 'ja'].includes(savedLang)) {
            setLanguage(savedLang)
        } else {
            // Detect browser language
            const browserLang = navigator.language.split('-')[0]
            if (browserLang === 'ko') {
                setLanguage('ko')
            } else if (browserLang === 'zh') {
                setLanguage('zh')
            } else if (browserLang === 'ja') {
                setLanguage('ja')
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('app-language', language)
        switch (language) {
            case 'ko':
                setLocaleData(ko)
                break
            case 'zh':
                setLocaleData(zh)
                break
            case 'ja':
                setLocaleData(ja)
                break
            default:
                setLocaleData(en)
        }
    }, [language])

    // Helper to get nested object value by string path (e.g. "performance.form.title")
    const t = (path: string): string => {
        const keys = path.split('.')
        let current: any = localeData
        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Missing translation key: ${path}`)
                return path
            }
            current = current[key]
        }
        return current as string
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
