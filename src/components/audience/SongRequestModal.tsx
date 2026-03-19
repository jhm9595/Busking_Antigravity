'use client'
import React, { useState } from 'react'
import { Plus, Music, X } from 'lucide-react'

interface SongRequestModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (title: string, artist: string) => Promise<void>
}

import { useLanguage } from '@/contexts/LanguageContext'

export default function SongRequestModal({ isOpen, onClose, onSubmit }: SongRequestModalProps) {
    const { t } = useLanguage()
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setIsSubmitting(true)
        try {
            await onSubmit(title, artist)
            setTitle('')
            setArtist('')
            onClose()
        } catch (error) {
            console.error('Request failed', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="px-4 py-3 border-b border-border flex justify-between items-center" style={{ backgroundColor: 'var(--color-surface-elevated)' }}>
                    <div className="flex items-center space-x-2" style={{ color: 'var(--color-primary)' }}>
                        <Music className="w-5 h-5" />
                        <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('song_request.title')}</h3>
                    </div>
                    <button onClick={onClose} className="transition" style={{ color: 'var(--color-text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('song_request.song_title')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('song_request.song_placeholder')}
                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none transition"
                            style={{ 
                                backgroundColor: 'var(--color-surface)', 
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                            }}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('song_request.artist_label')}</label>
                        <input
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder={t('song_request.artist_placeholder')}
                            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none transition"
                            style={{ 
                                backgroundColor: 'var(--color-surface)', 
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!title.trim() || isSubmitting}
                        className="w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center"
                        style={{ 
                            backgroundColor: 'var(--color-primary)', 
                            color: 'var(--color-primary-foreground)'
                        }}
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">{t('song_request.sending')}</span>
                        ) : (
                            <>
                                <Plus className="w-5 h-5 mr-1.5" />
                                {t('song_request.submit')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
