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
    updateSongStatus
} from '@/services/singer'
import { Music, Clock, MessageCircle, X, Check, Play, Pause, Plus, List, GripVertical, Search, Archive, ChevronRight, MessageSquare, User as UserIcon, Trash2, LayoutDashboard, LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import io, { Socket } from 'socket.io-client'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

function LivePerformanceContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const performanceId = searchParams.get('performanceId')

    // Data
    const [performance, setPerformance] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [allSongs, setAllSongs] = useState<any[]>([])
    const [fetchError, setFetchError] = useState<string | null>(null)

    // UI State
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
    const [requestsLastUpdated, setRequestsLastUpdated] = useState<Date | null>(null)
    const [isRefreshingRequests, setIsRefreshingRequests] = useState(false)
    const [addingSongId, setAddingSongId] = useState<string | null>(null)

    // Load Data
    const refreshData = useCallback(async () => {
        if (!performanceId) return
        try {
            const [perfData, reqData] = await Promise.all([
                getPerformanceById(performanceId),
                getPerformanceRequests(performanceId)
            ])
            if (!perfData) setFetchError('getPerformanceById returned NULL')

            // Merge optimistic statuses to prevent UI reversion
            if (perfData?.songs) {
                perfData.songs = perfData.songs.map((song: any) => {
                    const optimisticStatus = optimisticStatusRef.current[song.id]
                    if (optimisticStatus) {
                        return { ...song, status: optimisticStatus }
                    }
                    return song
                })
            }

            setPerformance(perfData)
            setRequests(reqData)
            setRequestsLastUpdated(new Date())

            if (perfData?.status === 'completed' || perfData?.status === 'canceled') {
                router.push('/singer/dashboard')
                return
            }

            if (perfData?.singerId) {
                const songs = await getSongs(perfData.singerId)
                setAllSongs(songs)
            }
        } catch (err: any) {
            console.error('[LivePerformance] Error:', err)
            setFetchError(err.message || 'Unknown error')
        }
    }, [performanceId])

    const refreshRequests = useCallback(async () => {
        if (!performanceId) return
        setIsRefreshingRequests(true)
        try {
            const reqData = await getPerformanceRequests(performanceId)
            setRequests(reqData)
            setRequestsLastUpdated(new Date())
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
        const realtimeServerUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
        if (!realtimeServerUrl || !performanceId) return

        if (!socketRef.current) {
            const singerSocket = io(realtimeServerUrl, {
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            })

            singerSocket.emit('join_room', {
                performanceId,
                username: 'singer',
                userType: 'singer'
            })

            singerSocket.on('song_requested', () => {
                refreshRequests()
                refreshData()
            })

            socketRef.current = singerSocket
        }
    }, [performanceId, refreshRequests, refreshData])

    useEffect(() => {
        const timer = setInterval(() => {
            if (performance) {
                const now = Date.now()
                const startTime = new Date(performance.startTime).getTime()
                const endTime = performance.endTime ? new Date(performance.endTime).getTime() : null

                // 1. Calculate Remaining Time based on endTime
                // If it's live, we show duration remaining
                if (performance.status === 'live' || now >= startTime) {
                    if (endTime) {
                        const diff = Math.floor((endTime - now) / 1000)
                        setElapsedTime(Math.max(0, diff))
                    } else {
                        // Fallback if no endTime is set (e.g., just show 0 or calculate a default 3 hours)
                        const defaultEndTime = startTime + (3 * 60 * 60 * 1000)
                        const diff = Math.floor((defaultEndTime - now) / 1000)
                        setElapsedTime(Math.max(0, diff))
                    }
                } else {
                    setElapsedTime(0)
                }

                // 2. Check for Chat Opening (10 mins before start)
                const timeToStart = startTime - now
                if (timeToStart <= 10 * 60 * 1000 || performance.status === 'live') {
                    setCanOpenChat(true)
                }

                // 3. System Alert for Ending Soon (5 mins before end)
                if (endTime && !isAlertSent && socketRef.current && chatStatus === 'open') {
                    const timeToEnd = endTime - now
                    if (timeToEnd > 0 && timeToEnd <= 5 * 60 * 1000) {
                        socketRef.current.emit('system_alert', {
                            performanceId: performance.id,
                            message: t('live.ending_soon')
                        })
                        setIsAlertSent(true)
                    }
                }
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [performance, isAlertSent, chatStatus, t])

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">{t('common.loading')}</div>
    if (fetchError) return <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4"><h1 className="text-xl font-bold text-red-500">Error Loading Performance</h1><p className="max-w-md text-center text-sm">{fetchError}</p></div>
    if (!performance) return <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4"><h1>Performance not found</h1></div>

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleEndPerformance = async () => {
        setConfirmModal({
            isOpen: true,
            title: t('live.header.confirm_end'),
            message: t('live.header.confirm_end'),
            onConfirm: async () => {
                if (socketRef.current) {
                    socketRef.current.emit('performance_ended', { performanceId })
                }
                await updatePerformanceStatus(performanceId!, 'completed')
                router.push('/singer/dashboard')
            }
        })
    }

    const handleAcceptRequest = async (reqId: string) => {
        if (processingRequestIds.has(reqId)) return
        setProcessingRequestIds(prev => new Set(prev).add(reqId))
        try {
            const req = requests.find(r => r.id === reqId)

            // Optimistic Socket Emission (so chat reacts instantly)
            if (req && socketRef.current) {
                socketRef.current.emit('system_alert', {
                    performanceId: performance.id,
                    message: t('live.requests.accepted_alert').replace('{title}', req.title).replace('{artist}', req.artist ? ` - ${req.artist}` : '')
                })
            }

            await acceptSongRequest(reqId, performance.singerId)
            await refreshData()
        } finally {
            setProcessingRequestIds(prev => {
                const next = new Set(prev)
                next.delete(reqId)
                return next
            })
        }
    }

    const handleRejectRequest = async (reqId: string) => {
        if (processingRequestIds.has(reqId)) return
        setProcessingRequestIds(prev => new Set(prev).add(reqId))
        try {
            await rejectSongRequest(reqId)
            await refreshData()
        } finally {
            setProcessingRequestIds(prev => {
                const next = new Set(prev)
                next.delete(reqId)
                return next
            })
        }
    }

    const handleToggleSongStatus = async (songId: string, currentStatus: string) => {
        if (togglingStatusIds.has(songId)) return
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

        setTogglingStatusIds(prev => new Set(prev).add(songId))
        optimisticStatusRef.current[songId] = newStatus // Save optimistic status

        setPerformance((prev: any) => ({
            ...prev,
            songs: prev.songs.map((s: any) => s.id === songId ? { ...s, status: newStatus } : s)
        }))

        try {
            if (socketRef.current) {
                socketRef.current.emit('song_status_updated', { performanceId, songId, status: newStatus })
            }
            await updateSongStatus(performanceId!, songId, newStatus as any)
            // Remove from optimistic ref AFTER server confirms, so next refresh gets real data
            delete optimisticStatusRef.current[songId]
            await refreshData()
        } catch (e) {
            delete optimisticStatusRef.current[songId]
            setPerformance((prev: any) => ({
                ...prev,
                songs: prev.songs.map((s: any) => s.id === songId ? { ...s, status: currentStatus } : s)
            }))
        } finally {
            setTogglingStatusIds(prev => {
                const next = new Set(prev)
                next.delete(songId)
                return next
            })
        }
    }

    const handleMoveSong = async (fromIndex: number, toIndex: number) => {
        if (!performance) return
        const newSongs = [...performance.songs]
        const [moved] = newSongs.splice(fromIndex, 1)
        newSongs.splice(toIndex, 0, moved)
        setPerformance({ ...performance, songs: newSongs })
        const ids = newSongs.map(s => s.id)
        await updateSetlistOrder(performanceId!, ids)
    }

    const handleRemoveSong = async (songId: string) => {
        if (!performance) return
        const newSongs = performance.songs.filter((s: any) => s.id !== songId)
        setPerformance({ ...performance, songs: newSongs })
        await updatePerformanceSetlist({
            performanceId: performanceId!,
            singerId: performance.singerId,
            songIds: newSongs.map((s: any) => s.id)
        })
        if (socketRef.current) socketRef.current.emit('song_status_updated', { performanceId })
        await refreshData()
    }

    const handleAddSong = async (songId: string) => {
        if (!performance || addingSongId) return
        setAddingSongId(songId)
        try {
            const addedSong = allSongs.find(s => s.id === songId)
            if (addedSong) {
                // Optimistic Update
                setPerformance((prev: any) => ({
                    ...prev,
                    songs: [...prev.songs, { ...addedSong, status: 'pending' }]
                }))
            }
            const newIds = [...performance.songs.map((s: any) => s.id), songId]
            await updatePerformanceSetlist({
                performanceId: performanceId!,
                singerId: performance.singerId,
                songIds: newIds
            })
            if (socketRef.current) socketRef.current.emit('song_status_updated', { performanceId })
            await refreshData()
            setShowAddModal(false)
        } finally {
            setAddingSongId(null)
        }
    }

    const handleManualAddSong = async () => {
        if (!manualSongTitle.trim() || !performanceId) return
        await createSongRequest({
            performanceId: performanceId,
            title: manualSongTitle,
            artist: manualSongArtist || 'Unknown',
            requesterName: 'Singer'
        })
        await refreshData()
        setActiveTab('requests')
        setShowAddModal(false)
        setManualSongTitle('')
        setManualSongArtist('')
    }

    const pendingRequests = requests.filter(r => r.status === 'pending')

    return (
        <div className="h-[100dvh] bg-black text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="p-4 pl-16 md:pl-20 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-20 shadow-xl">
                <div className="flex-1 min-w-0 mr-4">
                    <h1 className="text-lg md:text-xl font-bold text-white truncate">{performance.title}</h1>
                    <p className="text-xs md:text-sm text-gray-400 truncate">{performance.locationText}</p>
                </div>
                <div className="flex space-x-2 shrink-0">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('ignore_resume_check', 'true')
                            router.push('/singer/dashboard')
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:px-4 md:py-2 rounded-lg font-bold text-sm transition flex items-center gap-2"
                        title="Go to Dashboard"
                    >
                        <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">Dashboard</span>
                    </button>
                    <button
                        onClick={handleEndPerformance}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 md:px-4 md:py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-red-900/20 flex items-center gap-2"
                        title={t('live.header.end_button')}
                    >
                        <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline">{t('live.header.end_button')}</span>
                    </button>
                </div>
            </div>

            {/* Tabs - MOBILE ONLY */}
            <div className={`md:hidden grid ${performance.chatEnabled ? 'grid-cols-3' : 'grid-cols-2'} bg-gray-900 border-b border-gray-800 shrink-0`}>
                <button
                    onClick={() => setActiveTab('setlist')}
                    className={`p-3 text-center transition ${activeTab === 'setlist' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="font-bold block text-sm">{t('live.tabs.setlist')} ({performance.songs.length})</span>
                </button>
                <button
                    onClick={() => { setActiveTab('requests'); refreshRequests() }}
                    className={`p-3 text-center transition ${activeTab === 'requests' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <div className="flex items-center justify-center space-x-1">
                        <span className="font-bold text-sm">{t('live.tabs.requests')}</span>
                        {pendingRequests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingRequests.length}</span>
                        )}
                    </div>
                </button>
                {performance.chatEnabled && (
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`p-3 text-center transition ${activeTab === 'chat' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <div className="flex items-center justify-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-bold text-sm">{t('chat.title')}</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative mobile-panel-override">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 767px) {
                        .mobile-panel-override [data-panel-group] > [data-panel] {
                            flex: 1 1 100% !important;
                            min-width: 100% !important;
                            max-width: 100% !important;
                        }
                    }
                `}} />
                <PanelGroup orientation="horizontal">
                    <Panel
                        defaultSize={65}
                        minSize={30}
                        className={`${activeTab === 'chat' ? 'hidden md:block' : 'block'} flex flex-col`}
                    >
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar">
                            {/* PC Headers */}
                            <div className="hidden md:flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-600/20 p-2 rounded-lg"><Music className="w-6 h-6 text-indigo-400" /></div>
                                    <h2 className="text-2xl font-bold">Performance Manager</h2>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{t('live.stats.remaining')}</span>
                                        <span className="text-xl font-mono text-green-400">{formatTime(elapsedTime)}</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-800 mx-2" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Watching</span>
                                        <span className="text-xl font-mono text-white">{viewingCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Setlist Selection */}
                            <div className={activeTab === 'setlist' ? 'block' : 'hidden md:block'}>
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <List className="w-5 h-5 text-indigo-400" />
                                        <h2 className="text-lg font-bold">Setlist ({performance.songs.length})</h2>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => setIsReordering(!isReordering)} className={`p-2 rounded-lg transition-colors ${isReordering ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><GripVertical className="w-5 h-5" /></button>
                                        <button onClick={() => setShowAddModal(true)} className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors"><Plus className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {isReordering && (
                                    <p className="text-xs text-indigo-400 mb-4 bg-indigo-600/10 p-2 rounded border border-indigo-600/20 italic">{t('live.setlist.reorder_hint')}</p>
                                )}

                                <div className="space-y-3">
                                    {performance.songs.length === 0 ? (
                                        <div className="p-12 text-center text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                                            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>{t('live.setlist.empty')}</p>
                                        </div>
                                    ) : (
                                        performance.songs.map((song: any, index: number) => (
                                            <div key={song.id} className="bg-gray-800/80 p-3 lg:p-4 rounded-xl flex items-center justify-between border border-gray-700 group">
                                                <div className="flex items-center flex-1 min-w-0">
                                                    <span className={`text-indigo-500 font-mono mr-3 w-6 text-center text-lg font-bold ${song.status === 'completed' ? 'opacity-30' : ''}`}>{index + 1}</span>
                                                    <div className={`truncate ${song.status === 'completed' ? 'opacity-30 line-through' : ''}`}>
                                                        <h3 className="text-white font-bold text-lg truncate pr-2">{song.title}</h3>
                                                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isReordering ? (
                                                        <div className="flex flex-col space-y-1">
                                                            <button disabled={index === 0} onClick={() => handleMoveSong(index, index - 1)} className="bg-gray-700 p-1 rounded hover:bg-indigo-600 disabled:opacity-30 transition-colors">▲</button>
                                                            <button disabled={index === performance.songs.length - 1} onClick={() => handleMoveSong(index, index + 1)} className="bg-gray-700 p-1 rounded hover:bg-indigo-600 disabled:opacity-30 transition-colors">▼</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleSongStatus(song.id, song.status)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${song.status === 'completed' ? 'bg-gray-700 text-gray-400' : 'bg-green-600/20 text-green-400 border border-green-600/30'}`}
                                                            >
                                                                {song.status === 'completed' ? 'Undo' : 'Complete'}
                                                            </button>
                                                            {song.youtubeUrl && <a href={song.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs bg-red-900/30 text-red-400 px-2 py-1.5 rounded border border-red-900/50">YT</a>}
                                                            <DeleteSongButton songId={song.id} onRemove={handleRemoveSong} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <hr className="lg:my-8 border-gray-800" />

                            {/* Requests Selection */}
                            <div className={activeTab === 'requests' ? 'block' : 'hidden md:block'}>
                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                                        <h2 className="text-lg font-bold">Requests ({pendingRequests.length})</h2>
                                    </div>
                                    <button onClick={refreshRequests} className="flex items-center gap-1 text-xs text-indigo-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                                        <Play className={`w-3.5 h-3.5 ${isRefreshingRequests ? 'animate-spin' : ''}`} /> Refresh
                                    </button>
                                </div>

                                {requests.length === 0 ? (
                                    <div className="p-12 text-center text-gray-600 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>{t('live.requests.empty')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {requests.map((req: any) => (
                                            <div key={req.id} className={`p-4 rounded-xl border ${req.status === 'pending' ? 'bg-gray-800/90 border-indigo-500/50 shadow-lg shadow-indigo-900/10' : 'bg-gray-900/50 border-gray-800 opacity-70'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{req.title}</h3>
                                                        <p className="text-gray-400 text-sm">{req.artist}</p>
                                                        {req.requesterName && <p className="text-indigo-400 text-[10px] font-bold mt-1 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block">{t('song_request.request_by')} {req.requesterName}</p>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-indigo-900 text-indigo-300 border border-indigo-700' : req.status === 'accepted' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>{req.status}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">{new Date(req.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                                    </div>
                                                </div>
                                                {req.status === 'pending' && (
                                                    <div className="flex space-x-2 mt-2">
                                                        <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"><Check className="w-4 h-4 mr-1" /> Accept</button>
                                                        <button onClick={() => handleRejectRequest(req.id)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"><X className="w-4 h-4 mr-1" /> Reject</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="hidden md:flex w-1 bg-gray-800 hover:bg-indigo-600 transition-colors items-center justify-center group">
                        <div className="w-0.5 h-8 bg-gray-700 group-hover:bg-indigo-400 rounded-full" />
                    </PanelResizeHandle>

                    {performance.chatEnabled && (
                        <Panel defaultSize={35} minSize={20} className={`${activeTab === 'chat' ? 'block' : 'hidden md:flex'} flex flex-col border-l border-gray-800 bg-black`}>
                            <div className="hidden md:flex items-center gap-2 p-5 border-b border-gray-800 bg-gray-900/80 shrink-0">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg"><MessageSquare className="w-5 h-5 text-indigo-400" /></div>
                                <h2 className="text-lg font-bold">Live Chat Room</h2>
                            </div>
                            <div className="flex-1 relative overflow-hidden flex flex-col">
                                {chatStatus === 'closed' && (
                                    <div className="absolute inset-0 z-10 bg-gray-900/95 flex flex-col items-center justify-center p-6 text-center">
                                        <div className="bg-gray-800 p-4 rounded-full mb-4"><MessageSquare className="w-10 h-10 text-gray-500" /></div>
                                        <h3 className="text-xl font-bold mb-2 text-white">{t('chat.closed_title')}</h3>
                                        <p className="text-gray-400 mb-6 text-sm max-w-[280px]">{t('chat.closed_desc')}</p>
                                        <button disabled={!canOpenChat} onClick={() => socketRef.current?.emit('open_chat', { performanceId: performance.id })} className={`px-6 py-3 rounded-xl font-bold text-white transition-all w-full max-w-xs ${canOpenChat ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>{canOpenChat ? t('chat.open_button') : t('chat.not_ready')}</button>
                                    </div>
                                )}
                                <ChatBox
                                    performanceId={performanceId!}
                                    username="Singer"
                                    userType="singer"
                                    className="flex-1"
                                    onViewingCountChange={setViewingCount}
                                    onChatStatusChange={setChatStatus}
                                    onAcceptRequest={(title) => {
                                        const req = requests.find(r => r.title === title && r.status === 'pending')
                                        if (req) handleAcceptRequest(req.id)
                                    }}
                                    onRejectRequest={(title) => {
                                        const req = requests.find(r => r.title === title && r.status === 'pending')
                                        if (req) handleRejectRequest(req.id)
                                    }}
                                />
                            </div>
                        </Panel>
                    )}
                </PanelGroup>
            </div>

            {/* Stats Bar - MOBILE */}
            <div className="md:hidden p-4 border-t border-gray-800 bg-gray-900 grid grid-cols-2 gap-4 safe-area-bottom z-20 shrink-0">
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex items-center text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1"><Clock className="w-3 h-3 mr-1" /> {t('live.stats.remaining')}</div>
                    <p className="text-2xl font-mono font-bold text-green-400">{formatTime(elapsedTime)}</p>
                </div>
                <button onClick={() => setActiveTab('requests')} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex items-center text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1"><UserIcon className="w-3 h-3 mr-1 text-indigo-400" /> Watching</div>
                    <p className="text-2xl font-mono font-bold text-white">{viewingCount}</p>
                </button>
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-2xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-2xl">
                            <h3 className="text-xl font-bold text-white">{t('live.modal.title')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar">
                            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-indigo-500/20">
                                <h4 className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-3">{t('live.modal.add_new')}</h4>
                                <div className="space-y-3">
                                    <input type="text" placeholder="Song Title" value={manualSongTitle} onChange={(e) => setManualSongTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none" />
                                    <input type="text" placeholder="Artist" value={manualSongArtist} onChange={(e) => setManualSongArtist(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm outline-none" />
                                    <button onClick={handleManualAddSong} disabled={!manualSongTitle.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20">Add to Requests</button>
                                </div>
                            </div>
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-3 text-gray-600 font-bold tracking-widest">Or Repertoire</span></div>
                            </div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="text" placeholder={t('live.modal.search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none" />
                            </div>
                            <div className="space-y-2">
                                {allSongs.filter(s => !performance.songs.some((ps: any) => ps.id === s.id) && (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()))).map(song => (
                                    <button key={song.id} onClick={() => handleAddSong(song.id)} disabled={addingSongId === song.id} className="w-full bg-gray-800/40 p-3 rounded-xl flex justify-between items-center hover:bg-indigo-600/20 border border-gray-700 transition-all group disabled:opacity-50">
                                        <div className="text-left"><p className="font-bold text-white group-hover:text-indigo-200">{song.title}</p><p className="text-[11px] text-gray-500">{song.artist}</p></div>
                                        <div className="bg-gray-900 p-1.5 rounded-lg group-hover:bg-indigo-600">
                                            {addingSongId === song.id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4 text-gray-400 group-hover:text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}

function DeleteSongButton({ songId, onRemove }: { songId: string, onRemove: (id: string) => Promise<void> }) {
    const [confirming, setConfirming] = useState(false)
    const [removing, setRemoving] = useState(false)
    useEffect(() => {
        if (!confirming) return
        const timer = setTimeout(() => setConfirming(false), 2000)
        return () => clearTimeout(timer)
    }, [confirming])
    const handleClick = async () => {
        if (!confirming) { setConfirming(true); return }
        setRemoving(true)
        await onRemove(songId)
        setRemoving(false)
        setConfirming(false)
    }
    if (removing) return <button disabled className="p-1.5 rounded-lg bg-red-900/30 text-red-500 opacity-50"><Trash2 className="w-4 h-4 animate-pulse" /></button>
    return (
        <button onClick={handleClick} className={`p-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 ${confirming ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700/60 text-gray-500 hover:bg-red-900/40 hover:text-red-400'}`}>
            <Trash2 className="w-4 h-4" />
            {confirming && <span>Sure?</span>}
        </button>
    )
}

export default function LivePerformancePage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <LivePerformanceContent />
        </Suspense>
    )
}
