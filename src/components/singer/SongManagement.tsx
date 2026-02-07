import { useUser } from '@clerk/nextjs'

import { useSongs } from '@/hooks/useSingerResources'
import { deleteSong } from '@/services/singer'
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
        await deleteSong(id)
        loadSongs()
        if (onSongsUpdated) onSongsUpdated()
    }

    return (
        <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('song.title')}</h2>

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
