'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { Music, Clock, MessageSquare, Users, Share2, Shield, Calendar } from 'lucide-react'
import SongManagement from '@/components/singer/SongManagement'
import PerformanceManagement from '@/components/singer/PerformanceManagement'
import BookingRequestsList from '@/components/singer/BookingRequestsList'
import SingerQRCard from '@/components/singer/SingerQRCard'
import { syncUserProfile, getSinger, registerSinger, updateSingerProfile, getPerformances, updatePerformanceStatus, withdrawUser, updateNickname, getUserPoints, chargePoints } from '@/services/singer'
import { useLanguage } from '@/contexts/LanguageContext'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import FollowersList from '@/components/singer/FollowersList'
import ClockWidget from '@/components/common/ClockWidget'
import PointChargeModal from '@/components/common/PointChargeModal'
import GoogleAd from '@/components/common/GoogleAd'

export default function SingerDashboard() {
    const { t, language } = useLanguage()
    const router = useRouter()
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()
    const [isSyncing, setIsSyncing] = useState(true)
    const [isSinger, setIsSinger] = useState(false)
    const [singerData, setSingerData] = useState<any>(null)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } })
    const [songsRefreshKey, setSongsRefreshKey] = useState(0)
    const [origin, setOrigin] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [userPoints, setUserPoints] = useState(0)
    const [showChargeModal, setShowChargeModal] = useState(false)
    const [isStarting, setIsStarting] = useState(false)

    useEffect(() => {
        setOrigin(window.location.origin)
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (user?.id) {
            getUserPoints(user.id).then(setUserPoints)
        }
    }, [user?.id])

    const handleChargeTest = () => {
        setShowChargeModal(true)
    }

    const triggerSongsRefresh = () => setSongsRefreshKey(prev => prev + 1)

    const formatDateTime = () => {
        const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
        return {
            date: currentTime.toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : language, dateOptions),
            time: currentTime.toLocaleTimeString(language === 'zh-TW' ? 'zh-TW' : language, timeOptions)
        }
    }

    const { date, time } = formatDateTime()

    // ... (rest of the component logic until return)

    useEffect(() => {
        async function sync() {
            if (!user || !isLoaded) return

            try {
                // 1. Concurrent initial data fetch
                const [syncResult, initialPoints] = await Promise.all([
                    syncUserProfile({
                        id: user.id,
                        email: user.primaryEmailAddress?.emailAddress,
                        fullName: user.fullName || user.username || 'Singer',
                        imageUrl: user.imageUrl,
                    }),
                    getUserPoints(user.id)
                ])

                setUserPoints(initialPoints)

                // 2. Concurrent singer data and performances fetch
                const [data, perfs] = await Promise.all([
                    getSinger(user.id),
                    getPerformances(user.id)
                ])

                if (data) {
                    setSingerData(data)
                    setIsSinger(true)

                    // Auto-detect live performances for resume prompt
                    const activeLive = perfs.find((p: any) => p.status === 'live')

                    if (activeLive) {
                        const ignoreCheck = sessionStorage.getItem('ignore_resume_check')
                        if (!ignoreCheck) {
                            setConfirmModal({
                                isOpen: true,
                                title: t('dashboard.alerts.resume_title'),
                                message: t('dashboard.alerts.resume_message').replace('{title}', activeLive.title),
                                onConfirm: () => {
                                    sessionStorage.setItem('ignore_resume_check', 'true')
                                    router.push(`/singer/live?performanceId=${activeLive.id}`)
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                                }
                            })
                        }
                    }
                } else {
                    setIsSinger(false)
                }
            } catch (err) {
                console.error('Dashboard Sync Error:', err)
            } finally {
                setIsSyncing(false)
            }
        }

        if (isLoaded && user) {
            sync()
        } else if (isLoaded && !user) {
            router.push('/')
        }
    }, [user, isLoaded, t, router])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const handleStartMode = async () => {
        if (!user?.id || isStarting) return
        setIsStarting(true)
        try {
            const perfs = await getPerformances(user.id)
            const now = new Date()

        // 1. Check for active LIVE performance first (with time validation)
        const activeLive = perfs.find((p: any) => {
            if (p.status !== 'live') return false
            // Double-check: ensure still within time window
            const end = new Date(p.endTime!)
            return now <= end
        })
        if (activeLive) {
            router.push(`/singer/live?performanceId=${activeLive.id}`)
            return
        }

        // 2. If no active live, check scheduled (can start within 10 min)
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)
        const candidates = perfs.filter((p: any) => {
            if (p.status !== 'scheduled') return false
            const start = new Date(p.startTime)
            const end = new Date(p.endTime!)
            return (now >= start && now <= end) || (start > now && start <= tenMinutesFromNow)
        })

        if (candidates.length === 0) {
            setConfirmModal({
                isOpen: true,
                title: t('dashboard.alerts.no_schedule_title'),
                message: t('dashboard.alerts.no_schedule_message'),
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        // Sort by closest to now
        candidates.sort((a: any, b: any) => {
            const timeDiffA = Math.abs(new Date(a.startTime).getTime() - now.getTime())
            const timeDiffB = Math.abs(new Date(b.startTime).getTime() - now.getTime())
            return timeDiffA - timeDiffB
        })

        // Auto-start the closest one
        const best = candidates[0]
        await updatePerformanceStatus(best.id, 'live')
        router.push(`/singer/live?performanceId=${best.id}`)
        } finally {
            setIsStarting(false)
        }
    }

    if (!isLoaded || isSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-black italic tracking-widest text-xs uppercase animate-pulse">{t('dashboard.loading')}</p>
            </div>
        )
    }

    if (!isSinger) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-card border border-border p-10 rounded-[40px] text-center shadow-2xl">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                        <Users className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground italic mb-4">{t('dashboard.not_singer_title')}</h2>
                    <p className="text-foreground/70 mb-10 leading-relaxed font-bold italic">{t('dashboard.not_singer_desc')}</p>
                    <button
                        onClick={async () => {
                            const name = prompt(t('dashboard.onboarding_nickname_placeholder'))
                            if (name) {
                                const res = await registerSinger({ id: user!.id, stageName: name })
                                if (res.success) window.location.reload()
                                else alert(res.error === 'NICKNAME_DUPLICATE' ? t('dashboard.error_nickname_taken') : t('dashboard.error_registration_failed'))
                            }
                        }}
                        className="w-full bg-indigo-600 py-4 rounded-2xl font-black text-foreground shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                        {t('dashboard.onboarding_btn')}
                    </button>
                </div>
            </div>
        )
    }

    const singerId = user!.id
    const qrValue = `${origin}/singer/${singerId}`
    const displayId = `@${singerId.slice(0, 8)}`

    return (
        <div className="bg-background min-h-screen text-foreground font-display selection:bg-indigo-500/30 pb-20">
            <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-end gap-8 relative overflow-hidden p-10 rounded-[40px] bg-gradient-to-br from-indigo-600 to-purple-800 shadow-2xl shadow-indigo-600/20 border border-border group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-foreground/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse pointer-events-none" />
                    <div className="relative z-10 flex-1">
                        <div className="flex flex-col mb-6">
                            <div className="flex items-center gap-3 text-indigo-100/60 font-black italic uppercase tracking-[0.2em] text-xs mb-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{date}</span>
                            </div>
                            <div className="text-4xl font-mono font-black text-foreground/90 tracking-tighter leading-none">
                                {time}
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter leading-none mb-4 group-hover:scale-[1.01] transition-transform duration-500 pr-2">
                            {t('dashboard.welcome').replace('{name}', user?.fullName || user?.username || '')}
                        </h1>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 relative z-10 w-full md:w-auto">
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center px-4 py-3 md:px-6 md:py-0 bg-background/20 rounded-3xl border border-border backdrop-blur-md">
                            <span className="text-xs font-black text-indigo-200/50 uppercase tracking-widest md:mb-1">{t('common.points')}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xl md:text-2xl font-mono font-black text-amber-400">{userPoints.toLocaleString()}P</span>
                                <button onClick={() => setShowChargeModal(true)} className="text-xs bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all font-black uppercase whitespace-nowrap">
                                    {t('common.charge')}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleStartMode}
                            disabled={isStarting}
                            className="w-full md:w-auto bg-foreground text-background px-6 py-4 md:px-10 md:py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStarting ? (
                                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                            ) : (
                                <><Music className="w-5 h-5" /> {t('dashboard.start_mode')}</>
                            )}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 space-y-12">
                        <section className="bg-card rounded-[40px] border border-border p-2 overflow-hidden shadow-2xl">
                            <PerformanceManagement refreshKey={songsRefreshKey} />
                        </section>

                        <GoogleAd slot="singer_dashboard_mid" className="opacity-40" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <section className="bg-card rounded-[40px] border border-border p-8 shadow-2xl relative overflow-hidden group">
                                <div className="dark">
                                    <BookingRequestsList userId={singerId} />
                                </div>
                            </section>
                            <section className="bg-card rounded-[40px] border border-border p-8 shadow-2xl">
                                <FollowersList singerId={singerId} />
                            </section>
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-10">
                        <div className="sticky top-28 space-y-10">
                            <section className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[40px] border border-border p-2 backdrop-blur-md shadow-2xl">
                                <SingerQRCard
                                    singerId={singerId}
                                    displayId={displayId}
                                    nickname={singerData?.stageName}
                                    avatarUrl={singerData?.profile?.avatarUrl}
                                    qrValue={qrValue}
                                    socialLinks={singerData?.socialLinks ? JSON.parse(singerData.socialLinks) : {}}
                                    bio={singerData?.bio}
                                    hairColor={singerData?.hairColor}
                                    topColor={singerData?.topColor}
                                    bottomColor={singerData?.bottomColor}
                                    onUpdate={async () => {
                                        const data = await getSinger(singerId)
                                        setSingerData(data)
                                    }}
                                />
                            </section>

                            <section className="bg-card rounded-[40px] border border-border p-2 shadow-2xl overflow-hidden">
                                <SongManagement onSongsUpdated={triggerSongsRefresh} />
                            </section>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-border/50">
                    <button
                        onClick={() => {
                            setConfirmModal({
                                isOpen: true,
                                title: t('dashboard.withdraw_title'),
                                message: t('dashboard.withdraw_message'),
                                onConfirm: async () => {
                                    const res = await withdrawUser(user!.id)
                                    if (res.success) {
                                        await signOut()
                                        router.push('/')
                                    } else {
                                        alert(t('dashboard.error_withdrawal_failed'))
                                    }
                                }
                            })
                        }}
                        className="w-full py-4 text-xs font-black text-foreground/70 hover:text-red-500 transition-all uppercase tracking-widest border border-dashed border-border rounded-3xl"
                    >
                        {t('dashboard.withdraw_btn')}
                    </button>
                </div>
            </main>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => {
                    if (confirmModal.title === t('dashboard.alerts.resume_title')) {
                        sessionStorage.setItem('ignore_resume_check', 'true')
                    }
                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                }}
            />

            {user?.id && (
                <PointChargeModal
                    userId={user.id}
                    isOpen={showChargeModal}
                    onClose={() => setShowChargeModal(false)}
                    onSuccess={(newPoints) => setUserPoints(newPoints)}
                />
            )}
        </div>
    )
}
