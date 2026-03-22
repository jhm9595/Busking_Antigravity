'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UseSocketOptions {
    url?: string
    autoConnect?: boolean
    reconnectionAttempts?: number
    reconnectionDelay?: number
    transports?: ('websocket' | 'polling')[]
}

interface UseSocketReturn {
    socket: Socket | null
    status: SocketStatus
    emit: (event: string, data?: unknown) => void
    on: (event: string, callback: (...args: unknown[]) => void) => void
    off: (event: string, callback?: (...args: unknown[]) => void) => void
    connect: () => void
    disconnect: () => void
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
    const {
        url,
        autoConnect = true,
        reconnectionAttempts = 5,
        reconnectionDelay = 3000,
        transports = ['websocket', 'polling'],
    } = options

    const [socket, setSocket] = useState<Socket | null>(null)
    const [status, setStatus] = useState<SocketStatus>('disconnected')
    const socketRef = useRef<Socket | null>(null)

    const connect = useCallback(() => {
        if (!url || socketRef.current?.connected) return

        const newSocket = io(url, {
            reconnectionAttempts,
            reconnectionDelay,
            transports,
        })

        newSocket.on('connect', () => {
            setStatus('connected')
        })

        newSocket.on('disconnect', () => {
            setStatus('disconnected')
        })

        newSocket.on('connect_error', () => {
            setStatus('error')
        })

        socketRef.current = newSocket
        setSocket(newSocket)
        setStatus('connecting')
    }, [url, reconnectionAttempts, reconnectionDelay, transports])

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
            setSocket(null)
            setStatus('disconnected')
        }
    }, [])

    const emit = useCallback((event: string, data?: unknown) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data)
        }
    }, [])

    const on = useCallback((event: string, callback: (...args: unknown[]) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback)
        }
    }, [])

    const off = useCallback((event: string, callback?: (...args: unknown[]) => void) => {
        if (socketRef.current) {
            if (callback) {
                socketRef.current.off(event, callback)
            } else {
                socketRef.current.off(event)
            }
        }
    }, [])

    useEffect(() => {
        if (autoConnect && url) {
            connect()
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
        }
    }, [url, autoConnect, connect])

    return {
        socket,
        status,
        emit,
        on,
        off,
        connect,
        disconnect,
    }
}

// Simplified hook for joining a room
interface UseSocketRoomOptions extends UseSocketOptions {
    performanceId?: string
    username?: string
    userType?: 'singer' | 'audience'
    controlToken?: string
}

export function useSocketRoom(options: UseSocketRoomOptions = {}) {
    const { performanceId, username, userType, controlToken, ...socketOptions } = options
    const result = useSocket(socketOptions)

    const joinRoom = useCallback(() => {
        if (!result.socket?.connected || !performanceId) return

        result.emit('join_room', {
            performanceId,
            username: username || 'Guest',
            userType: userType || 'audience',
            controlToken,
        })
    }, [result, performanceId, username, userType, controlToken])

    return {
        ...result,
        joinRoom,
    }
}
