'use client'
import React, { useEffect, useState } from 'react'
import { getBookingRequests } from '@/services/singer'
import { Calendar, Mail, CheckCircle, XCircle, Clock, MapPin, MessageSquare, RefreshCw } from 'lucide-react'
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

    if (isLoading) return <div className="p-4 text-center text-muted-foreground italic uppercase font-black text-[10px] tracking-widest animate-pulse">{t('booking.loading')}</div>

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-black text-foreground italic flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {t('booking.title')}
                </h3>
                <button 
                    onClick={fetchRequests} 
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    title={t('booking.refresh')}
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border max-h-[400px] overflow-y-auto custom-scrollbar">
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                        <Mail className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-xs font-bold italic uppercase tracking-widest">{t('booking.empty')}</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="p-6 hover:bg-accent/50 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                            req.status === 'contacted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                            {t(`booking.status.${req.status}`)}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground font-mono font-bold tracking-tighter">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-foreground italic tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                                        {req.requesterName || 'Anonymous Client'}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                                        {t(`booking.modal.types.${req.eventType}`) || req.eventType}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{t('booking.labels.contact')}</span>
                                    <p className="text-xs font-bold text-foreground select-all">{req.contactInfo}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{t('booking.labels.date')}</span>
                                        <div className="flex items-center text-xs font-bold text-muted-foreground">
                                            <Calendar className="w-3 h-3 mr-1.5 text-indigo-500/50" />
                                            {req.eventDate ? new Date(req.eventDate).toLocaleDateString() : t('booking.labels.tbd')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{t('booking.labels.location')}</span>
                                        <div className="flex items-center justify-end text-xs font-bold text-muted-foreground">
                                            <MapPin className="w-3 h-3 mr-1.5 text-amber-500/50" />
                                            <span className="truncate">{req.location || t('booking.labels.tbd')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 pt-2 border-t border-border">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">{t('booking.labels.budget')}</span>
                                    <p className="text-xs font-mono font-black text-emerald-400">{req.budget || t('booking.labels.not_specified')}</p>
                                </div>

                                {req.message && (
                                    <div className="pt-2 border-t border-border">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic mb-1 block">Message</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
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
        </div>
    )
}
