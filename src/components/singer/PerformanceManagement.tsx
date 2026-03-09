'use client'

import React, { useState } from 'react'
import { Plus, Calendar, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@clerk/nextjs'
import { usePerformances, useSongs } from '@/hooks/useSingerResources'
import PerformanceList from './PerformanceList'
import AddPerformanceModal from './AddPerformanceModal'

interface PerformanceManagementProps {
    refreshKey?: number
}

export default function PerformanceManagement({ refreshKey }: PerformanceManagementProps) {
    const { t } = useLanguage()
    const { user } = useUser()
    const [showAddModal, setShowAddModal] = useState(false)
    const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>('upcoming')
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const { performances, loading: perfLoading, refresh: refreshPerformances } = usePerformances(user?.id, refreshKey)
    const { songs: allSongs, loading: songsLoading } = useSongs(user?.id, refreshKey)

    const loading = perfLoading || songsLoading

    const handleSuccess = () => {
        refreshPerformances()
        setActiveTab('upcoming')
        setShowAddModal(false)
        setSuccessMessage(t('performance.form.success') || 'Performance registered successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
    }

    return (
        <div className="p-4 sm:p-8 bg-white dark:bg-gray-950 rounded-2xl shadow-xl dark:shadow-indigo-900/10 space-y-8 max-w-full overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 italic tracking-tighter">
                        <Calendar className="w-8 h-8 text-indigo-600" />
                        {t('performance.title')}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 font-bold italic">{t('performance.list.add_hint')}</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5" />
                    {t('performance.form.register')}
                </button>
            </div>

            {/* Success Message Toast */}
            {successMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black italic flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <CheckCircle className="w-6 h-6" />
                    {successMessage}
                </div>
            )}

            {/* List Component */}
            <section className="relative min-h-[400px]">
                <PerformanceList
                    performances={performances}
                    loading={loading}
                    initialLoading={loading && performances.length === 0}
                    allSongs={allSongs}
                    onRefresh={refreshPerformances}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </section>

            {/* Registration Modal */}
            {showAddModal && (
                <AddPerformanceModal
                    singerId={user?.id || ''}
                    allSongs={allSongs}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
