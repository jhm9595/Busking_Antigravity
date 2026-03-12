'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { List, Map as MapIcon, LogOut, X, User as UserIcon, Home } from 'lucide-react'
import { getEffectiveStatus, formatLocalDate } from '@/utils/performance'
import { useClerk, useUser } from '@clerk/nextjs'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

// Dynamically import Map to avoid SSR issues with Leaflet
const BuskingMap = dynamic(() => import('@/components/audience/BuskingMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center italic text-sm text-gray-400">Loading...</div>
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

export default function ExplorePage() {
    const router = useRouter()
    const { signOut } = useClerk()
    const { user } = useUser()
    const { t } = useLanguage()
    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map')
    const [performances, setPerformances] = useState<Performance[]>([])
    const [showFollowingModal, setShowFollowingModal] = useState(false)
    const [followedSingers, setFollowedSingers] = useState<Singer[]>([])

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

    useEffect(() => {
        async function fetchPerformances() {
            try {
                let fanId = null
                if (typeof window !== 'undefined') {
                    fanId = user?.id || localStorage.getItem('busking_fan_id')
                }
                const res = await fetch(`/api/performances${fanId ? `?fanId=${fanId}` : ''}`)
                if (res.ok) {
                    const data = await res.json()
                    setPerformances(data)
                }
            } catch (error) {
                console.error('Failed to fetch performances', error)
            }
        }
        fetchPerformances()
    }, [user])

    const handleLogout = async () => {
        await signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <div className="h-screen flex flex-col bg-white text-black overflow-hidden">
            <header className="flex justify-between items-center p-3 md:p-4 border-b bg-white z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 shadow-sm" title={t('common.home_button')}>
                        <Home className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg md:text-2xl font-black text-indigo-700 truncate hidden sm:block uppercase italic tracking-tighter">{t('home.explore_title')}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-1.5 md:p-2 rounded-md flex items-center text-xs md:text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <MapIcon className="w-4 h-4 md:w-5 md:h-5 md:mr-1" /> <span className="hidden md:inline">{t('home.view_map')}</span>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 md:p-2 rounded-md flex items-center text-xs md:text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <List className="w-4 h-4 md:w-5 md:h-5 md:mr-1" /> <span className="hidden md:inline">{t('home.view_list')}</span>
                        </button>
                    </div>
                    <button
                        onClick={fetchFollowing}
                        className="px-2 py-1.5 md:px-4 md:py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs md:text-sm font-black transition-all hover:bg-indigo-100 shadow-sm uppercase italic"
                    >
                        {t('home.following_btn')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 md:px-3 md:py-2 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center text-gray-600 transition-all active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden bg-gray-50">
                {viewMode === 'map' ? (
                    <div className="h-full w-full">
                        <BuskingMap performances={performances} isLoggedIn={!!user} />
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto custom-scrollbar">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {performances.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30 italic">
                                    <List className="w-12 h-12 mb-4" />
                                    <p className="text-center font-bold">{t('home.no_performances')}</p>
                                </div>
                            ) : (
                                performances.map((perf) => {
                                    const isLive = getEffectiveStatus(perf) === 'live'
                                    return (
                                        <div key={perf.id} className={`group border rounded-[24px] p-5 hover:shadow-2xl transition-all bg-white block cursor-pointer relative overflow-hidden ${perf.isFollowed ? 'border-indigo-200 shadow-lg shadow-indigo-500/5' : 'border-gray-100 shadow-sm'}`} onClick={() => router.push(`/singer/${perf.singerId}`)}>
                                            {perf.isFollowed && (
                                                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg">
                                                    {t('common.following')}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${isLive ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {isLive ? t('live.status_live') : t('home.status_scheduled')}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 font-mono">
                                                    {formatLocalDate(perf.startTime)}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-xl mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors truncate uppercase italic">{perf.title}</h3>
                                            <p className="text-gray-500 text-xs mb-6 flex items-center gap-1.5 font-medium italic">
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                {perf.locationText}
                                            </p>
                                            <button className="w-full py-3.5 bg-gray-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 shadow-xl italic">
                                                {t('home.view_details')}
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Following Modal */}
            {showFollowingModal && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-white/10">
                        <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50">
                            <h3 className="text-xl font-black text-indigo-900 uppercase italic tracking-tighter">{t('home.following_title')}</h3>
                            <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-white rounded-full transition-all active:scale-90">
                                <X className="w-5 h-5 text-indigo-900" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {followedSingers.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 italic">
                                    <UserIcon className="w-12 h-12 mb-4 text-indigo-900" />
                                    <p className="text-sm font-bold text-indigo-900">{t('home.following_empty')}</p>
                                </div>
                            ) : (
                                followedSingers.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            router.push(`/singer/${s.id}`)
                                            setShowFollowingModal(false)
                                        }}
                                        className="flex items-center p-4 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all duration-300 group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                                            {s.profile?.avatarUrl ? (
                                                <img src={s.profile.avatarUrl} alt={s.stageName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black text-indigo-600">{s.stageName[0]}</span>
                                            )}
                                        </div>
                                        <span className="font-black text-gray-900 uppercase italic text-sm">{s.stageName}</span>
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
