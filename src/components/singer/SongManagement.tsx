import { useUser } from '@clerk/nextjs'

import { useSongs } from '@/hooks/useSingerResources'
import SongInputForm from './SongInputForm'
import SongList from './SongList'
import { useLanguage } from '@/contexts/LanguageContext'

interface SongManagementProps {
    onSongsUpdated?: () => void
}

export default function SongManagement({ onSongsUpdated }: SongManagementProps) {
    const { t } = useLanguage()
    const { user } = useUser()
    const { songs, loading, refresh: loadSongs } = useSongs(user?.id)

    const handleSongAdded = () => {
        loadSongs()
        if (onSongsUpdated) onSongsUpdated()
    }

    const handleDeleteSong = async (id: string) => {
        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    songId: id
                })
            })
            
            if (!res.ok) {
                throw new Error('Failed to delete song')
            }
            
            loadSongs()
            if (onSongsUpdated) onSongsUpdated()
        } catch (error) {
            console.error('Failed to delete song:', error)
            alert('Failed to delete song')
        }
    }

    return (
        <div className="p-6 bg-card rounded-xl shadow-md space-y-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground">{t('song.title')}</h2>

            <SongInputForm
                singerId={user?.id || ''}
                onSuccess={handleSongAdded}
            />

            <SongList
                songs={songs}
                loading={loading}
                onDeleteSong={handleDeleteSong}
            />
        </div>
    )
}
