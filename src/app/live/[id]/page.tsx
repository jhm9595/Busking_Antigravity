'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import io, { Socket } from 'socket.io-client'
import { getPerformanceById, getSinger, createBookingRequest, getUserPoints, chargePoints, sponsorSinger } from '@/services/singer'
import { getEffectiveStatus, formatLocalTime } from '@/utils/performance'
import { downloadChatAsText, ChatMessage } from '@/utils/chatDownload'
import SongRequestModal from '@/components/audience/SongRequestModal'
import PointChargeModal from '@/components/common/PointChargeModal'
import { Music, Clock, MessageCircle, X, Check, Archive, Calendar, MapPin, Share2, Home, MessageSquareOff, MessageSquare, Heart, Tv } from 'lucide-react'
import Link from 'next/link'
import GoogleAd from '@/components/common/GoogleAd'
import { useUser } from '@clerk/nextjs'
import { showAdModal } from '@/utils/adModal'

export default function AudienceLivePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [performance, setPerformance] = useState<any>(null)
    const [username, setUsername] = useState('')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showChargeModal, setShowChargeModal] = useState(false)
    const [singer, setSinger] = useState<any>(null)
    const [activeSocket, setActiveSocket] = useState<Socket | null>(null)
    const [showRedirectionModal, setShowRedirectionModal] = useState(false)
    const [redirectCountdown, setRedirectCountdown] = useState(30)
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
    const [viewingCount, setViewingCount] = useState(0)
    const [isFollowed, setIsFollowed] = useState(false)
    const [userPoints, setUserPoints] = useState(0)
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('closed')
    const chatStatusRef = React.useRef<'open' | 'closed'>('closed')
    const [isSponsoring, setIsSponsoring] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const chatMessagesRef = React.useRef<ChatMessage[]>([])
    const [showEndModal, setShowEndModal] = useState(false)
    
    const { user, isLoaded } = useUser()
    const { t } = useLanguage()

    const handleMessagesChange = useCallback((messages: ChatMessage[]) => {
        setChatMessages(messages)
        chatMessagesRef.current = messages
    }, [])

    const refreshData = useCallback(async () => {
        if (!id) return
        try {
            const p = await getPerformanceById(id)
            if (p) {
                // Check if performance is already ended
                if (p.status === 'completed' || p.status === 'canceled') {
                    setPerformance({ ...p })
                    if (p.status === 'completed' && p.chatEnabled) {
                        setShowEndModal(true)
                    } else {
                        setShowRedirectionModal(true)
                    }
                    return
                }

                setPerformance({ ...p })
                setChatStatus(p.chatEnabled ? 'open' : 'closed')
                chatStatusRef.current = p.chatEnabled ? 'open' : 'closed'
                
                if (p.singerId) {
                    const s = await getSinger(p.singerId)
                    setSinger(s)
                    
                    if (typeof window !== 'undefined') {
                        let fanId = user?.id || localStorage.getItem('busking_fan_id')
                        if (fanId) {
                            getUserPoints(fanId).then(setUserPoints)
                        }
                    }

                    if (user?.id) {
                        const followRes = await fetch(`/api/singers/${p.singerId}/follow?fanId=${user.id}`)
                        if (followRes.ok) {
                            const followData = await followRes.json()
                            setIsFollowed(followData.isFollowed)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error refreshing audience data:', error)
        }
    }, [id, user?.id])

    useEffect(() => {
        if (isLoaded) refreshData()
    }, [isLoaded, refreshData])

    useEffect(() => {
        if (!id) return
        let url = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
        if (typeof window !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const prodUrl = 'https://busking-chat-server-678912953258.us-central1.run.app';
            if (!url) url = isLocal ? 'http://localhost:4000' : prodUrl;
            else if (url.includes('localhost') && !isLocal) url = prodUrl;
        }
        if (!url) return

        const socket = io(url, { 
            reconnectionAttempts: 10, 
            reconnectionDelay: 2000,
            transports: ['websocket', 'polling'] 
        })
        setActiveSocket(socket)

        socket.on('connect', () => {
            setRealtimeStatus('connected')
            socket.emit('join_room', { performanceId: id, username: 'SyncOnly', userType: 'audience', syncOnly: true })
            // Refresh data when socket connects to get latest chat status
            refreshData()
        })
        socket.on('disconnect', () => setRealtimeStatus('error'))
        socket.on('connect_error', () => setRealtimeStatus('error'))
        
        socket.on('song_status_updated', () => {
            refreshData()
        })

        socket.on('performance_ended', () => {
            refreshData()
            const wasOpen = chatStatusRef.current === 'open'
            setChatStatus('closed') // Explicitly close chat on end
            chatStatusRef.current = 'closed'
            if (wasOpen) {
                setShowEndModal(true)
            } else {
                setShowRedirectionModal(true)
            }
        })
        
        socket.on('chat_status', (data: { status: 'open' | 'closed' }) => {
            setChatStatus(data.status)
            chatStatusRef.current = data.status
            // Synchronize performance state for layout purposes
            setPerformance((prev: any) => prev ? { ...prev, chatEnabled: data.status === 'open' } : prev)
        })

        socket.on('chat_status_toggled', (data: { enabled: boolean }) => {
            const newStatus = data.enabled ? 'open' : 'closed'
            setChatStatus(newStatus)
            chatStatusRef.current = newStatus
            setPerformance((prev: any) => prev ? { ...prev, chatEnabled: data.enabled } : prev)
        })

        return () => { socket.disconnect() }
    }, [id, refreshData])

    // Periodic refresh to ensure chat status is always up to date
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData()
        }, 5000) // Refresh every 5 seconds
        return () => clearInterval(interval)
    }, [refreshData])

    useEffect(() => {
        if (!showRedirectionModal) return
        if (redirectCountdown <= 0) { router.push(`/singer/${singer?.id || ''}`); return }
        const timer = setInterval(() => { setRedirectCountdown(prev => prev - 1) }, 1000)
        return () => clearInterval(timer)
    }, [showRedirectionModal, redirectCountdown, singer, router])

    const handleSponsor = async (amount: number) => {
        if (!isLoaded || isSponsoring) return
        if (!user) {
            router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)
            return
        }
        if (!singer?.id) return

        setIsSponsoring(true)
        try {
            const res = await sponsorSinger(user.id, singer.id, amount)
        if (res.success) {
            if (activeSocket) {
                activeSocket.emit('donation_received', {
                    performanceId: id,
                    username: user.fullName || user.username || user.id,
                    amount
                })
            }
            refreshData()
        } else {
            const error = (res as any).error
            alert(error === 'INSUFFICIENT_POINTS' ? t('common.insufficient_points') : t('common.sponsorship_failed'))
        }
        } finally {
            setIsSponsoring(false)
        }
    }

    const handleWatchAdSponsor = async () => {
        if (!isLoaded || isSponsoring) return
        if (!user) {
            router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)
            return
        }
        if (!singer?.id) return

        setIsSponsoring(true)
        
        // Show ad and wait for completion
        const watched = await showAdModal(t)
        
        if (watched && singer?.id) {
            // Sponsor 10 points to singer
            const res = await sponsorSinger(user.id, singer.id, 10)
            if (res.success) {
                if (activeSocket) {
                    activeSocket.emit('donation_received', {
                        performanceId: id,
                        username: user.fullName || user.username || user.id,
                        amount: 10
                    })
                }
                alert(t('live.ad_sponsor_success') || 'You sponsored 10 points to the singer!')
                refreshData()
            }
        }
        setIsSponsoring(false)
    }

    const handleSongRequest = async (title: string, artist: string) => {
        try {
            const finalName = username || user?.fullName || user?.username || user?.id || t('common.anonymous');
            const res = await fetch('/api/song-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ performanceId: id, title, artist, requesterName: finalName })
            })
            if (!res.ok) throw new Error('Request failed')
            if (activeSocket) activeSocket.emit('song_requested', { performanceId: id, title, artist, username: finalName })
            alert(t('song.request_sent'))
        } catch (error: any) { alert(t('song.request_failed')) }
    }

    const handleFollow = async () => {
        if (!singer || !user?.id) { if (!user?.id) router.push('/sign-in'); return }
        setIsFollowed(!isFollowed)
        await fetch(`/api/singers/${singer.id}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fanId: user.id })
        })
    }

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: singer?.stageName, url: window.location.href }) } catch (_error) { }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert(t('common.link_copied'))
        }
    }

    if (!performance) return <div className="h-screen bg-background text-foreground flex items-center justify-center italic">{t('common.loading')}</div>

    const isCompleted = getEffectiveStatus(performance) === 'completed'
    // Source of Truth for chat: socket status or database state if socket not yet connected
    const isChatOpen = chatStatus === 'open'

    return (
        <div className="bg-background text-foreground h-[100dvh] flex flex-col w-full md:max-w-xl mx-auto font-display overflow-hidden selection:bg-indigo-500/30">
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shadow-2xl shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <Link href="/explore" className="p-2.5 rounded-xl bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground transition-all active:scale-95 shadow-lg shrink-0">
                        <Home className="w-5 h-5 text-primary" />
                    </Link>
                    <Link href={`/singer/${singer?.id}`} className="flex items-center gap-2 md:gap-3 group min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 p-[1px] shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-black overflow-hidden border border-border text-xs text-primary uppercase italic">
                                {singer?.profile?.avatarUrl ? <img src={singer.profile.avatarUrl} className="w-full h-full object-cover" /> : (singer?.stageName?.[0] || t('common.singer_fallback')[0])}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm text-foreground group-hover:text-primary transition-colors leading-tight uppercase italic">{singer?.stageName || t('common.singer_fallback')}</span>
                            <span className="text-[11px] text-foreground/50 font-bold uppercase tracking-widest italic">{realtimeStatus === 'connected' ? t('live.status_live') : t('live.status_syncing')}</span>
                        </div>
                    </Link>
                </div>
                <div className="flex gap-2">
                    <div className="hidden sm:flex flex-col items-end justify-center px-3 bg-foreground/5 rounded-xl border border-border">
                        <span className="text-[8px] font-black text-amber-400/50 uppercase tracking-widest leading-none mb-1">{t('common.points')}</span>
                        <span className="text-xs font-mono font-black text-amber-400 leading-none">{userPoints.toLocaleString()}P</span>
                    </div>
                    <Link href={`/singer/${singer?.id}`} className="hidden sm:flex px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg italic bg-foreground/5 text-foreground/70 border border-border hover:bg-foreground/10 items-center">
                        {t('live.view_profile')}
                    </Link>
                    {user?.id ? (
                        <button
                            onClick={handleFollow}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg italic ${isFollowed ? 'bg-foreground/5 text-foreground/70 border border-border' : 'bg-primary text-primary-foreground shadow-primary/30'}`}
                        >
                            {isFollowed ? t('common.following') : t('common.follow')}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg italic bg-primary text-primary-foreground shadow-primary/30"
                        >
                            {t('common.follow')}
                        </button>
                    )}
                    <button onClick={handleShare} className="p-2.5 rounded-xl bg-foreground/5 border border-border hover:bg-foreground/10 text-foreground/70 transition-all active:scale-95"><Share2 className="w-4 h-4" /></button>
                </div>
            </header>

            <div className="sm:hidden bg-background/40 px-4 py-1.5 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400/70 uppercase tracking-widest">{t('common.points')}:</span>
                    <span className="text-xs font-mono font-black text-amber-400">{userPoints.toLocaleString()}P</span>
                </div>
                <button onClick={() => setShowChargeModal(true)} className="text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-black uppercase">{t('common.charge')} (TEST)</button>
            </div>

            <main className="flex-1 overflow-y-auto flex flex-col p-4 pb-32 custom-scrollbar">
                {isCompleted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500 italic">
                        <div className="w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center mb-6 shadow-2xl">
                            <Archive className="w-10 h-10 text-foreground/60" />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-foreground">{t('live.ended_title')}</h2>
                        <p className="text-foreground/50 mb-10 max-w-[240px] leading-relaxed">{t('live.ended_desc')}</p>
                        <Link href={`/singer/${singer?.id}`} className="w-full max-w-xs bg-indigo-600 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest">{t('live.view_singer_profile')}</Link>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col space-y-4">
                        <section className="bg-card/50 rounded-[32px] p-6 border border-border shadow-xl">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-md font-black flex items-center gap-3 italic uppercase tracking-wider"><Music className="w-5 h-5 text-primary" />{t('performance.details.setlist_title')}</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowRequestModal(true)} className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-primary/30 italic flex items-center gap-2 shadow-lg"><Music className="w-3 h-3" /> {t('song_request.title')}</button>
                                    <span className="text-xs font-black bg-foreground/5 px-2.5 py-1 rounded-full text-foreground/50 uppercase tracking-widest italic">{performance.songs?.length || 0} {t('live.tracks')}</span>
                                </div>
                            </div>
                            <div className={`space-y-3 ${chatStatus === 'open' ? 'max-h-[300px] overflow-y-auto custom-scrollbar pr-1' : ''}`}>
                                {performance.songs?.length > 0 ? (
                                    performance.songs.map((s: any, i: number) => {
                                        const isLive = s.status !== 'completed' && i === performance.songs.findIndex((x: any) => x.status !== 'completed')
                                        return (
                                            <div key={i} className={`group p-4 rounded-2xl border transition-all duration-500 ${s.status === 'completed' ? 'bg-foreground/5 border-border text-foreground/60' : 'bg-card border-border shadow-lg shadow-black/20 hover:border-indigo-500/30'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-base flex items-center gap-3 truncate text-foreground uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors">{s.title}{s.status === 'completed' && <Check className="w-4 h-4 text-emerald-500" />}</p>
                                                        <p className="text-xs font-bold text-foreground/50 uppercase tracking-[0.2em] mt-0.5">{s.artist}</p>
                                                    </div>
                                                    {isLive && <span className="text-[8px] bg-red-600 text-white px-2.5 py-1 rounded-full font-black animate-pulse shadow-lg shadow-red-600/40 border border-red-500 tracking-tighter">{t('live.badge_now')}</span>}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="p-10 text-center text-xs text-foreground/40 bg-foreground/5 border border-dashed border-border rounded-[24px] italic font-bold">{t('performance.details.empty_setlist')}</div>
                                )}
                            </div>
                        </section>

                        <GoogleAd slot="audience_live_mid" className="opacity-30 scale-90" />

                        {chatStatus === 'open' ? (
                            <section className="bg-card rounded-[32px] border border-border flex flex-col flex-1 min-h-[450px] overflow-hidden shadow-2xl relative mb-20 animate-in slide-in-from-bottom-6 duration-700">
                                <div className="p-4 bg-background/60 backdrop-blur-md border-b border-border flex justify-between items-center sticky top-0 z-10">
                                    <h2 className="font-black text-sm flex items-center gap-3 italic uppercase"><MessageCircle className="w-5 h-5 text-primary" />{t('chat.title')}</h2>
                                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                        <span className="text-xs font-black text-primary uppercase tracking-widest italic">{viewingCount} {t('live.watching')}</span>
                                    </div>
                                </div>
                                <ChatBox
                                    performanceId={id}
                                    username={username || 'Guest'}
                                    userType="audience"
                                    socket={activeSocket || undefined}
                                    className="flex-1 !rounded-none !border-0"
                                    onViewingCountChange={setViewingCount}
                                    onMessagesChange={handleMessagesChange}
                                />
                            </section>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-foreground/5 rounded-[48px] border border-dashed border-border text-center mt-6 min-h-[300px] italic shadow-inner">
                                <div className="w-20 h-20 bg-foreground/10 rounded-full flex items-center justify-center mb-6 opacity-30 shadow-2xl"><MessageSquareOff className="w-10 h-10 text-foreground" /></div>
                                <p className="text-foreground/70 text-xs font-black uppercase tracking-[0.3em]">{t('chat.closed_placeholder')}</p>
                                <p className="text-foreground/60 text-[11px] mt-3 max-w-[240px] font-medium leading-relaxed">{t('live.chat_ready_desc')}</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {!isCompleted && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent flex justify-center z-40 pointer-events-none">
                    <div className="flex gap-2 w-full max-w-lg pointer-events-auto">
                        <button onClick={() => handleSponsor(500)} disabled={isSponsoring} className="flex-1 bg-amber-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all border border-amber-400/50 italic flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSponsoring ? '...' : <><Heart className="w-4 h-4 fill-current" /> {t('live.sponsor_btn')} (500P)</>}
                        </button>
                        <button onClick={handleWatchAdSponsor} disabled={isSponsoring} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 transition-all border border-emerald-400/50 italic flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSponsoring ? '...' : <><Tv className="w-4 h-4 fill-current" /> {t('live.sponsor_ad_btn') || '광고보고 후원'}</>}
                        </button>
                    </div>
                </div>
            )}

            {showEndModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                <MessageSquare className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2">{t('live.end_performance')}</h3>
                            <p className="text-muted text-sm mb-6">{t('live.end_performance_desc')}</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        downloadChatAsText(chatMessagesRef.current, performance.title)
                                        setShowEndModal(false)
                                        setShowRedirectionModal(true)
                                    }}
                                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                                >
                                    {t('live.download_chat')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEndModal(false)
                                        setShowRedirectionModal(true)
                                    }}
                                    className="w-full bg-foreground/5 hover:bg-foreground/10 text-foreground/70 py-3 rounded-xl font-bold transition-all"
                                >
                                    {t('live.skip')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRedirectionModal && (
                <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-1000 italic">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_60px_rgba(79,70,229,0.2)]"><Archive className="w-10 h-10 text-primary" /></div>
                    <h2 className="text-3xl font-black mb-4 text-foreground uppercase tracking-tighter">{t('live.ended_title')}</h2>
                    <p className="text-foreground/50 mb-14 max-w-[280px] leading-relaxed">{t('live.ended_desc')}</p>
                    <div className="bg-foreground/5 border border-border px-12 py-8 rounded-[40px] mb-14 relative shadow-2xl">
                        <span className="text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60">{redirectCountdown}</span>
                        <p className="text-xs font-black text-foreground/60 uppercase tracking-[0.2em] mt-3">{t('live.redirecting')}</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-[280px]">
                        <button onClick={() => setShowRedirectionModal(false)} className="bg-foreground/5 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foreground/10 transition-all border border-border">{t('live.stay_here')}</button>
                        <Link href={`/singer/${singer?.id}`} className="bg-primary py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-xl shadow-primary/30 hover:bg-primary/80 transition-all border border-primary/30 text-primary-foreground">{t('live.view_singer_profile')}</Link>
                    </div>
                </div>
            )}

            <SongRequestModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} onSubmit={handleSongRequest} />
            { (user?.id || (typeof window !== 'undefined' && localStorage.getItem('busking_fan_id'))) && (
                <PointChargeModal
                    userId={user?.id || (typeof window !== 'undefined' ? localStorage.getItem('busking_fan_id')! : '')}
                    isOpen={showChargeModal}
                    onClose={() => setShowChargeModal(false)}
                    onSuccess={(newPoints) => setUserPoints(newPoints)}
                />
            )}
        </div>
    )
}
