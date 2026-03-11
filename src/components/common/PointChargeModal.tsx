'use client'
import React, { useState } from 'react'
import { X, Zap, Star, Trophy, Crown, Check, Coins } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { chargePoints } from '@/services/singer'

interface PointPackage {
    id: string
    points: number
    bonus: number
    price: number
    label: string
    icon: React.ElementType
    color: string
}

interface PointChargeModalProps {
    userId: string
    isOpen: boolean
    onClose: () => void
    onSuccess: (newPoints: number) => void
}

export default function PointChargeModal({ userId, isOpen, onClose, onSuccess }: PointChargeModalProps) {
    const { t } = useLanguage()
    const [selectedPackage, setSelectedPackage] = useState<string>('silver')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const packages: PointPackage[] = [
        { id: 'starter', points: 1000, bonus: 0, price: 1100, label: 'Starter', icon: Zap, color: 'from-blue-500 to-indigo-500' },
        { id: 'bronze', points: 5000, bonus: 250, price: 5500, label: 'Bronze', icon: Star, color: 'from-amber-600 to-orange-700' },
        { id: 'silver', points: 10000, bonus: 1500, price: 11000, label: 'Silver', icon: Trophy, color: 'from-slate-300 to-slate-500' },
        { id: 'gold', points: 30000, bonus: 6000, price: 33000, label: 'Gold', icon: Crown, color: 'from-yellow-400 via-amber-500 to-yellow-600' }
    ]

    const handleCharge = async () => {
        const pkg = packages.find(p => p.id === selectedPackage)
        if (!pkg || isSubmitting) return

        setIsSubmitting(true)
        try {
            // In the future, this is where PG integration happens
            const totalPoints = pkg.points + pkg.bonus
            const res = await chargePoints(userId, totalPoints)
            if (res.success) {
                alert(t('common.charge_success'))
                onSuccess(res.points!)
                onClose()
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f1117] w-full max-w-xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
                
                <header className="p-8 flex justify-between items-start relative z-10">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-white italic tracking-tight flex items-center gap-3 mb-2">
                            <Coins className="w-8 h-8 text-amber-400" />
                            {t('common.charge')}
                        </h2>
                        <p className="text-gray-500 text-sm font-bold italic">{t('common.charge_desc')}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 transition-all active:scale-90">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <main className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.id}
                                onClick={() => setSelectedPackage(pkg.id)}
                                className={`relative group p-6 rounded-[32px] border-2 transition-all duration-500 text-left overflow-hidden ${
                                    selectedPackage === pkg.id 
                                    ? 'bg-white/5 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.02]' 
                                    : 'bg-gray-900/40 border-white/5 hover:border-white/20'
                                }`}
                            >
                                {/* Active Highlight */}
                                {selectedPackage === pkg.id && (
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-indigo-500 rounded-full p-1 shadow-lg shadow-indigo-500/50">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Bonus Badge */}
                                {pkg.bonus > 0 && (
                                    <div className={`absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl bg-gradient-to-r ${pkg.color} text-black font-black text-[9px] uppercase tracking-wider shadow-lg`}>
                                        +{((pkg.bonus / pkg.points) * 100).toFixed(0)}% {t('common.bonus')}
                                    </div>
                                )}

                                <div className="flex flex-col h-full pt-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${pkg.color} text-black shadow-lg`}>
                                            <pkg.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{pkg.label}</span>
                                            <span className="text-2xl font-mono font-black text-white leading-none">{(pkg.points + pkg.bonus).toLocaleString()}P</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider line-through decoration-red-500/50">
                                                {pkg.id === 'starter' ? '' : `₩${(pkg.price * 1.2).toLocaleString()}`}
                                            </span>
                                            <span className="text-lg font-black text-indigo-400">₩{pkg.price.toLocaleString()}</span>
                                        </div>
                                        {pkg.id === 'silver' && (
                                            <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/30 uppercase tracking-tighter">
                                                {t('common.most_popular')}
                                            </span>
                                        )}
                                        {pkg.id === 'gold' && (
                                            <span className="text-[8px] font-black bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30 uppercase tracking-tighter">
                                                {t('common.best_value')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </main>

                <footer className="p-8 bg-gray-950/80 border-t border-white/5 relative z-10">
                    <button
                        onClick={handleCharge}
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{t('common.charge')}</span>
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                            </>
                        )}
                    </button>
                    <p className="mt-4 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest italic opacity-50">
                        Secure SSL Encrypted Payment
                    </p>
                </footer>
            </div>
        </div>
    )
}
