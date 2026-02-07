'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface LandingPageProps {
    userId: string | null
}

export default function LandingPage({ userId }: LandingPageProps) {
    const { t } = useLanguage()

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 opacity-50" />

            <div className="z-10 text-center max-w-2xl">
                <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    {t('home.title')}
                </h1>
                <p className="text-xl text-gray-300 mb-10 whitespace-pre-line">
                    {t('home.subtitle')}
                </p>

                <div className="flex justify-center gap-4 flex-wrap">
                    {userId ? (
                        <Link
                            href="/singer/dashboard"
                            className="px-8 py-4 bg-indigo-600 rounded-full font-bold text-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30"
                        >
                            {t('home.dashboard_button')}
                        </Link>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="px-8 py-4 bg-indigo-600 rounded-full font-bold text-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30"
                        >
                            {t('home.get_started')}
                        </Link>
                    )}

                    <Link
                        href="/explore"
                        className="px-8 py-4 bg-white/10 rounded-full font-bold text-lg hover:bg-white/20 transition border border-white/10 backdrop-blur-sm"
                    >
                        {t('home.explore_button')}
                    </Link>
                </div>
            </div>
        </main>
    )
}
