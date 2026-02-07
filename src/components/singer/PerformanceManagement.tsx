import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@clerk/nextjs'
import { usePerformances, useSongs } from '@/hooks/useSingerResources'
import PerformanceForm from './PerformanceForm'
import PerformanceList from './PerformanceList'

interface PerformanceManagementProps {
    refreshKey?: number
}

export default function PerformanceManagement({ refreshKey }: PerformanceManagementProps) {
    const { t } = useLanguage()
    const { user } = useUser()

    // Hooks manage their own loading and data fetching
    const { performances, loading: perfLoading, refresh: refreshPerformances } = usePerformances(user?.id, refreshKey)
    const { songs: allSongs, loading: songsLoading, refresh: refreshSongs } = useSongs(user?.id, refreshKey)

    const loading = perfLoading || songsLoading

    // Handler for successful registration
    const handleSuccess = () => {
        refreshPerformances()
        // Songs likely won't change here, but we can refresh if needed
    }

    return (
        <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md space-y-8 max-w-full overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">{t('performance.title')}</h2>

            {/* Registration Form Component */}
            <section>
                <PerformanceForm
                    singerId={user?.id || ''}
                    allSongs={allSongs}
                    onSuccess={handleSuccess}
                />
            </section>

            {/* List Component */}
            <section>

                <PerformanceList
                    performances={performances}
                    loading={loading}
                    allSongs={allSongs}
                />
            </section>
        </div>
    )
}
