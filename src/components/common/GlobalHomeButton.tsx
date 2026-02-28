'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function GlobalHomeButton() {
    const { t } = useLanguage()

    return (
        <Link
            href="/"
            className="fixed top-4 left-4 z-50 flex items-center justify-center p-3 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-all duration-300 hover:scale-110"
            title={t('common.home_button')}
            aria-label={t('common.home_button')}
        >
            <Home className="w-6 h-6" />
        </Link>
    )
}
