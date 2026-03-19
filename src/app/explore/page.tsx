'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { List, Map as MapIcon, LogOut, X, User as UserIcon, Compass } from 'lucide-react'
import { getEffectiveStatus } from '@/utils/performance'
import { useClerk, useUser } from '@clerk/nextjs'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import GoogleAd from '@/components/common/GoogleAd'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DemoBanner } from '@/components/explore/DemoBanner'

// Dynamically import Map to avoid SSR issues with Leaflet
const BuskingMap = dynamic(() => import('@/components/audience/BuskingMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center italic text-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>Loading...</div>
})

interface Performance {
    id: string
    title: string
    locationText: string
    locationLat: number | null
    locationLng: number | null
    startTime: string
    status: string
    chatEnabled: boolean
    singerId: string
    isFollowed?: boolean
}

interface Singer {
    id: string
    stageName: string
    profile: {
        avatarUrl: string | null
    }
}

function formatKstLabel(date: string) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Seoul',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
    }).format(new Date(date))
}

export default function ExplorePage() {
    const router = useRouter()
    const { signOut } = useClerk()
    const { user } = useUser()
    const { t } = useLanguage()
    const isAuthenticated = !!user
    const bootstrapAttemptedRef = useRef(false)

    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
    const [performances, setPerformances] = useState<Performance[]>([])
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followedSingers, setFollowedSingers] = useState<Singer[]>([])
    const [requestedDemo, setRequestedDemo] = useState(false)
    const [showDemoBanner, setShowDemoBanner] = useState(false)
    const [isDemoResetting, setIsDemoResetting] = useState(false)
    const [isBootstrappingDemo, setIsBootstrappingDemo] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const isDemoRequested = new URLSearchParams(window.location.search).get('demo') === '1'
        setRequestedDemo(isDemoRequested)
        setShowDemoBanner((prev) => prev || isDemoRequested)
    }, [])

    const fetchFollowing = async () => {
        if (typeof window === 'undefined') return
        const fanId = user?.id || localStorage.getItem('busking_fan_id')
        if (!fanId) return
        try {
            const res = await fetch(`/api/fans/${fanId}/following`)
            if (res.ok) {
                const data = await res.json()
                setFollowedSingers(data)
                setShowFollowingModal(true)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const fetchPerformances = useCallback(async () => {
        try {
            let fanId = null
            if (typeof window !== 'undefined') {
                fanId = user?.id || localStorage.getItem('busking_fan_id')
            }
            const res = await fetch(`/api/performances${fanId ? `?fanId=${fanId}` : ''}`)
            if (!res.ok) {
                return []
            }
            const data = await res.json()
            setPerformances(data)
            return data
        } catch (error) {
            console.error('Failed to fetch performances', error)
            return []
        }
    }, [user])

    useEffect(() => {
        fetchPerformances()
    }, [fetchPerformances])

    useEffect(() => {
        if (!isAuthenticated && requestedDemo) {
            setShowDemoBanner(true)
        }
    }, [isAuthenticated, requestedDemo])

    useEffect(() => {
        if (isAuthenticated) {
            bootstrapAttemptedRef.current = false
            setShowDemoBanner(false)
            return
        }

        if (!requestedDemo && performances.length > 0) {
            return
        }

        if (!requestedDemo && bootstrapAttemptedRef.current) {
            return
        }

        bootstrapAttemptedRef.current = true

        const bootstrapDemo = async () => {
            setIsBootstrappingDemo(true)
            try {
                const res = await fetch('/api/demo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'ensure' })
                })

                if (res.ok) {
                    setShowDemoBanner(true)
                    await fetchPerformances()
                }
            } catch (error) {
                console.error('Failed to bootstrap demo mode', error)
            } finally {
                setIsBootstrappingDemo(false)
            }
        }

        bootstrapDemo()
    }, [isAuthenticated, requestedDemo, performances.length, fetchPerformances])

    const handleResetDemo = async () => {
        if (isDemoResetting) return

        setIsDemoResetting(true)
        try {
            const res = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
            })

            if (!res.ok) {
                const body = await res.json().catch(() => null)
                throw new Error(body?.error || 'Failed to reset demo data')
            }

            setShowDemoBanner(true)
            await fetchPerformances()
            if (!requestedDemo) {
                router.replace('/explore?demo=1')
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset demo data'
            alert(message)
        } finally {
            setIsDemoResetting(false)
        }
    }

    const handleLogout = async () => {
        await signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
            <header className="w-full border-b bg-background z-10 shadow-sm shrink-0">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Link href="/" className="p-2.5 rounded-xl bg-accent text-muted hover:bg-accent/80 transition-all active:scale-95 shadow-sm" title={t('common.home_button')}>
                            <Compass className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg md:text-2xl font-black text-primary truncate uppercase italic tracking-tighter">{t('home.explore_title')}</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        <div className="flex bg-accent rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-lg flex items-center text-xs md:text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-card shadow text-primary' : 'text-muted'}`}
                            >
                                <MapIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-1" /> <span className="hidden md:inline">{t('home.view_map')}</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg flex items-center text-xs md:text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-card shadow text-primary' : 'text-muted'}`}
                            >
                                <List className="w-4 h-4 md:w-5 md:h-5 md:mr-1" /> <span className="hidden md:inline">{t('home.view_list')}</span>
                            </button>
                        </div>
                        <button
                            onClick={fetchFollowing}
                            className="px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs md:text-sm font-black transition-all hover:bg-primary/20 shadow-sm uppercase italic"
                        >
                            {t('home.following_btn')}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 md:px-3 md:py-2 border border-border rounded-xl hover:bg-accent flex items-center text-muted transition-all active:scale-95 shadow-sm"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden bg-gray-50">
                {!isAuthenticated && showDemoBanner && (
                    <div className="absolute left-3 right-3 top-3 z-20 md:left-6 md:right-6 md:top-4">
                        <DemoBanner
                            isResetting={isDemoResetting || isBootstrappingDemo}
                            onReset={handleResetDemo}
                            onDismiss={() => setShowDemoBanner(false)}
                        />
                    </div>
                )}
                {viewMode === 'map' ? (
                    <div className="h-full w-full">
                        <BuskingMap performances={performances} isLoggedIn={!!user} />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto py-6 md:py-10 px-4 md:px-6 custom-scrollbar">
                        <div className="max-w-7xl mx-auto">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {performances.length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30 italic">
                                        <List className="w-12 h-12 mb-4" />
                                        <p className="text-center font-bold">{t('home.no_performances')}</p>
                                    </div>
                                ) : (
                                    performances.map((perf) => {
                                        const isLive = getEffectiveStatus(perf) === 'live'
                                        return (
                                            <div key={perf.id} className={`group border rounded-[24px] p-5 hover:shadow-2xl transition-all bg-card block cursor-pointer relative overflow-hidden ${perf.isFollowed ? 'border-primary/20 shadow-lg shadow-primary/5' : 'border-border shadow-sm'}`} onClick={() => router.push(`/singer/${perf.singerId}`)}>
                                                {perf.isFollowed && (
                                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl text-[11px] font-black uppercase tracking-widest italic shadow-lg">
                                                        {t('common.following')}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${isLive ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' : 'bg-primary/10 text-primary'}`}>
                                                        {isLive ? t('live.status_live') : t('home.status_scheduled')}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-muted font-mono">
                                                        {formatKstLabel(perf.startTime)}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-xl mb-2 text-foreground group-hover:text-primary transition-colors truncate uppercase italic">{perf.title}</h3>
                                                <p className="text-muted-foreground text-xs mb-6 flex items-center gap-1.5 font-medium italic">
                                                    <span className="w-1 h-1 bg-muted/30 rounded-full" />
                                                    {perf.locationText}
                                                </p>
                                                <button className="w-full py-3.5 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-xl italic">
                                                    {t('home.view_details')}
                                                </button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <GoogleAd slot="explore_grid_bottom" className="mt-12" />
                        </div>
                    </div>
                )}
            </main>

            {/* Following Modal */}
            {showFollowingModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-border">
                        <div className="p-6 border-b flex justify-between items-center bg-primary/5">
                            <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">{t('home.following_title')}</h3>
                            <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-accent rounded-full transition-all active:scale-90">
                                <X className="w-5 h-5 text-primary" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {followedSingers.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 italic">
                                    <UserIcon className="w-12 h-12 mb-4 text-primary" />
                                    <p className="text-sm font-bold text-primary">{t('home.following_empty')}</p>
                                </div>
                            ) : (
                                followedSingers.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            router.push(`/singer/${s.id}`)
                                            setShowFollowingModal(false)
                                        }}
                                        className="flex items-center p-4 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 overflow-hidden border-2 border-background shadow-md group-hover:scale-110 transition-transform">
                                            {s.profile?.avatarUrl ? (
                                                <img src={s.profile.avatarUrl} alt={s.stageName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black text-primary">{s.stageName[0]}</span>
                                            )}
                                        </div>
                                        <span className="font-black text-foreground uppercase italic text-sm">{s.stageName}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
