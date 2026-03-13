'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'ko', label: '한국어', flag: '🇰🇷' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
        { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
    ] as const

    const currentLang = languages.find(l => l.code === language) || languages[0]

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 md:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-lg hover:bg-accent transition-all active:scale-95 touch-manipulation text-foreground"
                title="Switch Language"
            >
                <Globe className="w-5 h-5 md:w-4 md:h-4 text-primary" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="py-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code)
                                    setIsOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-5 py-3.5 md:px-4 md:py-2.5 text-base md:text-sm transition-colors ${
                                    language === lang.code 
                                        ? "bg-primary/10 text-primary font-bold" 
                                        : "text-foreground hover:bg-accent"
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="text-lg">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </span>
                                {language === lang.code && <ChevronDown className="w-5 h-5 md:w-4 md:h-4 rotate-180" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
