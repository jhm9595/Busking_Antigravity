'use client'

import React from 'react'
import { X } from 'lucide-react'
import PerformanceForm from './PerformanceForm'
import styles from '@/styles/singer/PerformanceForm.module.css'
import { useLanguage } from '@/contexts/LanguageContext'

interface AddPerformanceModalProps {
    singerId: string
    allSongs: any[]
    onClose: () => void
    onSuccess: () => void
}

export default function AddPerformanceModal({ singerId, allSongs, onClose, onSuccess }: AddPerformanceModalProps) {
    const { t } = useLanguage()

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('performance.form.register')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <PerformanceForm
                        singerId={singerId}
                        allSongs={allSongs}
                        onSuccess={() => {
                            onSuccess()
                            onClose()
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
