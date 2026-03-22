'use client'

import React from 'react'
import { X } from 'lucide-react'
import PerformanceForm from './PerformanceForm'
import styles from '@/styles/singer/PerformanceForm.module.css'
import { useLanguage } from '@/contexts/LanguageContext'

interface AddPerformanceModalProps {
    singerId: string
    allSongs: any[]
    availablePoints: number
    onClose: () => void
    onSuccess: () => void
}

export default function AddPerformanceModal({ singerId, allSongs, availablePoints, onClose, onSuccess }: AddPerformanceModalProps) {
    const { t } = useLanguage()

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
<div className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border" style={{ 
                    backgroundColor: 'var(--color-popup, var(--color-card))', 
                    borderColor: 'var(--popup-border, var(--color-border))' 
                }}>
                <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--popup-border, var(--color-border))' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('performance.form.register')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <PerformanceForm
                        singerId={singerId}
                        allSongs={allSongs}
                        availablePoints={availablePoints}
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
