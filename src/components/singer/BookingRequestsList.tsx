'use client'
import React, { useEffect, useState } from 'react'
import { getSingerBookingRequests } from '@/services/singer'
import { Calendar, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BookingRequestsList({ userId }: { userId: string }) {
    const { t } = useLanguage()
    const [requests, setRequests] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchRequests = async () => {
        setIsLoading(true)
        const data = await getSingerBookingRequests(userId)
        setRequests(data)
        setIsLoading(false)
    }

    useEffect(() => {
        if (userId) fetchRequests()
    }, [userId])

    if (isLoading) return <div className="p-4 text-center text-gray-500">{t('booking.loading')}</div>

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-indigo-500" />
                    {t('booking.title')}
                </h2>
                <button onClick={fetchRequests} className="text-sm text-indigo-600 hover:text-indigo-800">{t('booking.refresh')}</button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {requests.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                        <Mail className="w-12 h-12 mb-2 opacity-20" />
                        <p>{t('booking.empty')}</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="p-5 hover:bg-gray-50 transition duration-150">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            req.status === 'contacted' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {t(`booking.status.${req.status}`)}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mt-1">{req.requesterName}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded text-xs">
                                        {t(`booking.modal.types.${req.eventType}`) || req.eventType}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-bold text-gray-700">{t('booking.labels.contact')}:</span> {req.contactInfo}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                                <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {req.eventDate ? new Date(req.eventDate).toLocaleDateString() : t('booking.labels.tbd')}
                                </div>
                                <div>
                                    {t('booking.labels.location')}: {req.location || t('booking.labels.tbd')}
                                </div>
                                <div className="col-span-2">
                                    {t('booking.labels.budget')}: {req.budget || t('booking.labels.not_specified')}
                                </div>
                            </div>

                            {req.message && (
                                <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3 my-2">
                                    "{req.message}"
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
