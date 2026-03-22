'use client'

import { useCallback } from 'react'

interface UseConfirmReturn {
    confirm: (message: string, title?: string) => Promise<boolean>
    confirmAsync: (options: ConfirmOptions) => Promise<boolean>
}

interface ConfirmOptions {
    message: string
    title?: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger' | 'info'
}

export function useConfirm(): UseConfirmReturn {
    const confirm = useCallback((message: string, title?: string): Promise<boolean> => {
        if (typeof window === 'undefined') {
            return Promise.resolve(false)
        }

        if (title) {
            return Promise.resolve(window.confirm(`${title}\n\n${message}`))
        }

        return Promise.resolve(window.confirm(message))
    }, [])

    const confirmAsync = useCallback(async (options: ConfirmOptions): Promise<boolean> => {
        const {
            message,
            title,
            confirmText = '확인',
            cancelText = '취소',
        } = options

        if (typeof window === 'undefined') {
            return false
        }

        // Use native confirm for simplicity
        // For custom modals, integrate with your modal component
        const fullMessage = title ? `${title}\n\n${message}` : message
        const defaultConfirm = `${confirmText} / ${cancelText}`
        
        return window.confirm(`${fullMessage}\n\n${defaultConfirm}`)
    }, [])

    return {
        confirm,
        confirmAsync,
    }
}

// Simple boolean confirm hook for inline usage
export function useConfirmAction() {
    const confirm = useCallback((message: string): Promise<boolean> => {
        if (typeof window === 'undefined') {
            return Promise.resolve(false)
        }
        return Promise.resolve(window.confirm(message))
    }, [])

    return { confirm }
}
