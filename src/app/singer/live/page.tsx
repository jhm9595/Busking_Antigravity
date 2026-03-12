'use client'

import React, { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    getPerformanceById,
    updatePerformanceStatus,
    getPerformanceRequests,
    acceptSongRequest,
    rejectSongRequest,
    updateSetlistOrder,
    getSongs,
    updatePerformanceSetlist,
    createSongRequest,
    updateSongStatus,
    getUserPoints,
    usePointsForChat,
    togglePerformanceChat,
    chargePoints,
    createRealtimeOwnerControlToken
} from '@/services/singer'
import { Music, Clock, MessageCircle, X, Check, Plus, List, GripVertical, Search, MessageSquare, User as UserIcon, Trash2, LayoutDashboard, LogOut, Play, RotateCcw, MessageSquarePlus, Coins, Home } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import io from 'socket.io-client'
import Link from 'next/link'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { getEffectiveStatus } from '@/utils/performance'

function LivePerformanceContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const performanceId = searchParams.get('performanceId')

    const [performance, setPerformance] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [allSongs, setAllSongs] = useState<any[]>([])
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'setlist' | 'requests' | 'chat'>('setlist')
    const [viewingCount, setViewingCount] = useState(0)
    const [showAddModal, setShowAddModal] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [isReordering, setIsReordering] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [manualSongTitle, setManualSongTitle] = useState('')
    const [manualSongArtist, setManualSongArtist] = useState('')
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('closed')
    const socketRef = useRef<any>(null)
    const [isAlertSent, setIsAlertSent] = useState(false)
    const [canOpenChat, setCanOpenChat] = useState(false)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } })
    const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set())
    const [togglingStatusIds, setTogglingStatusIds] = useState<Set<string>>(new Set())
    const optimisticStatusRef = useRef<Record<string, string>>({})
    const [isRefreshingRequests, setIsRefreshingRequests] = useState(false)
    const [addingSongId, setAddingSongId] = useState<string | null>(null)
    const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
    const [socket, setSocket] = useState<any>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [userPoints, setUserPoints] = useState(0)
    const [isEnablingChat, setIsEnablingChat] = useState(false)
    const [ownerControlToken, setOwnerControlToken] = useState<string | null>(null)
    const ownerControlTokenRef = useRef<string | null>(null)

    const updateOwnerControlToken = useCallback((nextToken: string | null) => {
        ownerControlTokenRef.current = nextToken
        setOwnerControlToken(nextToken)
    }, [])

    const requestOwnerControlToken = useCallback(async () => {
        if (!performanceId) {
            updateOwnerControlToken(null)
            return null
        }

        const result = await createRealtimeOwnerControlToken(performanceId)
        if (result && result.success && result.token) {
            updateOwnerControlToken(result.token)
            return result.token
        }

        updateOwnerControlToken(null)
        return null
    }, [performanceId, updateOwnerControlToken])

    const emitOwnerControlEvent = useCallback(async (eventName: string, payload: Record<string, any> = {}) => {
        if (!socketRef.current) {
            return false
        }

        const resolvedPerformanceId = payload.performanceId || performanceId || performance?.id
        if (!resolvedPerformanceId) {
            return false
        }

        let token = ownerControlTokenRef.current
        if (!token) {
            token = await requestOwnerControlToken()
        }

        if (!token) {
            return false
        }

        socketRef.current.emit(eventName, {
            ...payload,
            performanceId: resolvedPerformanceId,
            controlToken: token
        })

        return true
    }, [performanceId, performance?.id, requestOwnerControlToken])

    // Fetch user points
    useEffect(() => {
        if (performance?.singerId) {
            getUserPoints(performance.singerId).then(setUserPoints)
        }
    }, [performance?.singerId])

    const handleOpenChat = async (usePoints: boolean = false) => {
        if (!performance || isEnablingChat) return
        
        if (usePoints && userPoints < 100) {
            alert(t('common.insufficient_points'))
            return
        }

        setIsEnablingChat(true)
        try {
            let success = false
            if (usePoints) {
                const res = await usePointsForChat(performance.singerId, performance.id)
                success = res.success
            } else {
                const res = await togglePerformanceChat(performance.id, true)
                success = res.success
            }

            if (success) {
                const wasEmitted = await emitOwnerControlEvent('open_chat', { performanceId: performance.id })
                if (!wasEmitted) {
                    alert('Failed to authorize chat open.')
                }
                if (usePoints) {
                    const newPoints = await getUserPoints(performance.singerId)
                    setUserPoints(newPoints)
                }
                await refreshData()
            } else {
                alert('Failed to open chat.')
            }
        } finally {
            setIsEnablingChat(false)
        }
    }

    // Handle screen resize to toggle between mobile and desktop views
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const refreshData = useCallback(async () => {
        if (!performanceId) return
        try {
            const [perfData, reqData] = await Promise.all([
                getPerformanceById(performanceId),
                getPerformanceRequests(performanceId)
            ])
            if (!perfData) return

            if (perfData.songs) {
                perfData.songs = perfData.songs.map((song: any) => {
                    const os = optimisticStatusRef.current[song.id]
                    return os ? { ...song, status: os } : song
                })
            }
            setPerformance(perfData)
            setRequests(reqData)

            if (perfData.status === 'completed' || perfData.status === 'canceled') {
                router.push('/singer/dashboard')
                return
            }
            if (perfData.singerId) {
                const songs = await getSongs(perfData.singerId)
                setAllSongs(songs)
            }
        } catch (err: any) {
            console.error(err)
            setFetchError(err.message || 'Unknown error')
        }
    }, [performanceId, router])

    const refreshRequests = useCallback(async () => {
        if (!performanceId) return
        setIsRefreshingRequests(true)
        try {
            const reqData = await getPerformanceRequests(performanceId)
            setRequests(reqData)
        } finally {
            setIsRefreshingRequests(false)
        }
    }, [performanceId])

    useEffect(() => {
        if (!performanceId) {
            router.push('/singer/dashboard')
            return
        }
        refreshData().finally(() => setLoading(false))
    }, [performanceId, router, refreshData])

    useEffect(() => {
        if (!performanceId) {
            updateOwnerControlToken(null)
            return
        }

        requestOwnerControlToken()
    }, [performanceId, requestOwnerControlToken, updateOwnerControlToken])

    useEffect(() => {
        let url = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
        
        // Fallback logic including the specific production chat server URL
        if (typeof window !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const prodUrl = 'https://busking-chat-server-678912953258.us-central1.run.app';
            
            if (!url) {
                // If no env var, use localhost:4000 for local development, and the specific prod URL for production
                url = isLocal ? 'http://localhost:4000' : prodUrl;
            } else if (url.includes('localhost') && !isLocal) {
                // If set to localhost in env but we are in prod, swap to prod URL
                url = prodUrl;
            }
        }

        if (!url || !performanceId) return
        if (!socketRef.current) {
            const s = io(url, { reconnectionAttempts: 5, reconnectionDelay: 3000 })
            s.on('connect', async () => {
                setRealtimeStatus('connected')
                setSocket(s)

                const controlToken = ownerControlTokenRef.current || await requestOwnerControlToken()
                s.emit('join_room', {
                    performanceId,
                    username: 'Singer',
                    controlToken: controlToken || undefined
                })
            })
            s.on('disconnect', () => {
                setRealtimeStatus('error')
                setSocket(null)
            })
            s.on('connect_error', (err) => {
                console.error('Socket connection error:', err)
                setRealtimeStatus('error')
                setSocket(null)
            })
            s.on('song_requested', () => { refreshRequests(); refreshData() })
            s.on('chat_status', (data: any) => {
                const status = typeof data === 'string' ? data : data.status
                setChatStatus(status)
            })
            s.on('authorization_error', async () => {
                await requestOwnerControlToken()
            })
            socketRef.current = s
        }
        return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setSocket(null) } }
    }, [performanceId, refreshRequests, refreshData, requestOwnerControlToken])

    useEffect(() => {
        if (!performanceId || !ownerControlToken || !socketRef.current?.connected) {
            return
        }

        socketRef.current.emit('join_room', {
            performanceId,
            username: 'Singer',
            controlToken: ownerControlToken
        })
    }, [ownerControlToken, performanceId])

    useEffect(() => {
        const timer = setInterval(() => {
            if (performance) {
                const now = Date.now()
                const start = new Date(performance.startTime).getTime()
                const end = performance.endTime ? new Date(performance.endTime).getTime() : null
                const status = getEffectiveStatus(performance)
                if (status === 'live' && end) {
                    setElapsedTime(Math.max(0, Math.floor((end - now) / 1000)))
                } else {
                    setElapsedTime(0)
                }
                if ((start - now) <= 10 * 60 * 1000 || status === 'live') setCanOpenChat(true)
                if (end && !isAlertSent && socketRef.current && chatStatus === 'open') {
                    if ((end - now) <= 5 * 60 * 1000) {
                        void emitOwnerControlEvent('system_alert', {
                            performanceId: performance.id,
                            message: t('live.ending_soon')
                        })
                        setIsAlertSent(true)
                    }
                }
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [performance, isAlertSent, chatStatus, t, emitOwnerControlEvent])

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center italic">{t('common.loading')}</div>
    if (fetchError || !performance) return <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-4"><h1 className="text-xl font-bold text-red-500">{t('common.error')}</h1><p>{fetchError || t('live.not_found')}</p></div>

    const formatTime = (s: number) => {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const seconds = s % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const handleEndPerformance = () => {
        setConfirmModal({
            isOpen: true,
            title: t('live.header.confirm_end'),
            message: t('live.header.confirm_end'),
            onConfirm: async () => {
                await emitOwnerControlEvent('performance_ended', { performanceId })
                await updatePerformanceStatus(performanceId!, 'completed')
                router.push('/singer/dashboard')
            }
        })
    }

    const handleAcceptRequest = async (id: string) => {
        if (processingRequestIds.has(id)) return
        setProcessingRequestIds(p => new Set(p).add(id))
        try {
            const req = requests.find(r => r.id === id)
            if (req) {
                await emitOwnerControlEvent('system_alert', {
                    performanceId: performance.id,
                    message: t('live.requests.accepted_alert').replace('{title}', req.title).replace('{artist}', req.artist || '')
                })
            }
            await acceptSongRequest(id, performance.singerId)
            await refreshData()
        } finally {
            setProcessingRequestIds(p => { const n = new Set(p); n.delete(id); return n })
        }
    }

    const handleRejectRequest = async (id: string) => {
        if (processingRequestIds.has(id)) return
        setProcessingRequestIds(p => new Set(p).add(id))
        try { await rejectSongRequest(id); await refreshData() }
        finally { setProcessingRequestIds(p => { const n = new Set(p); n.delete(id); return n }) }
    }

    const handleToggleSongStatus = async (id: string, cur: string) => {
        if (togglingStatusIds.has(id)) return
        const next = cur === 'completed' ? 'pending' : 'completed'
        setTogglingStatusIds(p => new Set(p).add(id))
        optimisticStatusRef.current[id] = next
        setPerformance((p: any) => ({ ...p, songs: p.songs.map((s: any) => s.id === id ? { ...s, status: next } : s) }))
        try {
            // First, update the database
            await updateSongStatus(performanceId!, id, next as any)
            
            // Short delay to ensure revalidatePath completes and DB is ready
            await new Promise(r => setTimeout(r, 100));
            
            // ONLY emit the socket event AFTER the DB is updated
            await emitOwnerControlEvent('song_status_updated', { performanceId, songId: id, status: next })
            
            delete optimisticStatusRef.current[id]
            await refreshData()
        } catch (e) {
            delete optimisticStatusRef.current[id]
            await refreshData()
        } finally {
            setTogglingStatusIds(p => { const n = new Set(p); n.delete(id); return n })
        }
    }

    const handleMoveSong = async (from: number, to: number) => {
        const ns = [...performance.songs]
        const [m] = ns.splice(from, 1)
        ns.splice(to, 0, m)
        setPerformance({ ...performance, songs: ns })
        await updateSetlistOrder(performanceId!, ns.map(s => s.id))
        if (socketRef.current) socketRef.current.emit('song_status_updated', { performanceId })
    }

    const handleRemoveSong = async (id: string) => {
        const ns = performance.songs.filter((s: any) => s.id !== id)
        setPerformance({ ...performance, songs: ns })
        await updatePerformanceSetlist({ performanceId: performanceId!, singerId: performance.singerId, songIds: ns.map((s: any) => s.id) })
        await emitOwnerControlEvent('song_status_updated', { performanceId })
        await refreshData()
    }

    const handleAddSong = async (id: string) => {
        if (addingSongId) return
        setAddingSongId(id)
        try {
            const added = allSongs.find(s => s.id === id)
            if (added) setPerformance((p: any) => ({ ...p, songs: [...p.songs, { ...added, status: 'pending' }] }))
            const ids = [...performance.songs.map((s: any) => s.id), id]
            await updatePerformanceSetlist({ performanceId: performanceId!, singerId: performance.singerId, songIds: ids })
            await emitOwnerControlEvent('song_status_updated', { performanceId })
            await refreshData()
            setShowAddModal(false)
        } finally { setAddingSongId(null) }
    }

    const handleManualAddSong = async () => {
        if (!manualSongTitle.trim() || !performanceId) return
        await createSongRequest({ performanceId, title: manualSongTitle, artist: manualSongArtist || t('common.anonymous') })
        await refreshData()
        setActiveTab('requests')
        setShowAddModal(false)
        setManualSongTitle(''); setManualSongArtist('')
    }

    const pendingRequests = requests.filter(r => r.status === 'pending')

    return (
        <div className="bg-[#0f1117] text-slate-100 h-[100dvh] flex flex-col w-full md:max-w-[100vw] mx-auto font-display overflow-hidden selection:bg-indigo-500/30">
            <header className="px-4 py-3 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-4 min-w-0">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 bg-white/5 border border-white/10 text-indigo-400" title={t('common.home_button')}>
                        <Home className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => router.push('/singer/dashboard')}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95 bg-white/5 border border-white/10"
                        title={t('home.dashboard_button')}
                    >
                        <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 truncate tracking-tight uppercase italic">{performance.title}</h1>
                        <div className="flex items-center gap-2 text-[10px] md:text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border ${realtimeStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${realtimeStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></span>
                                {realtimeStatus === 'connected' ? t('common.realtime_ok') : t('common.realtime_err')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="hidden lg:flex flex-col items-end justify-center px-4 border-r border-white/5 bg-black/20 rounded-xl mr-2">
                        <div className="flex items-center gap-1.5 text-amber-400">
                            <Coins className="w-3.5 h-3.5" />
                            <span className="text-sm font-mono font-black">{userPoints.toLocaleString()}P</span>
                        </div>
                    </div>
                        {!performance?.chatEnabled && (
                            <button
                                onClick={() => handleOpenChat(true)}
                                disabled={isEnablingChat}
                                className="hidden md:flex bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-2.5 rounded-xl text-xs font-black items-center gap-2 transition-all border border-amber-500/30 shadow-lg shadow-amber-500/5"
                            >
                                {isEnablingChat ? <RotateCcw className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                                {t('chat.open_with_points')}
                            </button>
                        )}
                    <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-white/5">
                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-0.5">{t('live.header.viewing')}</div>
                        <div className="text-xl font-mono font-black text-indigo-400 leading-none">{viewingCount}</div>
                    </div>
                    <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-white/5">
                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em] mb-0.5">{t('live.header.time_left')}</div>
                        <div className="text-xl font-mono font-black text-emerald-400 leading-none">{formatTime(elapsedTime)}</div>
                    </div>
                    <button
                        onClick={handleEndPerformance}
                        className="bg-red-600/90 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all active:scale-95 border border-red-500/50"
                    >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('live.header.end_btn')}</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Selectors */}
            <div className="flex md:hidden bg-gray-950/40 border-b border-white/5 shrink-0 p-1 gap-1">
                <button
                    onClick={() => setActiveTab('setlist')}
                    className={`flex-1 py-3 text-xs font-black transition-all rounded-lg ${activeTab === 'setlist' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t('live.tabs.setlist')}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-3 text-xs font-black transition-all rounded-lg relative ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t('live.tabs.requests')}
                    {pendingRequests.length > 0 && (
                        <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-bounce shadow-lg">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
                {performance?.chatEnabled ? (
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-3 text-xs font-black transition-all rounded-lg ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {t('live.tabs.chat')}
                    </button>
                ) : (
                    <button
                        onClick={() => handleOpenChat(true)}
                        disabled={isEnablingChat}
                        className="flex-1 py-3 text-xs font-black transition-all rounded-lg text-amber-500 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2"
                    >
                        {isEnablingChat ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                        {t('common.points')}
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-0 relative">
                {isMobile ? (
                    /* MOBILE VIEW: Single tab content taking 100% width */
                    <div className="h-full overflow-hidden">
                        {activeTab === 'setlist' && (
                            <div className="h-full flex flex-col p-4 space-y-5 overflow-y-auto custom-scrollbar bg-gray-950/20">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <List className="w-6 h-6 text-indigo-500" />
                                        <span>{t('live.setlist.title')}</span>
                                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold ml-1">{performance.songs.length}</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsReordering(!isReordering)}
                                            className={`p-2 rounded-xl border transition-all ${isReordering ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            title={t('live.setlist.reorder_hint')}
                                        >
                                            <GripVertical className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
                                            title={t('live.setlist.add_button')}
                                        >
                                            <Plus className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {performance.songs.map((s: any, i: number) => (
                                        <div key={s.id} className={`group relative bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 ${s.status === 'completed' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm text-white truncate leading-tight mb-0.5">{s.title}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.artist}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleToggleSongStatus(s.id, s.status)} className={`p-2 rounded-xl border transition-all duration-300 ${s.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    {isReordering && (
                                                        <div className="flex flex-col gap-1">
                                                            <button disabled={i === 0} onClick={() => handleMoveSong(i, i - 1)} className="p-1 hover:bg-white/10 rounded-md text-gray-400 disabled:opacity-20"><Plus className="w-3 h-3 rotate-45" /></button>
                                                            <button disabled={i === performance.songs.length - 1} onClick={() => handleMoveSong(i, i + 1)} className="p-1 hover:bg-white/10 rounded-md text-gray-400 disabled:opacity-20"><Plus className="w-3 h-3 rotate-180" /></button>
                                                        </div>
                                                    )}
                                                    <DeleteSongButton songId={s.id} onRemove={handleRemoveSong} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'requests' && (
                            <div className="h-full flex flex-col p-4 space-y-5 overflow-y-auto custom-scrollbar bg-gray-900/10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6 text-indigo-500" />
                                        <span>{t('live.requests.title')}</span>
                                        {pendingRequests.length > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold ml-1 animate-pulse">{pendingRequests.length}</span>}
                                    </h2>
                                    <button onClick={refreshRequests} disabled={isRefreshingRequests} className={`p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-all ${isRefreshingRequests ? 'animate-spin' : ''}`}><RotateCcw className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    {pendingRequests.map((r: any) => (
                                        <div key={r.id} className="relative group overflow-hidden bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all">
                                            <div className="absolute top-0 right-0 p-3"><span className="text-[9px] font-black text-gray-600 font-mono tracking-tighter bg-white/5 px-2 py-0.5 rounded">#{r.id.slice(-4).toUpperCase()}</span></div>
                                            <div className="mb-4"><p className="font-black text-base text-white leading-tight mb-1">{r.title}</p><p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{r.artist}</p></div>
                                            <div className="flex items-center gap-3 mb-5 p-2 rounded-xl bg-gray-950/40">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center"><UserIcon className="w-3.5 h-3.5 text-indigo-400" /></div>
                                                <span className="text-[11px] text-gray-300 font-bold truncate">{r.requesterName}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAcceptRequest(r.id)} className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-700 py-2.5 rounded-xl text-xs font-black text-white">{t('live.requests.accept')}</button>
                                                <button onClick={() => handleRejectRequest(r.id)} className="bg-white/5 px-3 rounded-xl border border-white/10 hover:text-red-400 transition-all"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingRequests.length === 0 && <div className="py-12 flex flex-col items-center justify-center text-center opacity-20"><MessageCircle className="w-12 h-12 mb-4" /><p className="text-sm font-bold">{t('live.requests.empty')}</p></div>}
                                </div>
                            </div>
                        )}
                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col bg-black relative">
                                {chatStatus === 'closed' && (
                                    <div className="absolute inset-0 z-[15] bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20"><MessageSquare className="w-10 h-10 text-indigo-500" /></div>
                                        <h3 className="text-2xl font-black mb-2 text-white italic tracking-tight">{t('chat.closed_title')}</h3>
                                        <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[240px] italic">{t('live.chat_ready_desc')}</p>
                                        <button disabled={!canOpenChat || isEnablingChat} onClick={() => handleOpenChat(false)} className={`px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all w-full max-w-[200px] ${canOpenChat ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
                                            {canOpenChat ? t('chat.open_button') : t('chat.not_ready')}
                                        </button>
                                    </div>
                                )}
                                <ChatBox performanceId={performanceId!} username="Singer" userType="singer" controlToken={ownerControlToken} socket={socket} className="flex-1 !rounded-none !border-0" onViewingCountChange={setViewingCount} onChatStatusChange={setChatStatus} onAcceptRequest={(t) => { const r = requests.find(x => x.title === t && x.status === 'pending'); if (r) handleAcceptRequest(r.id) }} onRejectRequest={(t) => { const r = requests.find(x => x.title === t && x.status === 'pending'); if (r) handleRejectRequest(r.id) }} />
                            </div>
                        )}
                    </div>
                ) : (
                    /* DESKTOP VIEW: Multi-panel resizable layout */
                    <PanelGroup orientation="horizontal" className="h-full">
                        {/* COLUMN 1: SETLIST */}
                        <Panel
                            defaultSize={33}
                            minSize={20}
                            className="flex flex-col border-r border-white/5 bg-gray-950/20 relative z-10"
                        >
                            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <List className="w-6 h-6 text-indigo-500" />
                                        <span>{t('live.setlist.title')}</span>
                                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold ml-1">{performance.songs.length}</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsReordering(!isReordering)}
                                            className={`p-2 rounded-xl border transition-all ${isReordering ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            title={t('live.setlist.reorder_hint')}
                                        >
                                            <GripVertical className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowAddModal(true)}
                                            className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all border border-indigo-400/30"
                                            title={t('live.setlist.add_button')}
                                        >
                                            <Plus className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {performance.songs.map((s: any, i: number) => (
                                        <div
                                            key={s.id}
                                            className={`group relative bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 ${s.status === 'completed' ? 'opacity-40 grayscale-[0.5]' : ''}`}
                                        >
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-sm text-white truncate leading-tight mb-0.5">{s.title}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.artist}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleSongStatus(s.id, s.status)}
                                                        className={`p-2 rounded-xl border transition-all duration-300 ${s.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-indigo-500/50 hover:text-indigo-400'}`}
                                                        title={s.status === 'completed' ? t('performance.status.completed') : t('performance.status.scheduled')}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    {isReordering && (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                disabled={i === 0}
                                                                onClick={() => handleMoveSong(i, i - 1)}
                                                                className="p-1 hover:bg-white/10 rounded-md text-gray-400 disabled:opacity-20 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3 rotate-45" />
                                                            </button>
                                                            <button
                                                                disabled={i === performance.songs.length - 1}
                                                                onClick={() => handleMoveSong(i, i + 1)}
                                                                className="p-1 hover:bg-white/10 rounded-md text-gray-400 disabled:opacity-20 transition-all"
                                                            >
                                                                <Plus className="w-3 h-3 rotate-180" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <DeleteSongButton songId={s.id} onRemove={handleRemoveSong} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Panel>

                        <PanelResizeHandle className="w-px bg-white/5 hover:bg-indigo-600/50 transition-colors z-20" />

                        {/* COLUMN 2: REQUESTS */}
                        <Panel
                            defaultSize={33}
                            minSize={20}
                            className="flex flex-col border-r border-white/5 bg-gray-900/10"
                        >
                            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6 text-indigo-500" />
                                        <span>{t('live.requests.title')}</span>
                                        {pendingRequests.length > 0 && (
                                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </h2>
                                    <button
                                        onClick={refreshRequests}
                                        disabled={isRefreshingRequests}
                                        className={`p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-all ${isRefreshingRequests ? 'animate-spin' : 'hover:scale-110 active:scale-95'}`}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {pendingRequests.map((r: any) => (
                                        <div key={r.id} className="relative group overflow-hidden bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
                                            <div className="absolute top-0 right-0 p-3">
                                                <span className="text-[9px] font-black text-gray-600 font-mono tracking-tighter bg-white/5 px-2 py-0.5 rounded">#{r.id.slice(-4).toUpperCase()}</span>
                                            </div>

                                            <div className="mb-4">
                                                <p className="font-black text-base text-white leading-tight mb-1">{r.title}</p>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{r.artist}</p>
                                            </div>

                                            <div className="flex items-center gap-3 mb-5 p-2 rounded-xl bg-gray-950/40">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                                                </div>
                                                <span className="text-[11px] text-gray-300 font-bold truncate">{r.requesterName}</span>
                                            </div>

                                            {processingRequestIds.has(r.id) ? (
                                                <div className="w-full bg-indigo-500/10 h-10 rounded-xl animate-pulse flex items-center justify-center">
                                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptRequest(r.id)}
                                                        className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-700 py-2.5 rounded-xl text-xs font-black text-white hover:from-indigo-400 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-600/10 active:scale-95 border border-indigo-400/20"
                                                    >
                                                        {t('live.requests.accept')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(r.id)}
                                                        className="bg-white/5 px-3 rounded-xl border border-white/10 hover:bg-white/10 hover:text-red-400 transition-all active:scale-95"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {pendingRequests.length === 0 && (
                                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-20">
                                            <MessageCircle className="w-12 h-12 mb-4" />
                                            <p className="text-sm font-bold">{t('live.requests.empty')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Panel>

                        <PanelResizeHandle className="w-px bg-white/5 hover:bg-indigo-600/50 transition-colors z-20" />

                        {/* COLUMN 3: CHAT */}
                        <Panel
                            defaultSize={34}
                            minSize={25}
                            className="flex flex-col bg-black relative shadow-2xl z-10"
                        >
                            {chatStatus === 'closed' && (
                                <div className="absolute inset-0 z-[15] bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                                        <MessageSquare className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 text-white italic tracking-tight">{t('chat.closed_title')}</h3>
                                    <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[240px] italic">{t('live.chat_ready_desc')}</p>
                                    <button
                                        disabled={!canOpenChat || isEnablingChat}
                                        onClick={() => handleOpenChat(false)}
                                        className={`px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all w-full max-w-[200px] shadow-xl ${canOpenChat ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 shadow-indigo-600/30' : 'bg-white/5 text-gray-600 cursor-not-allowed grayscale'}`}
                                    >
                                        {canOpenChat ? t('chat.open_button') : t('chat.not_ready')}
                                    </button>
                                </div>
                            )}
                            <ChatBox
                                performanceId={performanceId!}
                                username="Singer"
                                userType="singer"
                                controlToken={ownerControlToken}
                                socket={socket}
                                className="flex-1 !rounded-none !border-0"
                                onViewingCountChange={setViewingCount}
                                onChatStatusChange={setChatStatus}
                                onAcceptRequest={(t) => { const r = requests.find(x => x.title === t && x.status === 'pending'); if (r) handleAcceptRequest(r.id) }}
                                onRejectRequest={(t) => { const r = requests.find(x => x.title === t && x.status === 'pending'); if (r) handleRejectRequest(r.id) }}
                            />
                        </Panel>
                    </PanelGroup>
                )}
            </div>

            {/* Bottom Bar Mobile Stats */}
            <div className="md:hidden p-4 border-t border-gray-800 bg-gray-900 grid grid-cols-2 gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800/50 rounded-xl border border-gray-800">
                    <div className="flex items-center text-gray-500 text-[9px] uppercase font-bold tracking-widest mb-1"><Clock className="w-3 h-3 mr-1" /> {t('live.stats.remaining')}</div>
                    <p className="text-xl font-mono font-bold text-green-400">{formatTime(elapsedTime)}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800/50 rounded-xl border border-gray-800">
                    <div className="flex items-center text-gray-500 text-[9px] uppercase font-bold tracking-widest mb-1"><UserIcon className="w-3 h-3 mr-1 text-indigo-400" /> {t('live.header.viewing')}</div>
                    <p className="text-xl font-mono font-bold text-white">{viewingCount}</p>
                </div>
            </div>

            {/* Add Song Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white">{t('live.modal.title')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"><X className="w-4 h-4 text-gray-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            <div className="bg-gray-800/40 rounded-xl p-4 mb-6 border border-gray-800">
                                <h4 className="text-[10px] text-indigo-400 font-bold mb-3 uppercase tracking-widest">{t('live.modal.manual_entry')}</h4>
                                <div className="space-y-2">
                                    <input type="text" placeholder={t('live.modal.song_title')} value={manualSongTitle} onChange={e => setManualSongTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    <input type="text" placeholder={t('live.modal.artist_optional')} value={manualSongArtist} onChange={e => setManualSongArtist(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    <button onClick={handleManualAddSong} disabled={!manualSongTitle.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">{t('live.modal.add_song')}</button>
                                </div>
                            </div>

                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input type="text" placeholder={t('live.modal.search_repertoire')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 p-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="space-y-2">
                                {allSongs.filter(s => !performance.songs.some((ps: any) => ps.id === s.id) && (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.artist || '').toLowerCase().includes(searchQuery.toLowerCase()))).map(s => (
                                    <button key={s.id} onClick={() => handleAddSong(s.id)} disabled={addingSongId === s.id} className="w-full bg-gray-800/50 hover:bg-gray-800 p-3 rounded-xl flex justify-between items-center border border-gray-800 transition disabled:opacity-50">
                                        <div className="text-left"><p className="font-bold text-white text-sm">{s.title}</p><p className="text-[10px] text-gray-500">{s.artist}</p></div>
                                        {addingSongId === s.id ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4 text-indigo-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
        </div>
    )
}

function DeleteSongButton({ songId, onRemove }: { songId: string, onRemove: (id: string) => Promise<void> }) {
    const [confirming, setConfirming] = useState(false)
    const [_removing, setRemoving] = useState(false)
    useEffect(() => { if (!confirming) return; const t = setTimeout(() => setConfirming(false), 2000); return () => clearTimeout(t) }, [confirming])
    const handleClick = async () => { if (!confirming) { setConfirming(true); return }; setRemoving(true); await onRemove(songId); setRemoving(false); setConfirming(false) }
    return (
        <button onClick={handleClick} className={`p-1.5 rounded-lg transition text-[10px] font-bold flex items-center gap-1 ${confirming ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500 hover:text-red-400 border border-gray-700'}`}>
            <Trash2 className="w-4 h-4" />
            {confirming && <span>?</span>}
        </button>
    )
}

export default function LivePerformancePage() {
    const { t } = useLanguage()
    return (
        <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center italic">{t('common.loading')}</div>}>
            <LivePerformanceContent />
        </Suspense>
    )
}
