'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import styles from './LanguageSwitcher.module.css'

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
        <div className={styles.container} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.trigger}
                title="Switch Language"
            >
                <Globe className={styles.icon} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.list}>
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code)
                                    setIsOpen(false)
                                }}
                                className={`${styles.item} ${language === lang.code ? styles.active : ''}`}
                            >
                                <span className={styles.itemContent}>
                                    <span className={styles.flag}>{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </span>
                                {language === lang.code && <ChevronDown className={styles.checkmark} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
