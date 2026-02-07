'use client'
import React, { useEffect, useState, useRef } from 'react'
import io, { Socket } from 'socket.io-client'
import { Send, Music } from 'lucide-react'
import PixelAvatar, { AvatarConfig } from '@/components/audience/PixelAvatar'

// Define the shape of a message
interface Message {
    performanceId: string
    author: string
    message: string
    timestamp: string
    type: 'singer' | 'audience' | 'system'
    avatarConfig?: AvatarConfig | null
    isRequest?: boolean
    requestData?: {
        title: string
        username: string // requester
    }
}

interface ChatBoxProps {
    performanceId: string
    username: string
    userType: 'singer' | 'audience'
    avatarConfig?: AvatarConfig | null
    className?: string
    onRequestSong?: () => void
    onSocketReady?: (socket: Socket) => void
    onAcceptRequest?: (title: string) => void
    onRejectRequest?: (title: string) => void
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function ChatBox({ performanceId, username, userType, avatarConfig, onRequestSong, onSocketReady, onAcceptRequest, onRejectRequest, className = '' }: ChatBoxProps) {
    const { t } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [currentMessage, setCurrentMessage] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    // Avoid re-creating socket on every render, but we need it to be stable
    // We can use a ref or just rely on useEffect cleanup

    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        // Connect to Chat Server
        // Assuming Docker/Localhost maps port 4000
        const newSocket = io('http://localhost:4000')
        setSocket(newSocket)
        if (onSocketReady) onSocketReady(newSocket)

        newSocket.emit('join_room', { performanceId, username, userType })

        newSocket.emit('join_room', { performanceId, username, userType })

        newSocket.on('load_history', (history: Message[]) => {
            setMessages(history)
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })

        newSocket.on('receive_message', (data: Message) => {
            setMessages((list) => [...list, data])
            // Scroll to bottom
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })

        return () => {
            newSocket.disconnect()
        }
    }, [performanceId, username, userType])

    const sendMessage = async () => {
        if (currentMessage !== '' && socket) {
            const messageData: Message = {
                performanceId,
                author: username,
                message: currentMessage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: userType,
                avatarConfig
            }

            await socket.emit('send_message', messageData)
            setCurrentMessage('')
        }
    }

    return (
        <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${className}`}>
            <div className="bg-gray-800 p-3 border-b border-gray-700">
                <h3 className="text-white font-bold text-sm">{t('chat.title')}</h3>
            </div>



            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px] min-h-[300px]">
                {messages.map((msg, idx) => {
                    // System Message (Song Request)
                    if (msg.type === 'system' && msg.isRequest && msg.requestData) {
                        return (
                            <div key={idx} className="flex flex-col items-center my-2 animate-fade-in group w-full">
                                <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border border-indigo-500/50 rounded-xl p-3 max-w-[90%] text-center shadow-lg transform transition hover:scale-[1.02]">
                                    <div className="flex items-center justify-center gap-2 mb-1 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                                        <Music className="w-3 h-3" /> New Song Request
                                    </div>
                                    <p className="text-white font-bold text-sm mb-1 line-clamp-2">"{msg.requestData.title}"</p>
                                    <p className="text-gray-400 text-xs mb-2">Requested by {msg.requestData.username}</p>

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
                                <span className="text-[9px] text-gray-600 mt-1">{msg.timestamp}</span>
                            </div>
                        )
                    }

                    const isMe = msg.author === username
                    const isSinger = msg.type === 'singer'

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
                                <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
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

            <div className="p-2 bg-gray-800 border-t border-gray-700 flex gap-2">
                {onRequestSong && (
                    <button
                        onClick={onRequestSong}
                        className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition border border-indigo-600/30"
                        title="Request a Song"
                    >
                        <Music className="w-5 h-5" />
                    </button>
                )}
                <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            sendMessage()
                        }
                    }}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                    onClick={sendMessage}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition disabled:opacity-50"
                    disabled={!currentMessage.trim()}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
