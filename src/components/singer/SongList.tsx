'use client'

import React from 'react'
import SongItem from './SongItem'
import { useLanguage } from '@/contexts/LanguageContext'

interface SongListProps {
    songs: any[]
    loading: boolean
    onDeleteSong: (id: string) => void
}

export default function SongList({ songs, loading, onDeleteSong }: SongListProps) {
    const { t } = useLanguage()

    if (loading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded-lg"></div>
                ))}
            </div>
        )
    }

    if (songs.length === 0) {
        return (
            <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground">{t('song.empty_list')}</p>
                <p className="text-sm text-muted-foreground/70 mt-1">{t('song.empty_hint')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {songs.map((song) => (
                <SongItem
                    key={song.id}
                    song={song}
                    onDelete={onDeleteSong}
                />
            ))}
        </div>
    )
}
