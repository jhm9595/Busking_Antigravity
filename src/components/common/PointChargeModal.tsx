'use client'
import React, { useState, useEffect } from 'react'
import { X, Zap, Star, Trophy, Crown, Check, Coins, CreditCard, MessageCircle, ChevronRight, Tv } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { chargePoints } from '@/services/singer'
import { showAdModal } from '@/utils/adModal'
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
                // Check if in mock mode
                if (data._mock) {
                    console.log('Running in MOCK payment mode')
                }
                
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
                // Show more detailed error for debugging
                const errorMsg = data.error || 'Failed to prepare Kakao Pay'
                const hint = data.hint ? `\n\nHint: ${data.hint}` : ''
                const debug = data.debug ? `\n\nDebug: ${JSON.stringify(data.debug, null, 2)}` : ''
                console.error('Kakao Pay Error Details:', data)
                
                // Show detailed error to user
                alert(`${errorMsg}${hint}${debug}`)
                throw new Error(errorMsg)
            }
        } catch (error: any) {
            console.error('Kakao Pay Error:', error)
            // Don't show generic error, show the actual error message
            alert(error.message || t('common.payment_ready_failed'))
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

    const handleWatchAd = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)
        
        // Show ad modal (simulated)
        const watched = await showAdModal(t)
        
        if (watched) {
            // Award free points (e.g., 50 points for watching ad)
            const res = await chargePoints(userId, 50)
            if (res.success) {
                alert(t('common.ad_reward') || 'You earned 50 points!')
                onSuccess(res.points!)
            }
        }
        setIsSubmitting(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
                <div className="w-full max-w-xl rounded-[32px] md:rounded-[48px] border border-white/10 shadow-2xl overflow-hidden flex flex-col relative max-h-[92vh]" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[var(--color-primary)]/10 to-transparent pointer-events-none" />
                    
                    <header className="p-5 md:p-8 flex justify-between items-start relative z-10 shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-xl md:text-3xl font-black italic tracking-tight flex items-center gap-2 md:gap-3 mb-0.5" style={{ color: 'var(--color-text-inverse)' }}>
                                <Coins className="w-5 h-5 md:w-8 md:h-8" style={{ color: 'var(--color-primary)' }} />
                                {t('common.charge')}
                            </h2>
                            <p className="text-[10px] md:text-sm font-bold italic" style={{ color: 'var(--color-text-muted)' }}>{t('common.charge_desc')}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl border transition-all active:scale-90" style={{ backgroundColor: 'var(--color-surface-overlay)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                            <X className="w-5 h-5" />
                        </button>
                    </header>

                    <main className="px-5 md:px-8 pb-4 md:pb-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-6 md:space-y-8">
                        {/* 1. Package Selection */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {packages.map((pkg) => (
                                <button
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg.id)}
                                    className={`relative group p-3 md:p-5 rounded-2xl md:rounded-[32px] border-2 transition-all duration-500 text-left overflow-hidden ${
                                        selectedPackage === pkg.id 
                                        ? 'border-primary shadow-2xl scale-[1.02]' 
                                        : 'border-border hover:border-text-muted'
                                    }`}
                                    style={{ 
                                        backgroundColor: selectedPackage === pkg.id ? 'var(--color-surface-overlay)' : 'var(--color-surface)',
                                        borderColor: selectedPackage === pkg.id ? 'var(--color-primary)' : 'var(--color-border)'
                                    }}
                                >
                                    {selectedPackage === pkg.id && (
                                        <div className="absolute top-2 right-2 md:top-4 md:right-4">
                                            <div className="rounded-full p-0.5 md:p-1 shadow-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                                                <Check className="w-2 h-2 md:w-3 md:h-3" style={{ color: 'var(--color-primary-foreground)' }} />
                                            </div>
                                        </div>
                                    )}

                                    {pkg.bonus > 0 && (
                                        <div className={`absolute top-0 left-0 px-2 py-0.5 md:px-3 md:py-1 rounded-br-xl md:rounded-br-2xl bg-gradient-to-r ${pkg.color} text-black font-black text-[8px] md:text-xs uppercase tracking-wider shadow-lg`}>
                                            +{((pkg.bonus / pkg.points) * 100).toFixed(0)}% {t('common.bonus')}
                                        </div>
                                    )}

                                    <div className="flex flex-col h-full pt-1 md:pt-2">
                                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                            <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-br ${pkg.color} text-black shadow-lg`}>
                                                <pkg.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-0.5 md:mb-1" style={{ color: 'var(--color-text-muted)' }}>{pkg.label}</span>
                                                <span className="text-sm md:text-xl font-mono font-black leading-none" style={{ color: 'var(--color-text-inverse)' }}>{(pkg.points + pkg.bonus).toLocaleString()}P</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] md:text-xs font-bold uppercase tracking-wider line-through" style={{ color: 'var(--color-text-muted)' }}>
                                                    {pkg.id === 'starter' ? '' : `₩${(pkg.price * 1.2).toLocaleString()}`}
                                                </span>
                                                <span className="text-xs md:text-base font-black" style={{ color: 'var(--color-primary)' }}>₩{pkg.price.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* 2. Payment Method Selection */}
                        <div className="space-y-2 md:space-y-3">
                            <h3 className="text-[10px] md:text-xs font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] italic px-2">
                                {t('common.payment_method')}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                <button
                                    onClick={() => setPaymentMethod('kakao')}
                                    className={`flex items-center justify-center gap-2 p-3.5 min-h-[48px] rounded-2xl border-2 transition-all ${
                                        paymentMethod === 'kakao'
                                        ? 'text-black shadow-xl scale-[1.02]'
                                        : 'text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                                    }`}
                                    style={{
                                        backgroundColor: paymentMethod === 'kakao' ? '#FEE500' : 'var(--color-surface-overlay)',
                                        borderColor: paymentMethod === 'kakao' ? 'var(--color-primary)' : 'var(--color-border)'
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('common.payment_kakao')}</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('stripe')}
                                    className={`flex items-center justify-center gap-2 p-3.5 min-h-[48px] rounded-2xl border-2 transition-all ${
                                        paymentMethod === 'stripe'
                                        ? 'text-white shadow-xl scale-[1.02]'
                                        : 'text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                                    }`}
                                    style={{
                                        backgroundColor: paymentMethod === 'stripe' ? '#635BFF' : 'var(--color-surface-overlay)',
                                        borderColor: paymentMethod === 'stripe' ? 'var(--color-primary)' : 'var(--color-border)'
                                    }}
                                >
                                    <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('common.payment_stripe')}</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Watch Ad Option */}
                        <div className="space-y-2 md:space-y-3">
                            <h3 className="text-[10px] md:text-xs font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] italic px-2">
                                {t('common.free_points')}
                            </h3>
                            <button
                                onClick={handleWatchAd}
                                disabled={isSubmitting}
                                className={`w-full flex items-center justify-center gap-2 p-3.5 min-h-[48px] rounded-2xl border-2 transition-all ${
                                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                style={{
                                    backgroundColor: 'var(--color-accent)',
                                    borderColor: 'var(--color-border)',
                                    color: 'var(--color-primary)'
                                }}
                            >
                                <Tv className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{t('common.watch_ad')}</span>
                            </button>
                        </div>
                    </main>

                    <footer className="p-4 md:p-8 bg-[var(--color-surface-elevated)]/80 border-t border-white/5 relative z-10 shrink-0">
                        <button
                            onClick={handleCharge}
                            disabled={isSubmitting}
                            className={`w-full py-3 md:py-4 rounded-xl md:rounded-[20px] font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 group ${
                                isSubmitting ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)]' : 'hover:scale-[1.02] active:scale-95'
                            }`}
                            style={!isSubmitting ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' } : undefined}
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{t('common.charge')}</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        <p className="mt-2 md:mt-3 text-center text-[9px] md:text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-widest italic opacity-50">
                            Secure Encrypted Payment via {paymentMethod === 'kakao' ? 'Kakao Pay' : 'Stripe'}
                        </p>
                        </footer>                </div>
            </div>
    )
}
