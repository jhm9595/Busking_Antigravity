'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    size?: 'sm' | 'md' | 'lg' | 'full'
    children: React.ReactNode
    showCloseButton?: boolean
}

export default function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    showCloseButton = true
}: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden'
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={`${styles.modal} ${styles[size]}`}
                onClick={e => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className={styles.header}>
                        {title && <h2 className={styles.title}>{title}</h2>}
                        {showCloseButton && (
                            <button 
                                onClick={onClose} 
                                className={styles.closeButton}
                                aria-label="Close modal"
                            >
                                <X className={styles.closeIcon} />
                            </button>
                        )}
                    </div>
                )}
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    )
}
