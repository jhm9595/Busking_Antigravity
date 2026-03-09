'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import io, { Socket } from 'socket.io-client'
import { getPerformanceById, getSinger, createBookingRequest } from '@/services/singer'
import { getEffectiveStatus } from '@/utils/performance'
import SongRequestModal from '@/components/audience/SongRequestModal'
import BookingRequestModal from '@/components/audience/BookingRequestModal'
import { Music, Clock, MessageCircle, X, Check, Archive, Calendar, MapPin, Share2, Home } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function AudienceLivePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [performance, setPerformance] = useState<any>(null)
    const [username, setUsername] = useState('')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [singer, setSinger] = useState<any>(null)
    const [activeSocket, setActiveSocket] = useState<Socket | null>(null)
    const [showRedirectionModal, setShowRedirectionModal] = useState(false)
    const [redirectCountdown, setRedirectCountdown] = useState(30)
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
    const [viewingCount, setViewingCount] = useState(0)
    const [isFollowed, setIsFollowed] = useState(false)
    const { user, isLoaded } = useUser()
    const { t } = useLanguage()

    const refreshData = async () => {
        if (id) {
            const p = await getPerformanceById(id)
            setPerformance(p)
            if (p?.singerId) {
                const s = await getSinger(p.singerId)
                setSinger(s)
                if (user?.id) {
                    try {
                        const followRes = await fetch(`/api/singers/${p.singerId}/follow?fanId=${user.id}`)
                        if (followRes.ok) {
                            const followData = await followRes.json()
                            setIsFollowed(followData.isFollowed)
                        }
                    } catch (_e) {
                        console.error('Follow check failed:', _e)
                    }
                }
            }
        }
    }

    useEffect(() => {
        if (isLoaded) refreshData()
    }, [id, isLoaded, user])

    useEffect(() => {
        if (!id) return
        let realtimeServerUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
        if (!realtimeServerUrl && typeof window !== 'undefined') {
            realtimeServerUrl = `${window.location.protocol}//${window.location.hostname}:4000`
        }
        if (realtimeServerUrl?.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
            realtimeServerUrl = `${window.location.protocol}//${window.location.hostname}:4000`
        }

        if (!realtimeServerUrl) return

        const socket = io(realtimeServerUrl, {
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        })
        setActiveSocket(socket)

        socket.on('connect', () => {
            setRealtimeStatus('connected')
            socket.emit('join_room', {
                performanceId: id,
                username: 'SyncOnly',
                userType: 'audience',
                syncOnly: true
            })
        })

        socket.on('disconnect', () => setRealtimeStatus('error'))
        socket.on('connect_error', () => setRealtimeStatus('error'))

        socket.on('song_status_updated', () => refreshData())
        socket.on('performance_ended', () => {
            refreshData()
            setShowRedirectionModal(true)
        })

        return () => { socket.disconnect() }
    }, [id])

    useEffect(() => {
        if (!showRedirectionModal) return
        if (redirectCountdown <= 0) {
            router.push(`/singer/${singer?.id || ''}`)
            return
        }
        const timer = setInterval(() => {
            setRedirectCountdown(prev => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [showRedirectionModal, redirectCountdown, singer, router])

    const handleSongRequest = async (title: string, artist: string) => {
        try {
            const finalName = username || user?.fullName || user?.username || user?.id || 'Anonymous';
            const res = await fetch('/api/song-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ performanceId: id, title, artist, requesterName: finalName })
            })
            if (!res.ok) throw new Error('Request failed')
            if (activeSocket) {
                activeSocket.emit('song_requested', { performanceId: id, title, artist, username: finalName })
            }
            alert(t('song.request_sent'))
        } catch (error: any) {
            alert(t('song.request_failed'))
        }
    }

    const handleFollow = async () => {
        if (!singer || !user?.id) {
            if (!user?.id) router.push('/sign-in')
            return
        }
        setIsFollowed(!isFollowed)
        await fetch(`/api/singers/${singer.id}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fanId: user.id })
        })
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: singer?.stageName, url: window.location.href })
            } catch (_error) { }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied!')
        }
    }

    const handleBookingRequest = async (data: any) => {
        if (!performance?.singerId) return
        await createBookingRequest({ singerId: performance.singerId, ...data })
        alert('Enquiry sent!')
    }

    if (!performance) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>

    const isCompleted = getEffectiveStatus(performance) === 'completed'

    return (
        <div className="bg-[#0f1117] text-slate-100 h-[100dvh] flex flex-col w-full md:max-w-xl mx-auto font-display overflow-hidden selection:bg-indigo-500/30">
            <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                    <Link href="/explore" className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all active:scale-95 shadow-lg">
                        <Home className="w-5 h-5 text-indigo-400" />
                    </Link>
                    <Link href={`/singer/${singer?.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center font-black overflow-hidden border border-black/20 text-xs">
                                {singer?.profile?.avatarUrl ? <img src={singer.profile.avatarUrl} className="w-full h-full object-cover" /> : singer?.stageName?.[0]}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm text-white group-hover:text-indigo-400 transition-colors leading-tight">{singer?.stageName}</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{realtimeStatus === 'connected' ? 'Live Now' : 'Syncing...'}</span>
                        </div>
                    </Link>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleFollow}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg ${isFollowed ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-indigo-600 text-white shadow-indigo-600/30'}`}
                    >
                        {isFollowed ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={handleShare} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 transition-all active:scale-95"><Share2 className="w-4 h-4" /></button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto flex flex-col p-4 pb-32 custom-scrollbar">
                {isCompleted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-gray-900 border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                            <Archive className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-white italic">{t('live.ended_title')}</h2>
                        <p className="text-gray-500 mb-10 max-w-[240px] leading-relaxed italic">{t('live.ended_desc')}</p>
                        <Link href={`/singer/${singer?.id}`} className="w-full max-w-xs bg-indigo-600 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">{t('live.view_singer_profile')}</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Info */}
                        <div className="bg-gradient-to-br from-gray-900 to-[#161922] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />
                            <h1 className="text-2xl font-black mb-5 text-white italic tracking-tight leading-tight">{performance.title}</h1>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span>{new Date(performance.startTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Clock className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="font-mono">
                                        {new Date(performance.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {performance.endTime ? new Date(performance.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '...'}
                                    </span>
                                </div>
                                {performance.locationText && (
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                            <MapPin className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <span className="line-clamp-1">{performance.locationText}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Setlist */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black flex items-center gap-3 italic">
                                    <Music className="w-5 h-5 text-indigo-500" />
                                    {t('performance.details.setlist_title')}
                                </h2>
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{performance.songs?.length || 0} tracks</span>
                            </div>
                            {performance.songs?.length > 0 ? (
                                <div className="space-y-3">
                                    {performance.songs.map((s: any, i: number) => {
                                        const isLive = s.status !== 'completed' && i === performance.songs.findIndex((x: any) => x.status !== 'completed')
                                        return (
                                            <div key={i} className={`p-4 rounded-2xl border transition-all duration-300 ${s.status === 'completed' ? 'bg-black/20 border-white/5 text-gray-600' : 'bg-gray-900 border-white/5 shadow-lg shadow-black/20 hover:border-indigo-500/30'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-sm flex items-center gap-2 truncate text-white uppercase italic tracking-tight">
                                                            {s.title}
                                                            {s.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.artist}</p>
                                                    </div>
                                                    {isLive && (
                                                        <span className="text-[9px] bg-red-600 text-white px-2.5 py-1 rounded-full font-black animate-pulse shadow-lg shadow-red-600/40 border border-red-500 tracking-tighter">NOW PLAYING</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-10 text-center text-gray-700 bg-black/20 border border-dashed border-white/5 rounded-3xl italic font-bold">
                                    {t('performance.details.empty_setlist')}
                                </div>
                            )}
                        </section>

                        {/* Chat */}
                        <section className="bg-gray-900 rounded-3xl border border-white/5 flex flex-col h-[600px] overflow-hidden shadow-2xl relative mb-20 scroll-mt-20">
                            <div className="p-4 bg-gray-900/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center sticky top-0 z-10">
                                <h2 className="font-black text-sm flex items-center gap-3 italic">
                                    <MessageCircle className="w-5 h-5 text-indigo-500" />
                                    Chat
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{viewingCount} watching</span>
                                </div>
                            </div>
                            <ChatBox
                                performanceId={id}
                                username={username || 'Guest'}
                                userType="audience"
                                socket={activeSocket || undefined}
                                className="flex-1 !rounded-none !border-0"
                                onViewingCountChange={setViewingCount}
                            />
                        </section>
                    </div>
                )}
            </main>

            {!isCompleted && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center z-40 pointer-events-none">
                    <div className="flex gap-3 w-full max-w-lg pointer-events-auto">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-2 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all border border-indigo-500/50"
                        >
                            <Music className="w-4 h-4" /> {t('song_request.title')}
                        </button>
                        <button
                            onClick={() => setShowBookingModal(true)}
                            className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all border border-white/20"
                        >
                            <Clock className="w-4 h-4" /> {t('booking.modal.title')}
                        </button>
                    </div>
                </div>
            )}

            {showRedirectionModal && (
                <div className="fixed inset-0 z-[100] bg-gray-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                        <Archive className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h2 className="text-3xl font-black mb-3 text-white italic tracking-tight">{t('live.ended_title')}</h2>
                    <p className="text-gray-500 mb-12 max-w-[280px] leading-relaxed italic">{t('live.ended_desc')}</p>
                    <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl mb-12 relative shadow-2xl">
                        <span className="text-5xl font-mono font-black text-indigo-500 shadow-indigo-500/50">{redirectCountdown}</span>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{t('live.redirecting') || 'Redirecting...'}</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-[280px]">
                        <button onClick={() => setShowRedirectionModal(false)} className="bg-white/5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">{t('live.stay_here') || 'Stay here'}</button>
                        <Link href={`/singer/${singer?.id}`} className="bg-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all border border-indigo-400/30">{t('live.view_singer_profile')}</Link>
                    </div>
                </div>
            )}

            <SongRequestModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} onSubmit={handleSongRequest} />
            <BookingRequestModal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} onSubmit={handleBookingRequest} singerName={singer?.stageName || 'Singer'} />
        </div>
    )
}
