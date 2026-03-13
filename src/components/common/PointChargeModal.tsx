'use client'
import React, { useState, useEffect } from 'react'
import { X, Zap, Star, Trophy, Crown, Check, Coins, CreditCard, MessageCircle, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { chargePoints } from '@/services/singer'
import Script from 'next/script'

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
    const [paymentMethod, setPaymentMethod] = useState<'kakao' | 'stripe'>('kakao')
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
            if (paymentMethod === 'kakao') {
                await handleKakaoPay(pkg)
            } else {
                handleStripePay(pkg)
            }
        } catch (error) {
            console.error('Payment initiation failed:', error)
            alert(t('common.payment_ready_failed'))
            setIsSubmitting(false)
        }
    }

    const handleKakaoPay = async (pkg: PointPackage) => {
        try {
            const res = await fetch('/api/payment/kakao/ready', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    points: pkg.points + pkg.bonus,
                    amount: pkg.price,
                    packageName: pkg.label
                })
            })

            const data = await res.json()
            
            if (res.ok && (data.next_redirect_pc_url || data.next_redirect_mobile_url)) {
                // Determine if mobile or PC
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                const redirectUrl = isMobile ? data.next_redirect_mobile_url : data.next_redirect_pc_url
                
                // Redirect user to Kakao Pay payment page
                if (redirectUrl) {
                    window.location.href = redirectUrl
                } else {
                    throw new Error('No redirect URL provided')
                }
            } else {
                throw new Error(data.error || 'Failed to prepare Kakao Pay')
            }
        } catch (error: any) {
            console.error('Kakao Pay Error:', error)
            alert(t('common.payment_ready_failed'))
            setIsSubmitting(false)
        }
    }

    const handleStripePay = async (pkg: PointPackage) => {
        // Implementation for Stripe Checkout or Payment Element
        // For now, let's use the local mock charge since we don't have real keys yet
        const res = await chargePoints(userId, pkg.points + pkg.bonus)
        if (res.success) {
            alert(`[Stripe Mock] ${t('common.charge_success')}`)
            onSuccess(res.points!)
            onClose()
        }
        setIsSubmitting(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div className="bg-[#0f1117] w-full max-w-xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative max-h-[95vh]">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
                    
                    <header className="p-6 md:p-8 flex justify-between items-start relative z-10 shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3 mb-1">
                                <Coins className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                                {t('common.charge')}
                            </h2>
                            <p className="text-gray-500 text-xs md:text-sm font-bold italic">{t('common.charge_desc')}</p>
                        </div>
                        <button onClick={onClose} className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 transition-all active:scale-90">
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </header>

                    <main className="px-6 md:px-8 pb-6 md:pb-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                        {/* 1. Package Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {packages.map((pkg) => (
                                <button
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg.id)}
                                    className={`relative group p-5 rounded-[32px] border-2 transition-all duration-500 text-left overflow-hidden ${
                                        selectedPackage === pkg.id 
                                        ? 'bg-white/5 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.02]' 
                                        : 'bg-gray-900/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    {selectedPackage === pkg.id && (
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-indigo-500 rounded-full p-1 shadow-lg shadow-indigo-500/50">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    )}

                                    {pkg.bonus > 0 && (
                                        <div className={`absolute top-0 left-0 px-3 py-1 rounded-br-2xl bg-gradient-to-r ${pkg.color} text-black font-black text-[8px] uppercase tracking-wider shadow-lg`}>
                                            +{((pkg.bonus / pkg.points) * 100).toFixed(0)}% {t('common.bonus')}
                                        </div>
                                    )}

                                    <div className="flex flex-col h-full pt-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${pkg.color} text-black shadow-lg`}>
                                                <pkg.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{pkg.label}</span>
                                                <span className="text-xl font-mono font-black text-white leading-none">{(pkg.points + pkg.bonus).toLocaleString()}P</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider line-through decoration-red-500/50">
                                                    {pkg.id === 'starter' ? '' : `₩${(pkg.price * 1.2).toLocaleString()}`}
                                                </span>
                                                <span className="text-base font-black text-indigo-400">₩{pkg.price.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* 2. Payment Method Selection */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] italic px-2">
                                {t('common.payment_method')}
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('kakao')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                                        paymentMethod === 'kakao'
                                        ? 'bg-[#FEE500] border-yellow-400 text-black shadow-xl shadow-yellow-400/10 scale-[1.02]'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                                    }`}
                                >
                                    <MessageCircle className="w-5 h-5 fill-current" />
                                    <span className="text-xs font-black uppercase tracking-widest">{t('common.payment_kakao')}</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                                        paymentMethod === 'stripe'
                                        ? 'bg-[#635BFF] border-indigo-400 text-white shadow-xl shadow-indigo-600/20 scale-[1.02]'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">{t('common.payment_stripe')}</span>
                                </button>
                            </div>
                        </div>
                    </main>

                    <footer className="p-6 md:p-8 bg-gray-950/80 border-t border-white/5 relative z-10 shrink-0">
                        <button
                            onClick={handleCharge}
                            disabled={isSubmitting}
                            className={`w-full py-5 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 group ${
                                isSubmitting ? 'bg-gray-800 text-gray-500' : 'bg-white text-black hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{t('common.charge')}</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <p className="mt-4 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest italic opacity-50">
                            Secure Encrypted Payment via {paymentMethod === 'kakao' ? 'Portone' : 'Stripe'}
                        </p>
                        {paymentMethod === 'kakao' && (
                            <p className="mt-2 text-center text-[8px] text-indigo-500/50 font-medium">
                                * Tip: Ensure Kakao Pay is enabled in your Portone console for this Merchant ID.
                            </p>
                        )}
                        </footer>                </div>
            </div>
    )
}
