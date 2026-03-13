'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import GoogleAd from '@/components/common/GoogleAd'

interface LandingPageProps {
    userId: string | null
    isSinger?: boolean
}

export default function LandingPage({ userId, isSinger }: LandingPageProps) {
    const { t } = useLanguage()

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-primary/20 opacity-50" />


            <div className="z-10 text-center max-w-2xl">
                <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                    {t('home.title')}
                </h1>
                <p className="text-xl text-foreground/70 mb-10 whitespace-pre-line">
                    {t('home.subtitle')}
                </p>

                <div className="flex justify-center gap-4 flex-wrap">
                    {userId ? (
                        <Link
                            href="/singer/dashboard"
                            className="px-8 py-4 bg-primary rounded-full font-bold text-primary-foreground hover:opacity-90 transition shadow-lg"
                        >
                            {isSinger ? t('home.dashboard_button') : t('home.start_busking')}
                        </Link>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="px-8 py-4 bg-primary rounded-full font-bold text-primary-foreground hover:opacity-90 transition shadow-lg"
                        >
                            {t('home.get_started')}
                        </Link>
                    )}

                    <Link
                        href="/explore"
                        className="px-8 py-4 bg-background/50 rounded-full font-bold text-foreground hover:bg-background/80 transition border border-border backdrop-blur-sm"
                    >
                        {t('home.explore_button')}
                    </Link>
                </div>

                <GoogleAd slot="home_hero_bottom" className="mt-20 opacity-50" />
            </div>
        </main>
    )
}
