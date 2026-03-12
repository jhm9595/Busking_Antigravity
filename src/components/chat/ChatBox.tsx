'use client'
import React, { useEffect, useState, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { Send, Music, MessageCircle } from 'lucide-react'
import PixelAvatar, { AvatarConfig } from '@/components/audience/PixelAvatar'
import AvatarCreator from '@/components/audience/AvatarCreator'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
    performanceId: string
    author: string
    message: string
    timestamp: string
    type: 'singer' | 'audience' | 'system' | 'donation'
    avatarConfig?: AvatarConfig | null
    amount?: number
    donorName?: string
    isRequest?: boolean
    isAlert?: boolean
    requestData?: {
        title: string
        artist?: string
        username: string
    }
}

interface ChatBoxProps {
    performanceId: string
    username: string
    userType: 'singer' | 'audience'
    controlToken?: string | null
    chatCapacity?: number
    avatarConfig?: AvatarConfig | null
    className?: string
    onSocketReady?: (socket: Socket) => void
    onAcceptRequest?: (title: string) => void
    onRejectRequest?: (title: string) => void
    onChatStatusChange?: (status: 'open' | 'closed') => void
    onViewingCountChange?: (count: number) => void
    onSongStatusUpdate?: () => void
    socket?: Socket | null
}

