'use client'
import React, { useEffect, useState, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { Send, Music, MessageCircle } from 'lucide-react'
import PixelAvatar, { AvatarConfig } from '@/components/audience/PixelAvatar'
import AvatarCreator from '@/components/audience/AvatarCreator'

// Define the shape of a message
interface Message {
    performanceId: string
    author: string
    message: string
    timestamp: string
    type: 'singer' | 'audience' | 'system' | 'donation'
    avatarConfig?: AvatarConfig | null
    amount?: number
    isRequest?: boolean
    isAlert?: boolean
    requestData?: {
        title: string
        artist?: string
        username: string // requester
    }
}

interface ChatBoxProps {
    performanceId: string
    username: string
    userType: 'singer' | 'audience'
    chatCapacity?: number
    avatarConfig?: AvatarConfig | null
    className?: string
    onRequestSong?: () => void
    onSocketReady?: (socket: Socket) => void
    onAcceptRequest?: (title: string) => void
    onRejectRequest?: (title: string) => void
    onChatStatusChange?: (status: 'open' | 'closed') => void
    onViewingCountChange?: (count: number) => void
    onSongStatusUpdate?: () => void
    socket?: Socket | null
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function ChatBox({ performanceId, username, userType, chatCapacity, avatarConfig, onRequestSong, onSocketReady, onAcceptRequest, onRejectRequest, onChatStatusChange, onViewingCountChange, onSongStatusUpdate, socket: externalSocket, className = '' }: ChatBoxProps) {
    const { t } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    // Avoid re-creating socket on every render, but we need it to be stable
    // We can use a ref or just rely on useEffect cleanup

    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('closed')
    const [showAvatarSetup, setShowAvatarSetup] = useState(false)
    const [isJoined, setIsJoined] = useState(userType === 'singer')
    const [performanceStartTime, setPerformanceStartTime] = useState<string | null>(null)

    // Local state for username/avatar if not passed from parent
    const [localUsername, setLocalUsername] = useState(username || '')
    const [localAvatarConfig, setLocalAvatarConfig] = useState<AvatarConfig | null>(avatarConfig || null)
    const [localUserType, setLocalUserType] = useState<string>(userType || 'audience')

    // Helper to get effective values
    const effectiveUsername = username || localUsername
    const effectiveAvatarConfig = avatarConfig || localAvatarConfig

    // Fetch performance start time if not provided (should ideally be passed as prop)
    useEffect(() => {
        if (!performanceId) return
        import('@/services/singer').then(m => m.getPerformanceById(performanceId)).then(p => {
            if (p) setPerformanceStartTime(p.startTime as any)
        })
    }, [performanceId])

    // Update local state when props change
    useEffect(() => {
        if (username) setLocalUsername(username)
        if (avatarConfig) setLocalAvatarConfig(avatarConfig)
    }, [username, avatarConfig])

    const setUsername = (name: string) => setLocalUsername(name)
    const setAvatarConfig = (config: AvatarConfig | null) => setLocalAvatarConfig(config)
    const setUserType = (type: string) => setLocalUserType(type)

    const formatTime = (ts: string) => {
        if (!ts) return ''
        const date = new Date(ts)
        if (isNaN(date.getTime())) return ts
        // Use local time formatting
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    useEffect(() => {
        // If external socket is provided, use it instead of creating a local one
        if (externalSocket) {
            setSocket(externalSocket)
            setIsConnected(externalSocket.connected)

            const onConnect = () => setIsConnected(true)
            const onDisconnect = () => setIsConnected(false)

            externalSocket.on('connect', onConnect)
            externalSocket.on('disconnect', onDisconnect)

            // If user is joined, emit join_room with full info
            if (isJoined && externalSocket.connected) {
                externalSocket.emit('join_room', { performanceId, username: effectiveUsername, userType, capacity: chatCapacity })
            }

            return () => {
                externalSocket.off('connect', onConnect)
                externalSocket.off('disconnect', onDisconnect)
            }
        }

        if (!isJoined) {
            if (socket && !externalSocket) {
                socket.disconnect()
                setSocket(null)
            }
            return
        }

        // Only connect if NEXT_PUBLIC_REALTIME_SERVER_URL is set
        const realtimeServerUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
        if (!realtimeServerUrl) {
            console.warn('[ChatBox] NEXT_PUBLIC_REALTIME_SERVER_URL is not set. Socket connection skipped.')
            if (onChatStatusChange) onChatStatusChange('closed')
            return
        }

        // Connect to Realtime Server
        const newSocket = io(realtimeServerUrl, {
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        })
        setSocket(newSocket)
        if (onSocketReady) onSocketReady(newSocket)

        newSocket.on('connect', () => {
            setIsConnected(true)
            newSocket.emit('join_room', { performanceId, username: effectiveUsername, userType, capacity: chatCapacity })
        })

        newSocket.on('disconnect', () => {
            setIsConnected(false)
        })

        newSocket.on('connect_error', () => {
            setIsConnected(false)
        })

        newSocket.on('join_error', (data: { message: string }) => {
            alert(data.message)
            setIsJoined(false)
            newSocket.disconnect()
        })

        newSocket.on('performance_ended', () => {
            alert(t('chat.performance_ended_alert') || 'The performance has ended. Redirecting...')
            setIsJoined(false)
            if (onChatStatusChange) onChatStatusChange('closed')
        })

        newSocket.on('load_history', (history: Message[]) => {
            setMessages(history)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })

        newSocket.on('chat_status', (data: { status: 'open' | 'closed' }) => {
            setChatStatus(data.status)
            if (onChatStatusChange) onChatStatusChange(data.status)
        })

        newSocket.on('receive_message', (data: Message) => {
            setMessages((list) => [...list, data])
            // Scroll to bottom
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })

        newSocket.on('update_viewing_count', (data: { count: number }) => {
            if (onViewingCountChange) onViewingCountChange(data.count)
        })

        newSocket.on('song_status_updated', () => {
            if (onSongStatusUpdate) onSongStatusUpdate()
        })

        return () => {
            if (!externalSocket) {
                newSocket.disconnect()
            }
        }
    }, [performanceId, effectiveUsername, userType, isJoined, externalSocket])

    // Extra effect to handle room join when isJoined changes if using external socket
    useEffect(() => {
        if (externalSocket && isJoined && isConnected) {
            externalSocket.emit('join_room', { performanceId, username: effectiveUsername, userType, capacity: chatCapacity })
        }
    }, [isJoined, isConnected, externalSocket, performanceId, effectiveUsername, userType])

    // Listen for events on external socket
    useEffect(() => {
        if (!externalSocket) return

        const socket = externalSocket

        const handlePerformanceEnded = () => {
            alert(t('chat.performance_ended_alert') || 'The performance has ended. Redirecting...')
            setIsJoined(false)
            if (onChatStatusChange) onChatStatusChange('closed')
        }

        const handleLoadHistory = (history: Message[]) => {
            setMessages(history)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }

        const handleChatStatus = (data: { status: 'open' | 'closed' }) => {
            setChatStatus(data.status)
            if (onChatStatusChange) onChatStatusChange(data.status)
        }

        const handleReceiveMessage = (data: Message) => {
            setMessages((list) => [...list, data])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }

        const handleViewingCount = (data: { count: number }) => {
            if (onViewingCountChange) onViewingCountChange(data.count)
        }

        const handleSongStatus = () => {
            if (onSongStatusUpdate) onSongStatusUpdate()
        }

        socket.on('performance_ended', handlePerformanceEnded)
        socket.on('load_history', handleLoadHistory)
        socket.on('chat_status', handleChatStatus)
        socket.on('receive_message', handleReceiveMessage)
        socket.on('update_viewing_count', handleViewingCount)
        socket.on('song_status_updated', handleSongStatus)

        return () => {
            socket.off('performance_ended', handlePerformanceEnded)
            socket.off('load_history', handleLoadHistory)
            socket.off('chat_status', handleChatStatus)
            socket.off('receive_message', handleReceiveMessage)
            socket.off('update_viewing_count', handleViewingCount)
            socket.off('song_status_updated', handleSongStatus)
        }
    }, [externalSocket])

    const handleJoinClick = () => {
        if (userType === 'audience' && performanceStartTime) {
            const start = new Date(performanceStartTime)
            const now = new Date()
            const diffMs = start.getTime() - now.getTime()
            const diffMins = diffMs / (1000 * 60)

            if (diffMins > 10) {
                alert(t('chat.join_too_early') || 'You can join the chat 10 minutes before the performance starts.')
                return
            }
        }

        if (!effectiveUsername || effectiveUsername === 'Guest') {
            setShowAvatarSetup(true)
        } else {
            setIsJoined(true)
        }
    }

    const sendMessage = async () => {
        if (currentMessage !== '' && socket) {
            const messageData: Message = {
                performanceId,
                author: effectiveUsername,
                message: currentMessage,
                timestamp: new Date().toISOString(),
                type: userType,
                avatarConfig: effectiveAvatarConfig
            }

            await socket.emit('send_message', messageData)
            setCurrentMessage('')
        }
    }


    return (
        <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${className}`}>
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">{t('chat.title')}</h3>
                {userType === 'audience' && isJoined && (
                    <button
                        onClick={() => setIsJoined(false)}
                        className="text-xs text-red-400 bg-red-900/30 hover:bg-red-900/50 px-3 py-1 rounded-full transition-colors font-bold"
                    >
                        나가기 (Leave)
                    </button>
                )}
            </div>



            {!isJoined ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-800/50 min-h-[300px]">
                    <MessageCircle className="w-12 h-12 text-slate-500 mb-4" />
                    <h4 className="text-white font-bold mb-2">실시간 채팅방에 참여하시겠습니까?</h4>
                    <p className="text-xs text-slate-400 text-center mb-6">참여 시 다른 관객 및 가수와 소통할 수 있습니다. (설정된 인원 내에서만 참여 가능)</p>
                    <button
                        onClick={handleJoinClick}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        입장하기 (Join Chat)
                    </button>

                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px]">
                        {messages.map((msg, idx) => {
                            // System Message (Song Request)
                            if (msg.type === 'system' && msg.isRequest && msg.requestData) {
                                return (
                                    <div key={idx} className="flex flex-col items-center my-2 animate-fade-in group w-full">
                                        <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border border-indigo-500/50 rounded-xl p-3 max-w-[90%] text-center shadow-lg transform transition hover:scale-[1.02]">
                                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                                                <Music className="w-3 h-3" /> New Song Request
                                            </div>
                                            <p className="text-white font-bold text-sm mb-1 line-clamp-2">{msg.requestData.title}{msg.requestData.artist ? ` - ${msg.requestData.artist}` : ''}</p>
                                            <p className="text-gray-400 text-xs mb-2">{t('song_request.request_by')} {msg.requestData.username}</p>

                                            {userType === 'singer' && onAcceptRequest && onRejectRequest && (
                                                <div className="flex gap-2 justify-center mt-2">
                                                    <button
                                                        onClick={() => onAcceptRequest(msg.requestData!.title)}
                                                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                                                    >
                                                        Accept
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-gray-600 mt-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                )
                            }

                            // Donation Message
                            if (msg.type === 'donation') {
                                return (
                                    <div key={idx} className="flex flex-col items-center my-4 animate-in zoom-in duration-500 w-full">
                                        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-[1px] rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] w-[95%] transform hover:scale-[1.02] transition-transform">
                                            <div className="bg-gray-900 rounded-[15px] p-4 flex flex-col items-center relative overflow-hidden">
                                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
                                                <div className="flex items-center gap-2 mb-2 text-amber-400 font-black italic text-[10px] uppercase tracking-[0.2em]">
                                                    <span className="animate-bounce">💖</span> SPONSORSHIP RECEIVED <span className="animate-bounce">💖</span>
                                                </div>
                                                <p className="text-white font-black text-center text-sm mb-1 leading-tight">
                                                    <span className="text-amber-400">{msg.message.split('sponsored')[0]}</span>
                                                    sponsored 
                                                    <span className="text-amber-400 font-mono mx-1">{msg.amount?.toLocaleString()}P</span>
                                                </p>
                                                <div className="text-[10px] text-gray-500 font-bold italic opacity-60">THANK YOU FOR THE SUPPORT!</div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-gray-600 mt-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                )
                            }

                            const isMe = msg.author === effectiveUsername
                            const isSinger = msg.type === 'singer'
                            const isSystem = msg.type === 'system'

                            if (isSystem && msg.message && !msg.requestData) {
                                return (
                                    <div key={idx} className="flex flex-col items-center my-2 animate-fade-in group w-full">
                                        <div className={`border rounded-xl p-3 max-w-[90%] text-center shadow-lg ${msg.isAlert ? 'bg-gradient-to-r from-green-900/80 to-emerald-900/80 border-green-500/50' : 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-gray-500/50'}`}>
                                            <p className="text-white font-bold text-sm mb-1">{msg.message}</p>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full gap-2`}>
                                    {!isMe && msg.avatarConfig && (
                                        <div className="flex flex-col items-center justify-end pb-1">
                                            <PixelAvatar config={msg.avatarConfig} size={32} className="bg-gray-800 rounded-full border border-gray-700" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                        <div className={`rounded-lg px-3 py-2 text-sm break-words shadow-sm ${isMe ? 'bg-indigo-600 text-white' :
                                            isSinger ? 'bg-yellow-900/40 border border-yellow-500/30 text-yellow-100' :
                                                'bg-gray-700 text-gray-200'
                                            }`}>
                                            {!isMe && (
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <span className="text-[10px] opacity-75 font-bold uppercase tracking-wider">
                                                        {msg.author}
                                                    </span>
                                                    {isSinger && <span className="text-xs">👑</span>}
                                                </div>
                                            )}
                                            <p>{msg.message}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                                    </div>

                                    {isMe && msg.avatarConfig && (
                                        <div className="flex flex-col items-center justify-end pb-1">
                                            <PixelAvatar config={msg.avatarConfig} size={32} className="bg-gray-800 rounded-full border border-gray-700" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-2 bg-gray-800 border-t border-gray-700 flex flex-col gap-2 relative">
                        {!isConnected && isJoined && (
                            <div className="absolute inset-x-0 bottom-full bg-red-900/90 text-white text-[10px] py-1 px-3 flex items-center justify-between border-t border-red-700 animate-pulse">
                                <span>Disconnected... checking connection</span>
                                <button
                                    onClick={() => {
                                        if (socket) {
                                            socket.connect()
                                        } else {
                                            setIsJoined(false)
                                            setTimeout(() => setIsJoined(true), 100)
                                        }
                                    }}
                                    className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded font-bold uppercase"
                                >
                                    Reconnect
                                </button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                        sendMessage()
                                    }
                                }}
                                placeholder={chatStatus === 'closed' && userType === 'audience' ? t('chat.closed_placeholder') : t('chat.placeholder')}
                                disabled={(chatStatus === 'closed' && userType === 'audience') || !isConnected}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition disabled:opacity-50"
                                disabled={!currentMessage.trim() || (chatStatus === 'closed' && userType === 'audience') || !isConnected}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
            {/* Avatar Creator Modal for first time chat - Show only when attempting to chat */}
            {showAvatarSetup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <AvatarCreator
                            onComplete={(name: string, config: AvatarConfig | null, type: 'anon' | 'named') => {
                                setUsername(name)
                                setAvatarConfig(config)
                                setUserType(type)
                                setShowAvatarSetup(false)
                                setIsJoined(true)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
