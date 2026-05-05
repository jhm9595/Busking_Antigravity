'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { Music, Clock, MessageSquare, Users, Share2, Shield, Calendar, X } from 'lucide-react'
import SongManagement from '@/components/singer/SongManagement'
import PerformanceManagement from '@/components/singer/PerformanceManagement'
import BookingRequestsList from '@/components/singer/BookingRequestsList'
import SingerQRCard from '@/components/singer/SingerQRCard'
import { syncUserProfile, getSinger, registerSinger, updateSingerProfile, getPerformances, updatePerformanceStatus, withdrawUser, updateNickname, getUserPoints, chargePoints, updateTeamId, getTeamMembers } from '@/services/singer'
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })
    const [songsRefreshKey, setSongsRefreshKey] = useState(0)
    const [origin, setOrigin] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [userPoints, setUserPoints] = useState(0)
    const [showChargeModal, setShowChargeModal] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [teamMembers, setTeamMembers] = useState<any[]>([])

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

    useEffect(() => {
        if (!singerData?.teamId) {
            setTeamMembers([])
            return
        }
        getTeamMembers(singerData.teamId).then(setTeamMembers)
    }, [singerData?.teamId])

    const handleJoinTeam = async (teamId: string) => {
        if (!user?.id) return
        const res = await updateTeamId(user.id, teamId)
        if (res.success) {
            const data = await getSinger(user.id)
            setSingerData(data)
        }
    }

    const handleLeaveTeam = async () => {
        if (!user?.id) return
        const res = await updateTeamId(user.id, null)
        if (res.success) {
            const data = await getSinger(user.id)
            setSingerData(data)
        }
    }

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
            let perfs
            try {
                perfs = await getPerformances(user.id)
            } catch (err) {
                console.error('Failed to get performances:', err)
                alert('공연 정보를 가져오는데 실패했습니다.')
                return
            }
            
            if (!perfs || perfs.length === 0) {
                alert('예정된 공연이 없습니다. 먼저 공연을 예약해주세요.')
                return
            }
            
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
        try {
            const best = candidates[0]
            await updatePerformanceStatus(best.id, 'live')
            router.push(`/singer/live?performanceId=${best.id}`)
        } catch (err) {
            console.error('Failed to start performance:', err)
            alert('공연 시작에 실패했습니다. 다시 시도해주세요.')
        }
        } finally {
            setIsStarting(false)
        }
    }

    if (!isLoaded || isSyncing) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-black italic tracking-widest text-xs uppercase animate-pulse">{t('dashboard.loading')}</p>
            </div>
        )
    }

    if (!isSinger) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-card border border-border p-10 rounded-[40px] text-center shadow-2xl">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
                        <Users className="w-10 h-10 text-primary" />
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
                        className="w-full bg-primary py-4 rounded-2xl font-black text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
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
        <div className="bg-background min-h-screen text-foreground font-display selection:bg-primary/20 pb-20">
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 md:space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-end gap-6 md:gap-8 relative overflow-hidden p-6 md:p-10 rounded-[24px] md:rounded-[40px] bg-card shadow-lg border border-border group">
                    <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-[60px] md:blur-[100px] -mr-24 md:-mr-48 -mt-24 md:-mt-48 pointer-events-none" />
                    <div className="relative z-10 flex-1 w-full">
                        <div className="flex flex-col mb-4 md:mb-6">
                            <div className="flex items-center gap-2 md:gap-3 text-muted-foreground font-black italic uppercase tracking-[0.2em] text-[10px] md:text-xs mb-1 md:mb-2">
                                <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                <span>{date}</span>
                            </div>
                            <div className="text-3xl md:text-4xl font-mono font-black text-foreground tracking-tighter leading-none">
                                {time}
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-foreground italic tracking-tighter leading-none mb-2 md:mb-4 group-hover:scale-[1.01] transition-transform duration-500 pr-2">
                            {t('dashboard.welcome').replace('{name}', user?.fullName || user?.username || '')}
                        </h1>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 md:gap-4 relative z-10 w-full md:w-auto">
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center px-4 py-2 md:px-6 md:py-0 bg-muted/50 rounded-2xl md:rounded-3xl border border-border">
                            <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest md:mb-1">{t('common.points')}</span>
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-lg md:text-2xl font-mono font-black text-amber-500">{userPoints.toLocaleString()}P</span>
                                <button onClick={() => setShowChargeModal(true)} className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-amber-500/20 transition-all font-black uppercase whitespace-nowrap">
                                    {t('common.charge')}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleStartMode}
                            disabled={isStarting}
                            className="w-full md:w-auto bg-primary text-primary-foreground px-4 md:px-10 py-3 md:py-5 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 border border-border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStarting ? (
                                <div className="w-4 md:w-5 h-4 md:h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            ) : (
                                <><Music className="w-4 md:w-5 h-4 md:h-5" /> {t('dashboard.start_mode')}</>
                            )}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10">
                    <div className="xl:col-span-8 space-y-8 xl:space-y-12">
                        <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-2 overflow-hidden">
                            <PerformanceManagement refreshKey={songsRefreshKey} availablePoints={userPoints} />
                        </section>

                        <GoogleAd slot="singer_dashboard_mid" className="opacity-40" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 xl:gap-10">
                            <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-4 md:p-6 xl:p-8 relative overflow-hidden group">
                                <BookingRequestsList userId={singerId} />
                            </section>
                            <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-4 md:p-6 xl:p-8">
                                <FollowersList singerId={singerId} />
                            </section>
                        </div>
                    </div>

                    <div className="xl:col-span-4 space-y-10">
                        <div className="sticky top-28 space-y-10">
                            <section className="bg-primary/5 rounded-[40px] border border-border p-2 backdrop-blur-md shadow-2xl">
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

                            {/* Team Section */}
                            {singerData?.teamId ? (
                                <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-4 md:p-6 overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-black flex items-center gap-3">
                                            <Users className="w-6 h-6 text-primary" />
                                            <span>{t('dashboard.team.title')}</span>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{teamMembers.length}</span>
                                        </h2>
                                        <button 
                                            onClick={handleLeaveTeam}
                                            className="p-2 hover:bg-white/10 rounded-xl text-red-500 transition-all"
                                            title={t('dashboard.team.leave')}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {teamMembers.map((member: any) => (
                                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {(member.stageName || 'T').charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{member.stageName}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{member.fanCount} fans</p>
                                                </div>
                                            </div>
                                        ))}
                                        {teamMembers.length === 0 && (
                                            <p className="text-center text-sm text-gray-500 py-4">{t('dashboard.team.empty')}</p>
                                        )}
                                    </div>
                                </section>
                            ) : (
                                <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-4 md:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Users className="w-6 h-6 text-primary" />
                                        <h2 className="text-xl font-black">{t('dashboard.team.join_title')}</h2>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{t('dashboard.team.join_desc')}</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder={t('dashboard.team.team_id_placeholder')}
                                            className="flex-1 px-3 py-2 rounded-xl border border-border bg-white/5 text-sm"
                                            id="teamIdInput"
                                        />
                                        <button 
                                            onClick={() => {
                                                const input = document.getElementById('teamIdInput') as HTMLInputElement
                                                if (input?.value) handleJoinTeam(input.value)
                                            }}
                                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                                        >
                                            {t('dashboard.team.join_btn')}
                                        </button>
                                    </div>
                                </section>
                            )}

                            <section className="bg-card rounded-2xl xl:rounded-[40px] border border-border p-2 overflow-hidden">
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
