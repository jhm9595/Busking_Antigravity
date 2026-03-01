import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface LiveHeaderProps {
    performanceId: string;
    title: string;
    locationText: string;
    onEndPerformance: () => Promise<void>;
}

export default function LiveHeader({ performanceId, title, locationText, onEndPerformance }: LiveHeaderProps) {
    const { t } = useLanguage()
    const router = useRouter()

    return (
        <div className="p-4 pl-20 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0 z-20 shadow-xl">
            <div>
                <h1 className="text-xl font-bold text-white max-w-[200px] truncate">{title}</h1>
                <p className="text-sm text-gray-400">{locationText}</p>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => {
                        sessionStorage.setItem('ignore_resume_check', 'true')
                        router.push('/singer/dashboard')
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                    Go to Dashboard
                </button>
                <button
                    onClick={onEndPerformance}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-red-900/20"
                >
                    {t('live.header.end_button')}
                </button>
            </div>
        </div>
    )
}
