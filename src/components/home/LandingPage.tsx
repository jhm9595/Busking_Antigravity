'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Play } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import GoogleAd from '@/components/common/GoogleAd'

interface LandingPageProps {
    userId: string | null
    isSinger?: boolean
}

export default function LandingPage({ userId, isSinger }: LandingPageProps) {
    const { t } = useLanguage()
    const [isDemoLoading, setIsDemoLoading] = useState(false)

    const handleTryDemo = async () => {
        if (isDemoLoading) return

        setIsDemoLoading(true)
        try {
            // POST to auth demo route which handles login + data setup + redirect
            const response = await fetch('/auth/demo', {
                method: 'POST',
                redirect: 'manual' // Don't follow redirect, handle it ourselves
            })
            
            // If we get a redirect response, navigate to the location
            if (response.status === 307 || response.status === 302) {
                const location = response.headers.get('Location')
                if (location) {
                    window.location.href = location
                    return
                }
            }
            
            // Fallback: navigate to dashboard
            window.location.href = '/singer/dashboard'
        } catch (error) {
            console.error('Demo error:', error)
            // Fallback: navigate to dashboard anyway
            window.location.href = '/singer/dashboard'
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-primary/20 opacity-50" />


            <div className="z-10 text-center max-w-2xl">
                <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
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
                        <>
                            <Link
                                href="/sign-in"
                                className="px-8 py-4 bg-primary rounded-full font-bold text-primary-foreground hover:opacity-90 transition shadow-lg"
                            >
                                {t('home.get_started')}
                            </Link>

                            <Link
                                href="/explore?demo=1"
                                onClick={(event) => {
                                    if (isDemoLoading) {
                                        event.preventDefault()
                                        return
                                    }
                                    event.preventDefault()
                                    handleTryDemo()
                                }}
                                aria-disabled={isDemoLoading}
                                aria-busy={isDemoLoading}
                                aria-live="polite"
                                className={`px-8 py-4 rounded-full font-bold border-2 border-primary text-primary transition shadow-lg inline-flex items-center gap-2 ${isDemoLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/10'}`}
                            >
                                {isDemoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                <span>{isDemoLoading ? t('home.try_demo_loading') : t('home.try_demo')}</span>
                            </Link>
                        </>
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