export default function ChatBox({ 
    performanceId, username, userType, controlToken, chatCapacity, avatarConfig, 
    onAcceptRequest, onRejectRequest, onChatStatusChange, 
    onViewingCountChange, onSongStatusUpdate, socket: externalSocket, className = '' 
}: ChatBoxProps) {
    const { t } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [chatStatus, setChatStatus] = useState<'open' | 'closed'>('closed')
    const [showAvatarSetup, setShowAvatarSetup] = useState(false)
    const [isJoined, setIsJoined] = useState(userType === 'singer')
    const joinedRoomRef = useRef<string | null>(null) // To prevent duplicate join

    const [localUsername, setLocalUsername] = useState(username || '')
    const [localAvatarConfig, setLocalAvatarConfig] = useState<AvatarConfig | null>(avatarConfig || null)
    
    const effectiveUsername = username || localUsername
    const effectiveAvatarConfig = avatarConfig || localAvatarConfig

    const formatTime = (ts: string) => {
        if (!ts) return ''
        const date = new Date(ts)
        return isNaN(date.getTime()) ? ts : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    // Initialize/Sync Socket
    useEffect(() => {
        let activeSocket: Socket | null = null

        if (externalSocket) {
            activeSocket = externalSocket
            setSocket(externalSocket)
            setIsConnected(externalSocket.connected)
        } else if (isJoined) {
            const url = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL
            if (url) {
                activeSocket = io(url, { reconnectionAttempts: 5, reconnectionDelay: 2000 })
                setSocket(activeSocket)
            }
        }

        if (!activeSocket) return

        const handleConnect = () => setIsConnected(true)
        const handleDisconnect = () => {
            setIsConnected(false)
            joinedRoomRef.current = null
        }
        const handleChatStatus = (data: { status: 'open' | 'closed' }) => {
            setChatStatus(data.status)
            onChatStatusChange?.(data.status)
        }
        const handleReceiveMessage = (data: Message) => {
            setMessages(list => [...list, data])
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
        const handleLoadHistory = (history: Message[]) => {
            setMessages(history)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
        const handleViewingCount = (data: { count: number }) => onViewingCountChange?.(data.count)
        const handleSongStatus = () => onSongStatusUpdate?.()

        activeSocket.on('connect', handleConnect)
        activeSocket.on('disconnect', handleDisconnect)
        activeSocket.on('chat_status', handleChatStatus)
        activeSocket.on('receive_message', handleReceiveMessage)
        activeSocket.on('load_history', handleLoadHistory)
        activeSocket.on('update_viewing_count', handleViewingCount)
        activeSocket.on('song_status_updated', handleSongStatus)

        return () => {
            if (activeSocket) {
                activeSocket.off('connect', handleConnect)
                activeSocket.off('disconnect', handleDisconnect)
                activeSocket.off('chat_status', handleChatStatus)
                activeSocket.off('receive_message', handleReceiveMessage)
                activeSocket.off('load_history', handleLoadHistory)
                activeSocket.off('update_viewing_count', handleViewingCount)
                activeSocket.off('song_status_updated', handleSongStatus)
                if (!externalSocket) activeSocket.disconnect()
            }
            joinedRoomRef.current = null
        }
    }, [isJoined, externalSocket, performanceId])

    // Unified Idempotent Room Join
    useEffect(() => {
        if (socket && isJoined && isConnected) {
            const joinKey = `${performanceId}:${effectiveUsername}:${controlToken ? 'owner' : 'audience'}`
            if (joinedRoomRef.current !== joinKey) {
                socket.emit('join_room', {
                    performanceId, 
                    username: effectiveUsername, 
                    avatarConfig: effectiveAvatarConfig,
                    controlToken: controlToken || undefined
                })
                joinedRoomRef.current = joinKey
            }
        }
    }, [socket, isJoined, isConnected, performanceId, effectiveUsername, effectiveAvatarConfig, controlToken])

    const handleJoinClick = () => {
        if (!effectiveUsername || effectiveUsername === 'Guest') {
            setShowAvatarSetup(true)
        } else {
            setIsJoined(true)
        }
    }

    const sendMessage = () => {
        if (currentMessage.trim() && socket && isConnected) {
            const messageData = {
                performanceId,
                author: effectiveUsername,
                message: currentMessage,
                timestamp: new Date().toISOString(),
                avatarConfig: effectiveAvatarConfig
            }
            socket.emit('send_message', messageData)
            setCurrentMessage('')
        }
    }

    return (
        <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${className}`}>
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center shrink-0">
                <h3 className="text-white font-bold text-sm">{t('chat.title')}</h3>
                {userType === 'audience' && isJoined && (
                    <button
                        onClick={() => { setIsJoined(false); joinedRoomRef.current = null }}
                        className="text-[10px] text-red-400 bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded-full transition-colors font-black uppercase italic"
                    >
                        {t('chat.leave')}
                    </button>
                )}
            </div>

            {!isJoined ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-800/30 min-h-[350px] text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                        <MessageCircle className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h4 className="text-white font-black italic mb-2 tracking-tight uppercase">{t('chat.join_title')}</h4>
                    <p className="text-[10px] text-slate-500 mb-8 max-w-[200px] font-bold leading-relaxed uppercase italic">{t('chat.join_desc')}</p>
                    <button
                        onClick={handleJoinClick}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest italic"
                    >
                        {t('chat.join_button')}
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] custom-scrollbar bg-gray-950/20">
                        {messages.map((msg, idx) => {
                            if (msg.type === 'donation') {
                                return (
                                    <div key={idx} className="flex flex-col items-center my-4 animate-in zoom-in duration-500 w-full">
                                        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-[1px] rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] w-[95%]">
                                            <div className="bg-gray-900 rounded-[15px] p-4 flex flex-col items-center relative overflow-hidden">
                                                <div className="flex items-center gap-2 mb-2 text-amber-400 font-black italic text-[9px] uppercase tracking-[0.2em]">
                                                    <span className="animate-bounce">💖</span> {t('chat.sponsorship_title')} <span className="animate-bounce">💖</span>
                                                </div>
                                                <p className="text-white font-black text-center text-[13px] mb-1 leading-tight">
                                                    <span className="text-amber-400 mr-1.5">{msg.donorName || (msg.message.includes('님') ? msg.message.split('님')[0] : msg.author)}</span>
                                                    <span className="opacity-60">{t('chat.sponsored_by')}</span> 
                                                    <span className="text-amber-400 font-mono ml-1.5">{msg.amount?.toLocaleString()}P</span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[8px] text-gray-700 mt-1.5 font-black uppercase">{formatTime(msg.timestamp)}</span>
                                    </div>
                                )
                            }

                            if (msg.type === 'system' && msg.isRequest && msg.requestData) {
                                return (
                                    <div key={idx} className="flex flex-col items-center my-2 w-full">
                                        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 w-[90%] text-center">
                                            <div className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2 italic">{t('chat.song_request_title')}</div>
                                            <p className="text-white font-black text-sm mb-1 italic uppercase truncate">{msg.requestData.title}</p>
                                            <p className="text-indigo-300/60 text-[10px] font-bold italic mb-3">{t('chat.song_request_by').replace('{username}', msg.requestData.username)}</p>
                                            {userType === 'singer' && onAcceptRequest && (
                                                <button onClick={() => onAcceptRequest(msg.requestData!.title)} className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase italic shadow-lg">{t('chat.accept_button')}</button>
                                            )}
                                        </div>
                                    </div>
                                )
                            }

                            const isMe = msg.author === effectiveUsername
                            const isSinger = msg.type === 'singer'
                            const isSystem = msg.type === 'system'

                            if (isSystem) {
                                return (
                                    <div key={idx} className="flex justify-center my-2">
                                        <span className="bg-white/5 border border-white/5 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full uppercase italic">
                                            {msg.message}
                                        </span>
                                    </div>
                                )
                            }

                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full gap-3`}>
                                    {!isMe && msg.avatarConfig && (
                                        <div className="shrink-0 mt-1">
                                            <PixelAvatar config={msg.avatarConfig} size={32} className="bg-gray-800 rounded-xl border border-white/10" />
                                        </div>
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                        {!isMe && <span className="text-[9px] font-black text-gray-500 mb-1 uppercase tracking-wider italic">{msg.author} {isSinger && '👑'}</span>}
                                        <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium break-words shadow-sm ${
                                            isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 
                                            isSinger ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100 rounded-tl-none' : 
                                            'bg-gray-800 text-gray-200 rounded-tl-none'
                                        }`}>
                                            <p className="leading-relaxed">{msg.message}</p>
                                        </div>
                                        <span className="text-[8px] text-gray-700 mt-1 font-bold uppercase">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    {isMe && msg.avatarConfig && (
                                        <div className="shrink-0 mt-1">
                                            <PixelAvatar config={msg.avatarConfig} size={32} className="bg-gray-800 rounded-xl border border-indigo-500/30" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-4 bg-gray-900 border-t border-white/5">
                        <div className="flex gap-2 bg-gray-950 p-1.5 rounded-[20px] border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && sendMessage()}
                                placeholder={chatStatus === 'closed' && userType === 'audience' ? t('chat.closed_placeholder') : t('chat.placeholder')}
                                disabled={(chatStatus === 'closed' && userType === 'audience') || !isConnected}
                                className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none placeholder:text-gray-700 italic font-medium"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!currentMessage.trim() || (chatStatus === 'closed' && userType === 'audience') || !isConnected}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-2xl transition disabled:opacity-30 shadow-lg shadow-indigo-600/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showAvatarSetup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <AvatarCreator
                        onComplete={(name, config) => {
                            setLocalUsername(name)
                            setLocalAvatarConfig(config)
                            setShowAvatarSetup(false)
                            setIsJoined(true)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
