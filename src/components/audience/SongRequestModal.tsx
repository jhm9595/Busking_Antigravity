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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100">
                <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center space-x-2 text-indigo-400">
                        <Music className="w-5 h-5" />
                        <h3 className="font-bold text-white">{t('song_request.title')}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('song_request.song_title')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('song_request.song_placeholder')}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-600 outline-none transition"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('song_request.artist_label')}</label>
                        <input
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder={t('song_request.artist_placeholder')}
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-600 outline-none transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!title.trim() || isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all flex justify-center items-center"
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
