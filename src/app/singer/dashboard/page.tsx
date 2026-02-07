'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import SongManagement from '@/components/singer/SongManagement'
import PerformanceManagement from '@/components/singer/PerformanceManagement'
import BookingRequestsList from '@/components/singer/BookingRequestsList'
import SingerQRCard from '@/components/singer/SingerQRCard'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { syncUserProfile, getSinger, updateSingerProfile, getPerformances, updatePerformanceStatus } from '@/services/singer'
import { useLanguage } from '@/contexts/LanguageContext'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import FollowersList from '@/components/singer/FollowersList'

export default function SingerDashboard() {
    const { t } = useLanguage()
    const router = useRouter()
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()
    const [isSyncing, setIsSyncing] = useState(true)
    const [singerData, setSingerData] = useState<any>(null)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } })

    // Sync Clerk User to Prisma DB
    useEffect(() => {
        async function sync() {
            if (!user) return

            await syncUserProfile({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                fullName: user.fullName || user.username || 'Singer',
                imageUrl: user.imageUrl,
            })

            // Fetch fresh singer data
            const data = await getSinger(user.id)
            setSingerData(data)

            // Auto-detect live or scheduled-now performances
            const perfs = await getPerformances(user.id)
            const activeLive = perfs.find((p: any) => p.status === 'live')

            if (activeLive) {
                // Check if we purposefully exited
                const ignoreCheck = sessionStorage.getItem('ignore_resume_check')
                if (!ignoreCheck) {
                    setConfirmModal({
                        isOpen: true,
                        title: t('dashboard.alerts.resume_title'),
                        message: t('dashboard.alerts.resume_message').replace('{title}', activeLive.title),
                        onConfirm: () => {
                            router.push(`/singer/live?performanceId=${activeLive.id}`)
                            setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        }
                    })
                } else {
                    // Start mode button will still find it, so we just clear flag for next reload
                    sessionStorage.removeItem('ignore_resume_check')
                }
            }

            setIsSyncing(false)
        }

        if (isLoaded && user) {
            sync()
        } else if (isLoaded && !user) {
            router.push('/')
        }
    }, [user, isLoaded])

    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    useEffect(() => {
        setOrigin(window.location.origin)
        setCurrentTime(new Date())
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const [origin, setOrigin] = useState('')
    const [songsRefreshKey, setSongsRefreshKey] = useState(0)
    const triggerSongsRefresh = () => setSongsRefreshKey(prev => prev + 1)

    const [showLiveModal, setShowLiveModal] = useState(false)
    const [candidatePerformances, setCandidatePerformances] = useState<any[]>([])

    const handleStartMode = async () => {
        if (!singerId) return

        const perfs = await getPerformances(singerId)

        // 1. Check for active LIVE performance first
        const activeLive = perfs.find((p: any) => p.status === 'live')
        if (activeLive) {
            setConfirmModal({
                isOpen: true,
                title: t('dashboard.alerts.resume_title'),
                message: t('dashboard.alerts.resume_message').replace('{title}', activeLive.title),
                onConfirm: () => {
                    router.push(`/singer/live?performanceId=${activeLive.id}`)
                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                }
            })
            return
        }

        // 2. If no live, check scheduled
        const scheduled = perfs.filter((p: any) => p.status === 'scheduled')

        if (scheduled.length === 0) {
            setConfirmModal({
                isOpen: true,
                title: t('dashboard.alerts.no_schedule_title'),
                message: t('dashboard.alerts.no_schedule_message'),
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        // Sort by time
        scheduled.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

        if (scheduled.length === 1) {
            const p = scheduled[0]
            setConfirmModal({
                isOpen: true,
                title: t('dashboard.alerts.start_title'),
                message: t('dashboard.alerts.start_message').replace('{title}', p.title),
                onConfirm: async () => {
                    await updatePerformanceStatus(p.id, 'live')
                    router.push(`/singer/live?performanceId=${p.id}`)
                    setConfirmModal(prev => ({ ...prev, isOpen: false }))
                }
            })
        } else {
            setCandidatePerformances(scheduled)
            setShowLiveModal(true)
        }
    }

    if (!isLoaded || isSyncing) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black">{t('dashboard.loading')}</div>
    }

    if (!user) return null

    const singerId = user.id
    const qrValue = singerId ? `${origin}/singer/${singerId}` : ''
    const displayId = singerId ? `@${singerId.slice(0, 8)}` : '@...'

    return (
        <div className="min-h-screen bg-gray-50 text-black">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">{t('dashboard.title')}</h1>
                    <div className="flex items-center space-x-4">
                        {currentTime && (
                            <div className="hidden sm:block text-right mr-4">
                                <p className="text-sm font-bold text-indigo-600">{currentTime.toLocaleTimeString()}</p>
                                <p className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</p>
                            </div>
                        )}
                        <LanguageSwitcher />
                        <span className="text-sm text-gray-500">{t('dashboard.welcome')}{user.fullName}</span>
                        <button
                            onClick={handleLogout}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                        >
                            {t('dashboard.logout')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: QR & Status */}
                    <div className="space-y-8">
                        <SingerQRCard
                            singerId={singerId}
                            displayId={displayId}
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

                        <button
                            onClick={handleStartMode}
                            className="w-full py-4 text-lg font-bold rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg transform transition hover:scale-105"
                        >
                            {t('dashboard.start_mode')}
                        </button>
                    </div>

                    {/* Right Column: Management */}
                    <div className="space-y-8">
                        <FollowersList singerId={singerId} />
                        <SongManagement onSongsUpdated={triggerSongsRefresh} />
                        <PerformanceManagement refreshKey={songsRefreshKey} />
                        <BookingRequestsList userId={singerId} />
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Live Mode Selection Modal */}
            {
                showLiveModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl text-black">
                            <h3 className="text-xl font-bold mb-4">Select Performance to Start</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {candidatePerformances.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={async () => {
                                            await updatePerformanceStatus(p.id, 'live')
                                            router.push(`/singer/live?performanceId=${p.id}`)
                                        }}
                                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition"
                                    >
                                        <p className="font-bold text-lg text-indigo-900">{p.title}</p>
                                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                                            <span>{new Date(p.startTime).toLocaleDateString()}</span>
                                            <span>{new Date(p.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowLiveModal(false)}
                                className="mt-4 w-full py-3 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 text-gray-700 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
