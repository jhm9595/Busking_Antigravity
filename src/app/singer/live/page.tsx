'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'

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
    addSong
} from '@/services/singer'
import { Music, Clock, MessageCircle, X, Check, Play, Pause, Plus, List, GripVertical, Search, Archive, ChevronRight, MessageSquare, User as UserIcon, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import ChatBox from '@/components/chat/ChatBox'
import { DropResult } from '@hello-pangea/dnd'
import io, { Socket } from 'socket.io-client'

import LiveHeader from '@/components/live/LiveHeader'
import SetlistTab from '@/components/live/SetlistTab'
import RequestsTab from '@/components/live/RequestsTab'

// We need a server action to add ad-hoc song? singer.ts has addSong.
// Let's assume we can use addSong then updateSetlist. Or make a new composite function.
// For now, I'll use a client-side wrapper in handleManualAddSong that calls addSong then adds to setlist.

function LivePerformanceContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const performanceId = searchParams.get('performanceId')

    // Data
    const [performance, setPerformance] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [allSongs, setAllSongs] = useState<any[]>([])

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
    const [activeSocket, setActiveSocket] = useState<any>(null)
    const [isAlertSent, setIsAlertSent] = useState(false)
    const [canOpenChat, setCanOpenChat] = useState(false)
    const [processingRequestIds, setProcessingRequestIds] = useState<Set<string>>(new Set())
    const [togglingStatusIds, setTogglingStatusIds] = useState<Set<string>>(new Set())
    const [requestsLastUpdated, setRequestsLastUpdated] = useState<Date | null>(null)
    const [isRefreshingRequests, setIsRefreshingRequests] = useState(false)

    // Load Data
    const refreshData = useCallback(async () => {
        if (!performanceId) return
        const [perfData, reqData] = await Promise.all([
            getPerformanceById(performanceId),
            getPerformanceRequests(performanceId)
        ])
        setPerformance(perfData)
        setRequests(reqData)
        setRequestsLastUpdated(new Date())

        // Also load all songs for "Add Song" feature
        if (perfData?.singerId) {
            const songs = await getSongs(perfData.singerId)
            setAllSongs(songs)
        }
    }, [performanceId])

    // Lightweight refresh: only requests (no full reload)
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

    // Direct socket connection for real-time events (independent of ChatBox)
    // This ensures song_requested events are received even when chat is disabled
    useEffect(() => {
        const chatServerUrl = process.env.NEXT_PUBLIC_CHAT_SERVER_URL
        if (!chatServerUrl || !performanceId) return

        const singerSocket: Socket = io(chatServerUrl, {
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
        })

        singerSocket.emit('join_room', {
            performanceId,
            username: 'singer',
            userType: 'singer'
        })

        // Real-time: new song request arrived
        singerSocket.on('song_requested', () => {
            refreshRequests()
        })

        return () => {
            singerSocket.disconnect()
        }
    }, [performanceId, refreshRequests])

    // Timer & Status check
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(p => p + 1)

            if (performance) {
                const timeToStart = new Date(performance.startTime).getTime() - Date.now()
                if (timeToStart <= 10 * 60 * 1000 || performance.status === 'live') {
                    setCanOpenChat(true)
                }

                if (performance.endTime && !isAlertSent && activeSocket && chatStatus === 'open') {
                    const timeToEnd = new Date(performance.endTime).getTime() - Date.now()
                    // If within 5 mins before end, and > 0
                    if (timeToEnd > 0 && timeToEnd <= 5 * 60 * 1000) {
                        activeSocket.emit('system_alert', {
                            performanceId: performance.id,
                            message: t('live.ending_soon')
                        })
                        setIsAlertSent(true)
                    }
                }
            }
        }, 1000)
        return () => clearInterval(timer)
    }, [performance, isAlertSent, activeSocket, chatStatus])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleEndPerformance = async () => {
        if (confirm(t('live.header.confirm_end'))) {
            await updatePerformanceStatus(performanceId!, 'completed')
            router.push('/singer/dashboard')
        }
    }

    // --- Request Handlers ---
    const handleAcceptRequest = async (reqId: string) => {
        if (processingRequestIds.has(reqId)) return
        setProcessingRequestIds(prev => new Set(prev).add(reqId))
        try {
            const req = requests.find(r => r.id === reqId)
            await acceptSongRequest(reqId, performance.singerId)

            if (req && activeSocket) {
                activeSocket.emit('system_alert', {
                    performanceId: performance.id,
                    message: t('live.requests.accepted_alert').replace('{title}', req.title).replace('{artist}', req.artist ? ` - ${req.artist}` : '')
                })
            }

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

    // --- Setlist Handlers ---
    const handleToggleSongStatus = async (songId: string, currentStatus: string) => {
        if (togglingStatusIds.has(songId)) return
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'

        // Optimistic update: flip status immediately in local state
        setTogglingStatusIds(prev => new Set(prev).add(songId))
        setPerformance((prev: any) => ({
            ...prev,
            songs: prev.songs.map((s: any) =>
                s.id === songId ? { ...s, status: newStatus } : s
            )
        }))

        try {
            await updateSongStatus(performanceId!, songId, newStatus as any)

            if (activeSocket) {
                activeSocket.emit('song_status_updated', { performanceId, songId, status: newStatus })
            }

            await refreshData()
        } catch (e) {
            // Revert on error
            setPerformance((prev: any) => ({
                ...prev,
                songs: prev.songs.map((s: any) =>
                    s.id === songId ? { ...s, status: currentStatus } : s
                )
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

        // Optimistic update
        setPerformance({ ...performance, songs: newSongs })

        // Server update
        const ids = newSongs.map(s => s.id)
        await updateSetlistOrder(performanceId!, ids)
    }

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return
        if (result.source.index === result.destination.index) return
        
        await handleMoveSong(result.source.index, result.destination.index)
    }

    const handleRemoveSong = async (songId: string) => {
        if (!performance) return
        const newIds = performance.songs
            .filter((s: any) => s.id !== songId)
            .map((s: any) => s.id)
        // Optimistic update
        setPerformance({ ...performance, songs: performance.songs.filter((s: any) => s.id !== songId) })
        await updatePerformanceSetlist({
            performanceId: performanceId!,
            singerId: performance.singerId,
            songIds: newIds
        })
        // Notify audience pages to refresh setlist
        if (activeSocket) activeSocket.emit('song_status_updated', { performanceId })
        await refreshData()
    }

    const handleAddSong = async (songId: string) => {
        if (!performance) return
        const currentIds = performance.songs.map((s: any) => s.id)
        const newIds = [...currentIds, songId]
        await updatePerformanceSetlist({
            performanceId: performanceId!,
            singerId: performance.singerId,
            songIds: newIds
        })
        // Notify audience pages to refresh setlist
        if (activeSocket) activeSocket.emit('song_status_updated', { performanceId })
        await refreshData()
        setShowAddModal(false)
    }

    const handleManualAddSong = async () => {
        if (!manualSongTitle.trim() || !performance) return

        try {
            // 1. Create Song in DB for the singer's repertoire
            const newSong = await addSong({
                singerId: performance.singerId,
                title: manualSongTitle,
                artist: manualSongArtist || 'Unknown'
            });

            // 2. Add directly to the current performance's setlist
            if (newSong && newSong.id) {
                await handleAddSong(newSong.id);
            }
            
            setManualSongTitle('')
            setManualSongArtist('')
        } catch (e) {
            console.error("Failed to add manual song", e);
            alert(t('common.error_occurred') || "Error adding song");
        }
    }

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">{t('common.loading')}</div>
    if (!performance) return <div className="h-screen bg-black text-white flex items-center justify-center">{t('live.not_found')}</div>

    const pendingRequests = requests.filter(r => r.status === 'pending')

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            {/* Header */}
            <LiveHeader
                performanceId={performanceId!}
                title={performance.title}
                locationText={performance.locationText}
                onEndPerformance={handleEndPerformance}
            />

            {/* Quick Stats / Tabs */}
            <div className={`grid ${performance.chatEnabled ? 'grid-cols-3' : 'grid-cols-2'} bg-gray-900 border-b border-gray-800`}>
                <button
                    onClick={() => setActiveTab('setlist')}
                    className={`p-3 text-center transition ${activeTab === 'setlist' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="font-bold block">{t('live.tabs.setlist')} ({performance.songs.length})</span>
                </button>
                <button
                    onClick={() => {
                        setActiveTab('requests')
                        refreshRequests()
                    }}
                    className={`p-3 text-center transition ${activeTab === 'requests' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <div className="flex items-center justify-center space-x-2">
                        <span className="font-bold">{t('live.tabs.requests')}</span>
                        {pendingRequests.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{pendingRequests.length}</span>
                        )}
                    </div>
                </button>
                {/* CHAT TAB - Only if enabled */}
                {performance.chatEnabled && (
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`p-3 text-center transition ${activeTab === 'chat' ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <MessageSquare className="w-5 h-5" />
                            <span className="font-bold ml-1">{t('chat.title')}</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">

                {/* SETLIST TAB */}
                {activeTab === 'setlist' && (
                    <SetlistTab
                        songs={performance.songs}
                        isReordering={isReordering}
                        setIsReordering={setIsReordering}
                        setShowAddModal={setShowAddModal}
                        onDragEnd={onDragEnd}
                        handleToggleSongStatus={handleToggleSongStatus}
                        togglingStatusIds={togglingStatusIds}
                        handleRemoveSong={handleRemoveSong}
                    />
                )}

                {/* REQUESTS TAB */}
                {activeTab === 'requests' && (
                    <RequestsTab
                        requests={requests}
                        isRefreshingRequests={isRefreshingRequests}
                        requestsLastUpdated={requestsLastUpdated}
                        refreshRequests={refreshRequests}
                        processingRequestIds={processingRequestIds}
                        handleAcceptRequest={handleAcceptRequest}
                        handleRejectRequest={handleRejectRequest}
                    />
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && performance.chatEnabled && (
                    <div className="h-full pb-20 relative">
                        {chatStatus === 'closed' && (
                            <div className="absolute inset-x-0 inset-y-0 z-10 bg-gray-900/95 flex flex-col items-center justify-center rounded-xl p-6 shadow-2xl">
                                <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                                <h3 className="text-xl font-bold mb-2 text-white">{t('chat.closed_title')}</h3>
                                <p className="text-gray-400 mb-6 text-center text-sm">{t('chat.closed_desc').split('\n').map((line: string, i: number) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</p>
                                <button
                                    disabled={!canOpenChat}
                                    onClick={() => {
                                        if (activeSocket) activeSocket.emit('open_chat', { performanceId: performance.id })
                                    }}
                                    className={`px-6 py-3 rounded-lg font-bold text-white transition-all w-full max-w-xs ${canOpenChat ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-xl shadow-indigo-900/30' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                                >
                                    {canOpenChat ? t('chat.open_button') : t('chat.not_ready')}
                                </button>
                                {!canOpenChat && <p className="text-xs text-red-400 mt-4 opacity-75">{t('chat.closed_alert')}</p>}
                            </div>
                        )}
                        <ChatBox
                            performanceId={performanceId!}
                            username="Singer"
                            userType="singer"
                            className="h-full"
                            onSocketReady={(socket) => {
                                setActiveSocket(socket)
                                socket.on('song_requested', () => {
                                    refreshData()
                                })
                            }}
                            onChatStatusChange={(status) => setChatStatus(status)}
                            onAcceptRequest={(title) => {
                                // Find pending request with this title
                                const req = requests.find(r => r.title === title && r.status === 'pending')
                                if (req) handleAcceptRequest(req.id)
                                else alert('Request not found or already processed')
                            }}
                            onRejectRequest={(title) => {
                                const req = requests.find(r => r.title === title && r.status === 'pending')
                                if (req) handleRejectRequest(req.id)
                                else alert('Request not found or already processed')
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Footer / Stats Bar */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 grid grid-cols-2 gap-4 safe-area-bottom z-20">
                <div className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex items-center text-gray-400 text-xs mb-1">
                        <Clock className="w-3 h-3 mr-1" /> {t('live.stats.duration')}
                    </div>
                    <p className="text-2xl font-mono font-bold text-green-400">{formatTime(elapsedTime)}</p>
                </div>
                {/* Clicking requests stats jumps to requests tab */}
                <button
                    onClick={() => setActiveTab('requests')}
                    className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl border border-gray-700 hover:bg-gray-750 active:bg-gray-700 transition"
                >
                    <div className="flex items-center text-gray-400 text-xs mb-1">
                        <UserIcon className="w-3 h-3 mr-1 text-primary" /> {t('live.stats.watching')}
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">
                        {viewingCount}
                        <span className="text-xs text-slate-500 ml-1">/ {performance.chatCapacity || 50}</span>
                    </p>
                </button>
            </div>

            {/* Modal: Add Song */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 animate-fade-in">
                    <div className="bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">{t('live.modal.title')}</h3>
                            <button onClick={() => setShowAddModal(false)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto">
                            {/* Manual Entry */}
                            <div className="bg-gray-800 rounded-xl p-3 mb-4 border border-indigo-900/30">
                                <h4 className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-2">{t('live.modal.add_new')}</h4>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder={t('live.modal.song_title')}
                                        value={manualSongTitle}
                                        onChange={(e) => setManualSongTitle(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder={t('live.modal.artist')}
                                        value={manualSongArtist}
                                        onChange={(e) => setManualSongArtist(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={handleManualAddSong}
                                        disabled={!manualSongTitle.trim()}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded-lg text-sm font-bold transition"
                                    >
                                        {t('live.modal.add_direct')}
                                    </button>
                                </div>
                            </div>

                            <hr className="border-gray-800 my-4" />

                            <input
                                type="text"
                                placeholder={t('live.modal.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />

                            <div className="space-y-2">
                                <h4 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">{t('live.modal.from_repertoire')}</h4>
                                {allSongs
                                    .filter(s =>
                                        !performance.songs.some((ps: any) => ps.id === s.id) &&
                                        (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
                                    )
                                    .map(song => (
                                        <button
                                            key={song.id}
                                            onClick={() => handleAddSong(song.id)}
                                            className="w-full bg-gray-800 p-3 rounded-lg flex justify-between items-center hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 transition group"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-white">{song.title}</p>
                                                <p className="text-xs text-gray-400">{song.artist}</p>
                                            </div>
                                            <Plus className="w-5 h-5 text-gray-500 group-hover:text-indigo-400" />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// DeleteSongButton was extracted to the SetlistTab component

export default function LivePerformancePage() {
    return (
        <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <LivePerformanceContent />
        </Suspense>
    )
}
