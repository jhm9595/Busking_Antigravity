'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Play, BookOpen, Shield, Info, Mail, Lock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import GoogleAd from '@/components/common/GoogleAd'
import AppFooter from '@/components/common/AppFooter'

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
            // First setup demo data
            await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ensure' })
            })

            const form = document.createElement('form')
            form.method = 'POST'
            form.action = '/auth/demo'
            document.body.appendChild(form)
            form.submit()
        } catch (error) {
            console.error('Demo error:', error)
            setIsDemoLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col relative overflow-hidden bg-background text-foreground">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-primary/20 opacity-50" />

            <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
                <div className="text-center max-w-2xl">
                    <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        {t('home.title')}
                    </h1>
                    <p className="text-xl text-foreground/70 mb-8 whitespace-pre-line">
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

                    <div className="mt-8 rounded-3xl border border-border/70 bg-background/70 px-5 py-4 backdrop-blur-sm">
                        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
                            <Link href="/guides" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition border border-primary/20 shadow-sm">
                                <BookOpen className="w-4 h-4" />
                                {t('publicPages.landing.guides_trust')}
                            </Link>
                            <Link href="/about" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/80 text-foreground hover:bg-background transition border border-border shadow-sm backdrop-blur-sm">
                                <Info className="w-4 h-4" />
                                {t('publicPages.landing.about')}
                            </Link>
                            <Link href="/terms" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/80 text-foreground hover:bg-background transition border border-border shadow-sm backdrop-blur-sm">
                                <Shield className="w-4 h-4" />
                                {t('publicPages.landing.safety_legal')}
                            </Link>
                            <Link href="/privacy" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/80 text-foreground hover:bg-background transition border border-border shadow-sm backdrop-blur-sm">
                                <Lock className="w-4 h-4" />
                                {t('publicPages.landing.privacy')}
                            </Link>
                            <Link href="/contact" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/80 text-foreground hover:bg-background transition border border-border shadow-sm backdrop-blur-sm">
                                <Mail className="w-4 h-4" />
                                {t('publicPages.landing.contact')}
                            </Link>
                        </div>
                    </div>

                    <GoogleAd slot="home_hero_bottom" className="mt-20 opacity-50" />
                </div>
            </main>
            
            <AppFooter />
        </div>
    )
}
