'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { List, ListFilter, Map as MapIcon, LogOut, X, User as UserIcon, Radio, Calendar } from 'lucide-react'
import { getEffectiveStatus } from '@/utils/performance'
import { useClerk, useUser } from '@clerk/nextjs'
import { useLanguage } from '@/contexts/LanguageContext'
import GoogleAd from '@/components/common/GoogleAd'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { DemoBanner } from '@/components/explore/DemoBanner'

// Dynamically import Map to avoid SSR issues with Leaflet
const BuskingMap = dynamic(() => import('@/components/audience/BuskingMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center italic text-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>Loading...</div>
})

interface Singer {
    id: string
    stageName: string
    profile?: {
        avatarUrl?: string | null
    }
}

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
    singer?: Singer
    isFollowed?: boolean
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

    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled'>('live')
    const [performances, setPerformances] = useState<Performance[]>([])
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followedSingers, setFollowedSingers] = useState<Singer[]>([])
    const [requestedDemo, setRequestedDemo] = useState(false)
    const [showDemoBanner, setShowDemoBanner] = useState(false)
    const [isDemoResetting, setIsDemoResetting] = useState(false)

    // Load filter preference from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return
        const savedFilter = localStorage.getItem('explore_status_filter') as 'all' | 'live' | 'scheduled' | null
        if (savedFilter) {
            setStatusFilter(savedFilter)
        }
    }, [])

    // Save filter preference to localStorage when changed
    useEffect(() => {
        if (typeof window === 'undefined') return
        localStorage.setItem('explore_status_filter', statusFilter)
    }, [statusFilter])

    useEffect(() => {
        document.title = `${t('home.explore_title')} | miniMic`
    }, [t])

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

    // Demo mode is only activated via "Try Demo" button on landing page (via ?demo=1 query param)
    // No auto-bootstrap for anonymous users on explore page

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

    // Filter performances based on status filter
    const filteredPerformances = performances.filter((perf) => {
        const status = getEffectiveStatus(perf)
        if (statusFilter === 'all') return true
        if (statusFilter === 'live') return status === 'live'
        if (statusFilter === 'scheduled') return status === 'scheduled'
        return true
    })

    return (
        <>
        <title>{`${t('home.explore_title')} | miniMic`}</title>
        <div className="h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
            <header className="w-full border-b bg-background z-10 shadow-sm shrink-0">
                <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:py-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center min-w-0">
                        <h1 className="text-base md:text-2xl font-black text-primary truncate uppercase tracking-tighter min-w-0">{t('home.explore_title')}</h1>
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="p-2 h-11 w-11 flex items-center justify-center border border-border rounded-xl hover:bg-accent text-muted transition-all active:scale-95 shrink-0"
                                title="Logout"
                                aria-label="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="hidden md:flex items-center gap-2 text-xs text-muted opacity-60 shrink-0">
                                <span className="font-medium">{t('home.guest_notice')}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto">
                        {/* Status Filter Buttons */}
                        <div className="flex bg-accent rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => setStatusFilter('live')}
                                className={`h-11 px-2 md:px-3 flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all ${statusFilter === 'live' ? 'bg-red-600 text-white shadow' : 'text-muted hover:text-foreground'}`}
                                title={t('home.filter_live')}
                                aria-label={t('home.filter_live')}
                            >
                                <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" /><span className="hidden md:inline">{t('home.filter_live')}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('scheduled')}
                                className={`h-11 px-2 md:px-3 flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all ${statusFilter === 'scheduled' ? 'bg-primary text-white shadow' : 'text-muted hover:text-foreground'}`}
                                title={t('home.filter_scheduled')}
                                aria-label={t('home.filter_scheduled')}
                            >
                                <Calendar className="w-3.5 h-3.5 shrink-0" /><span className="hidden md:inline">{t('home.filter_scheduled')}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`h-11 px-2 md:px-3 flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-card shadow text-primary' : 'text-muted hover:text-foreground'}`}
                                title={t('home.filter_all')}
                                aria-label={t('home.filter_all')}
                            >
                                <ListFilter className="w-3.5 h-3.5 shrink-0" /><span className="hidden md:inline">{t('home.filter_all')}</span>
                            </button>
                        </div>
                        {/* View Mode Buttons */}
                        <div className="flex bg-accent rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`h-11 px-2 md:px-3 flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'map' ? 'bg-card shadow text-primary' : 'text-muted'}`}
                                title={t('home.view_map')}
                                aria-label={t('home.view_map')}
                            >
                                <MapIcon className="w-4 h-4 shrink-0" /><span className="hidden md:inline">{t('home.view_map')}</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`h-11 px-2 md:px-3 flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card shadow text-primary' : 'text-muted'}`}
                                title={t('home.view_list')}
                                aria-label={t('home.view_list')}
                            >
                                <List className="w-4 h-4 shrink-0" /><span className="hidden md:inline">{t('home.view_list')}</span>
                            </button>
                        </div>
                        {isAuthenticated && (
                            <button
                                onClick={fetchFollowing}
                                className="h-11 px-2 md:px-3 flex items-center justify-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-black transition-all hover:bg-primary/20 shadow-sm uppercase shrink-0"
                            >
                                <UserIcon className="w-4 h-4 shrink-0" /><span className="hidden md:inline">{t('home.following_btn')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative min-h-0 flex-1 w-full overflow-hidden bg-gray-50">
                {!isAuthenticated && showDemoBanner && (
                    <div className="absolute left-3 right-3 top-3 z-20 md:left-6 md:right-6 md:top-4">
                        <DemoBanner
                            isResetting={isDemoResetting}
                            onReset={handleResetDemo}
                            onDismiss={() => setShowDemoBanner(false)}
                        />
                    </div>
                )}
                {viewMode === 'map' ? (
                    <div className="absolute inset-0">
                        <BuskingMap 
                            performances={filteredPerformances} 
                            isLoggedIn={!!user}
                            filterMode={statusFilter}
                            onFilterModeChange={setStatusFilter}
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="py-6 md:py-10 px-4 md:px-6 flex-1">
                            <div className="max-w-7xl mx-auto">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredPerformances.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                                            <List className="w-12 h-12 mb-4" />
                                            <p className="text-center font-bold">{t('home.no_performances')}</p>
                                        </div>
                                    ) : (
                                        filteredPerformances.map((perf) => {
                                            const isLive = getEffectiveStatus(perf) === 'live'
                                            const singerName = perf.singer?.stageName || 'Unknown'
                                            const singerAvatar = perf.singer?.profile?.avatarUrl
                                            return (
                                                <div key={perf.id} className={`group border rounded-[24px] p-5 hover:shadow-2xl transition-all bg-card block cursor-pointer relative overflow-hidden ${perf.isFollowed ? 'border-primary/20 shadow-lg shadow-primary/5' : 'border-border shadow-sm'}`} onClick={() => router.push(`/singer/${perf.singerId}`)}>
                                                    {perf.isFollowed && (
                                                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl text-[11px] font-black uppercase tracking-widest shadow-lg">
                                                            {t('common.following')}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${isLive ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' : 'bg-primary/10 text-primary'}`}>
                                                            {isLive ? t('live.status_live') : t('home.status_scheduled')}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-muted font-mono">
                                                            {formatKstLabel(perf.startTime)}
                                                        </span>
                                                    </div>
                                                    {/* Singer info */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                                            {singerAvatar ? (
                                                                <img src={singerAvatar} alt={singerName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-black text-primary text-sm">{singerName[0]}</span>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide">{singerName}</span>
                                                    </div>
                                                    <h3 className="font-black text-lg mb-2 text-foreground group-hover:text-primary transition-colors truncate uppercase">{perf.title}</h3>
                                                    <p className="text-muted-foreground text-xs mb-4 flex items-center gap-1.5 font-medium">
                                                        <span className="w-1 h-1 bg-muted/30 rounded-full" />
                                                        {perf.locationText}
                                                    </p>
                                                    <button className="w-full py-3 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-xl">
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
                    </div>
                )}
            </main>

            {/* Following Modal */}
            {showFollowingModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-border">
                        <div className="p-6 border-b flex justify-between items-center bg-primary/5">
                            <h3 className="text-xl font-black text-primary uppercase tracking-tighter">{t('home.following_title')}</h3>
                            <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-accent rounded-full transition-all active:scale-90">
                                <X className="w-5 h-5 text-primary" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {followedSingers.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
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
                                        <span className="font-black text-foreground uppercase text-sm">{s.stageName}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    )
}
