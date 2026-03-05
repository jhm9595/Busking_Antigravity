'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import { getPerformanceById } from '@/services/singer'
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


    const [showFullSetlist, setShowFullSetlist] = useState(false)

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

    // Lightweight refresh: only re-fetch performance (setlist) data
    const refreshPerformance = async () => {
        if (!performanceId) return
        const p = await getPerformanceById(performanceId)
        if (p) setPerformance(p)
    }

    // Poll every 30s to keep setlist in sync with singer's changes (add/delete/reorder)
    useEffect(() => {
        if (!performanceId) return
        const interval = setInterval(refreshPerformance, 30000)
        return () => clearInterval(interval)
    }, [performanceId])

    // Also listen for socket event: singer changed song status or setlist
    useEffect(() => {
        if (!activeSocket) return
        const handleStatusUpdate = () => {
            refreshPerformance()
        }
        activeSocket.on('song_status_updated', handleStatusUpdate)
        return () => activeSocket.off('song_status_updated', handleStatusUpdate)
    }, [activeSocket, performanceId])

    const handleSongRequest = async (title: string, artist: string) => {
        if (!performanceId) return
        try {
            const res = await fetch('/api/song-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    performanceId,
                    title,
                    artist,
                    requesterName: username || (user?.id) || 'Anonymous'
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Request failed')

            if (activeSocket) {
                activeSocket.emit('song_requested', { performanceId, title, artist, username })
            }
            alert(t('song.request_sent') || 'Your song request has been sent!')
        } catch (error: any) {
            console.error('Song request error:', error)
            alert(`${t('song.request_failed') || 'Failed to send request'}: ${error.message}`)
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

    const isCompleted = performance.status === 'completed'

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col max-w-4xl mx-auto border-x border-primary/10 shadow-2xl font-display">
            {/* Header Section */}
            <header className="sticky top-0 z-30 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                        <Home className="w-5 h-5" />
                    </Link>
                    {/* Tapping singer info goes back to their profile */}
                    <Link
                        href={singer?.id ? `/singer/${singer.id}` : '/'}
                        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                        <div className="w-9 h-9 rounded-full border-2 border-primary overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                            {singer?.profile?.avatarUrl ? (
                                <img className="w-full h-full object-cover" src={singer.profile.avatarUrl} alt={singer?.stageName} />
                            ) : (
                                <span className="font-bold text-white text-sm">{singer?.stageName?.[0] || 'A'}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-sm font-bold leading-tight text-white group-hover:text-primary transition-colors">{singer?.stageName || 'Singer'}</h1>
                            <p className="text-[10px] text-slate-500 font-medium">↩ {t('live.view_profile')}</p>
                        </div>
                    </Link>
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
                {isCompleted ? (
                    <section className="px-4 py-8 mt-4">
                        <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-8 text-center shadow-2xl flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-600">
                                <Archive className="w-8 h-8 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">{t('live.ended_title')}</h2>
                            <p className="text-sm text-gray-400 mb-6">{t('live.ended_desc')}</p>

                            <Link href={`/singer/${singer?.id}`} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition w-full mb-3 shadow-inner text-center">
                                {t('live.view_singer_profile')}
                            </Link>
                            <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition w-full shadow-lg shadow-indigo-900/20 text-center">
                                {t('live.explore_more')}
                            </Link>
                        </div>
                    </section>
                ) : (
                    <>
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

                                {/* Full Setlist Toggle */}
                                {performance.songs && performance.songs.length > 0 && (
                                    <div className="mt-4 border-t border-white/5">
                                        <button
                                            onClick={() => setShowFullSetlist(!showFullSetlist)}
                                            className="w-full py-2 flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-500 uppercase group/btn"
                                        >
                                            <div className="flex items-center gap-2">
                                                <List className="w-3 h-3 text-primary" />
                                                <span>{t('live.tabs.setlist')} ({performance.songs.length})</span>
                                            </div>
                                            <ChevronRight className={`w-3 h-3 transition-transform ${showFullSetlist ? 'rotate-90' : ''}`} />
                                        </button>

                                        {showFullSetlist && (
                                            <div className="mt-2 space-y-2 pb-2">
                                                {performance.songs.map((song: any, index: number) => (
                                                    <div key={song.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-white/5 border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-[10px] text-primary/50">{index + 1}</span>
                                                            <div className={song.status === 'completed' ? 'opacity-30 line-through' : ''}>
                                                                <p className="font-bold text-slate-200">{song.title}</p>
                                                                <p className="text-[10px] text-slate-500">{song.artist}</p>
                                                            </div>
                                                        </div>
                                                        {song.status === 'completed' ? (
                                                            <Check className="w-3 h-3 text-green-500" />
                                                        ) : song.id === currentSong.id ? (
                                                            <div className="flex gap-0.5">
                                                                <div className="w-1 h-3 bg-red-500 animate-[bounce_1s_infinite_0s]"></div>
                                                                <div className="w-1 h-3 bg-red-500 animate-[bounce_1s_infinite_0.2s]"></div>
                                                                <div className="w-1 h-3 bg-red-500 animate-[bounce_1s_infinite_0.4s]"></div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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


                        {/* Live Chat Section — only shown when chatEnabled and not completed */}
                        {performance.chatEnabled && !isCompleted && (
                            <section className="flex flex-col flex-1 px-4 pb-4 min-h-[400px]">
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
                                        onViewingCountChange={(count) => setViewingCount(count)}
                                        onSongStatusUpdate={refreshPerformance}
                                    />
                                </div>
                            </section>
                        )}
                    </>
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
