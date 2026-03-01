'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import { getPerformanceById, createSongRequest } from '@/services/singer'
import AvatarCreator from '@/components/audience/AvatarCreator'
import { AvatarConfig } from '@/components/audience/PixelAvatar'
import SongRequestModal from '@/components/audience/SongRequestModal'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { Share2, Music, Clock, MessageCircle, X, Check, Play, Pause, Plus, List, GripVertical, Search, Archive, ChevronRight, MessageSquare, User as UserIcon, CalendarIcon, Home, Compass, Heart } from 'lucide-react'
import { createBookingRequest, getSinger } from '@/services/singer'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function AudienceLivePage() {
    const params = useParams()
    const performanceId = params.id as string
    const [performance, setPerformance] = useState<any>(null)
    const [username, setUsername] = useState('')

    const [userType, setUserType] = useState<'anon' | 'named'>('named')
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [singer, setSinger] = useState<any>(null)
    const [activeSocket, setActiveSocket] = useState<any>(null)
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('closed')
    const [viewingCount, setViewingCount] = useState(0)
    const [isFollowed, setIsFollowed] = useState(false)
    const { user, isLoaded } = useUser()
    const { t } = useLanguage()


    const refreshData = async () => {
        if (performanceId) {
            const p = await getPerformanceById(performanceId)
            setPerformance(p)
            if (p?.singerId) {
                const s = await getSinger(p.singerId)
                setSinger(s)

                // Check Follow Status
                let fanId = user?.id
                if (!fanId) {
                    const storedFanId = localStorage.getItem('busking_fan_id') || `fan_${Math.random().toString(36).substr(2, 9)}`
                    localStorage.setItem('busking_fan_id', storedFanId)
                    fanId = storedFanId
                }

                try {
                    const followRes = await fetch(`/api/singers/${p.singerId}/follow?fanId=${fanId}`)
                    if (followRes.ok) {
                        const followData = await followRes.json()
                        setIsFollowed(followData.isFollowed)
                    }
                } catch (e) {
                    console.error('Follow check failed:', e)
                }
            }
        }
    }

    useEffect(() => {
        if (isLoaded) refreshData()
    }, [performanceId, isLoaded, user])

    const handleSongRequest = async (title: string, artist: string) => {
        if (!performanceId) return
        try {
            await createSongRequest({ performanceId, title, artist })
            if (activeSocket) {
                activeSocket.emit('song_requested', { performanceId, title, username })
            }
            alert('Your song request has been sent!')
        } catch (error) {
            console.error(error)
            alert('Failed to send request.')
        }
    }

    const handleFollow = async () => {
        if (!singer) return

        const prevFollowed = isFollowed
        setIsFollowed(!isFollowed)

        let fanId = user?.id
        if (!fanId) {
            fanId = localStorage.getItem('busking_fan_id') || ''
        }

        try {
            const res = await fetch(`/api/singers/${singer.id}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fanId })
            })
            if (!res.ok) throw new Error('Follow failed')
            const data = await res.json()
            setIsFollowed(data.isFollowed)
        } catch (error) {
            console.error(error)
            setIsFollowed(prevFollowed)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: singer?.stageName || 'BuskerKing Live',
                    text: `Watch ${singer?.stageName} performing live!`,
                    url: window.location.href,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    const handleBookingRequest = async (data: any) => {
        if (!performance?.singerId) return
        await createBookingRequest({ singerId: performance.singerId, ...data })
        alert('Booking enquiry sent! The singer will contact you soon.')
    }

    if (!performance) return <div className="h-screen bg-background-dark text-slate-100 flex items-center justify-center">Loading Performance...</div>

    // Find the first pending song as current, and the next pending one as up next
    const pendingSongs = performance.songs?.filter((s: any) => s.status !== 'completed') || []
    const currentSong = pendingSongs[0] || { title: 'No song playing', artist: '' }
    const nextSong = pendingSongs[1] || null

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto border-x border-primary/10 shadow-2xl font-display">
            {/* Header Section */}
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors mr-1">
                        <Home className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-white/10 flex items-center justify-center">
                            {singer?.profile?.avatarUrl ? (
                                <img className="w-full h-full object-cover" src={singer.profile.avatarUrl} alt={singer?.stageName} />
                            ) : (
                                <span className="font-bold text-white">{singer?.stageName?.[0] || 'A'}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-sm font-bold leading-tight text-white">{singer?.stageName || 'Singer'}</h1>
                            <p className="text-[10px] text-slate-400 font-medium">@{singer?.stageName?.toLowerCase().replace(/\s+/g, '') || 'busker'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleFollow}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-wider ${isFollowed
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                            }`}
                    >
                        {isFollowed ? 'Following' : 'Follow'}
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors hover:scale-105 active:scale-95"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                {/* Live Setlist Card */}
                <section className="p-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 relative overflow-hidden group">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] font-bold tracking-widest text-primary uppercase">{t('live.now_playing')}</p>
                            <span className="relative flex h-2 w-2 items-center justify-center">
                                <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-background-dark/50 rounded-lg flex items-center justify-center border border-white/5 shadow-inner">
                                <Music className="text-primary w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{currentSong.title}</h3>
                                <p className="text-sm text-slate-400 font-medium">{currentSong.artist}</p>
                            </div>
                        </div>
                        {nextSong && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">{t('live.up_next')}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300 font-medium">{nextSong.title} {nextSong.artist ? `— ${nextSong.artist}` : ''}</span>
                                    <span className="text-xs text-primary font-bold uppercase tracking-tight">{t('live.coming_soon')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Performance Actions */}
                <section className="px-4 mb-4 flex flex-col gap-3">
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                    >
                        <Music className="w-5 h-5" />
                        {t('song_request.title')}
                    </button>

                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
                    >
                        <CalendarIcon className="w-5 h-5" />
                        {t('booking.modal.title')}
                    </button>
                </section>

                {/* Live Chat Section */}
                <section className={`flex flex-col flex-1 px-4 pb-4 min-h-[400px] ${performance.chatEnabled && chatStatus === 'open' ? '' : 'hidden'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold flex items-center gap-2 font-display text-white">
                            <MessageCircle className="text-primary w-4 h-4" />
                            {t('chat.title')}
                        </h2>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 uppercase tracking-tighter font-mono">
                            {viewingCount} / {performance.chatCapacity || 50} Viewing
                        </span>
                    </div>
                    {/* The ChatBox component itself */}
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                        <ChatBox
                            performanceId={performanceId}
                            username={username}
                            userType="audience"
                            avatarConfig={avatarConfig}
                            className="flex-1 overflow-hidden"
                            onSocketReady={setActiveSocket}
                            onChatStatusChange={setChatStatus}
                        />
                    </div>
                </section>

                {/* Always render ChatBox invisibly if not open to keep socket alive for status updates */}
                {!(performance.chatEnabled && chatStatus === 'open') && (
                    <div className="hidden">
                        <ChatBox
                            performanceId={performanceId}
                            username={username}
                            userType="audience"
                            avatarConfig={avatarConfig}
                            onChatStatusChange={setChatStatus}
                        />
                    </div>
                )}

                <div className="h-16"></div> {/* Spacer for footer */}
            </main>



            {/* Modals */}
            <SongRequestModal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSubmit={handleSongRequest}
            />

            <BookingRequestModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSubmit={handleBookingRequest}
                singerName={singer?.stageName || 'the singer'}
            />

        </div>
    )
}
