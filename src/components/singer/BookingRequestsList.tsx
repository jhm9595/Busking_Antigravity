'use client'
import React, { useEffect, useState } from 'react'
import { getBookingRequests } from '@/services/singer'
import { Calendar, Mail, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BookingRequestsList({ userId }: { userId: string }) {
    const { t } = useLanguage()
    const [requests, setRequests] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchRequests = async () => {
        if (!userId) return
        setIsLoading(true)
        try {
            const data = await getBookingRequests(userId)
            setRequests(data)
        } catch (error) {
            console.error('Failed to fetch booking requests:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [userId])

    if (isLoading) return <div className="p-4 text-center text-gray-500 italic uppercase font-black text-[10px] tracking-widest animate-pulse">{t('booking.loading')}</div>

    return (
        <div className="bg-gray-900/40 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="bg-gray-950/60 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-sm font-black text-white flex items-center gap-2 italic uppercase tracking-wider">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    {t('booking.title')}
                </h2>
                <button 
                    onClick={fetchRequests} 
                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                >
                    {t('booking.refresh')}
                </button>
            </div>

            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-600 flex flex-col items-center gap-3">
                        <Mail className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold italic uppercase tracking-widest">{t('booking.empty')}</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="p-6 hover:bg-white/5 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            req.status === 'contacted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            'bg-gray-800 text-gray-500 border border-white/5'
                                        }`}>
                                            {t(`booking.status.${req.status}`)}
                                        </span>
                                        <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tighter">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-white italic tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                                        {req.requesterName || 'Anonymous Client'}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                                        {t(`booking.modal.types.${req.eventType}`) || req.eventType}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{t('booking.labels.contact')}</span>
                                    <p className="text-xs font-bold text-gray-300 select-all">{req.contactInfo}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{t('booking.labels.date')}</span>
                                        <div className="flex items-center text-xs font-bold text-gray-400">
                                            <Calendar className="w-3 h-3 mr-1.5 text-indigo-500/50" />
                                            {req.eventDate ? new Date(req.eventDate).toLocaleDateString() : t('booking.labels.tbd')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{t('booking.labels.location')}</span>
                                        <div className="flex items-center justify-end text-xs font-bold text-gray-400">
                                            <MapPin className="w-3 h-3 mr-1.5 text-amber-500/50" />
                                            <span className="truncate">{req.location || t('booking.labels.tbd')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">{t('booking.labels.budget')}</span>
                                    <p className="text-xs font-mono font-black text-emerald-400">{req.budget || t('booking.labels.not_specified')}</p>
                                </div>

                                {req.message && (
                                    <div className="pt-2 border-t border-white/5">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic mb-1 block">Message</span>
                                        <p className="text-xs text-gray-400 leading-relaxed italic font-medium">
                                            "{req.message}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
