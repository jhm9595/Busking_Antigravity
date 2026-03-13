'use client'

import React, { useState } from 'react'
import { Trash2, Link as LinkIcon } from 'lucide-react'

interface SongItemProps {
    song: any
    onDelete: (id: string) => void
}

export default function SongItem({ song, onDelete }: SongItemProps) {
    const [isConfirming, setIsConfirming] = useState(false)

    const handleDeleteClick = () => {
        if (isConfirming) {
            onDelete(song.id)
            setIsConfirming(false)
        } else {
            setIsConfirming(true)
            // Auto reset after 3 seconds
            setTimeout(() => setIsConfirming(false), 3000)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 border border-border rounded-lg transition-colors hover:bg-muted/50 bg-card">
            <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{song.title}</p>
                    <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{song.artist}</p>
                </div>
                {song.youtubeUrl && (
                    <a
                        href={song.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 p-1 rounded transition-colors"
                    >
                        <LinkIcon className="w-5 h-5" />
                    </a>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-muted-foreground text-sm hidden sm:block">
                    {new Date(song.createdAt).toLocaleDateString()}
                </span>
                <button
                    onClick={handleDeleteClick}
                    className={`transition-all ${isConfirming ? 'px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs' : 'p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10'}`}
                >
                    {isConfirming ? 'Confirm?' : <Trash2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    )
}

