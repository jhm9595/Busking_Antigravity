'use client'

import React, { useEffect, useRef } from 'react'

interface GoogleAdProps {
    slot: string
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
    responsive?: boolean
    className?: string
}

const AD_SENSE_CLIENT_ID = 'ca-pub-3509429679243965'

export default function GoogleAd({ slot, format = 'auto', responsive = true, className = "" }: GoogleAdProps) {
    const adRef = useRef<HTMLModElement>(null)
    const isAdConfigured = !!AD_SENSE_CLIENT_ID

    useEffect(() => {
        if (isAdConfigured && adRef.current) {
                try {
                    // Push ad to all ad slots
                    (window as any).adsbygoogle = (window as any).adsbygoogle || []
                    ;(window as any).adsbygoogle.push({})
                } catch (e) {
                console.error('AdSense error:', e)
            }
        }
    }, [isAdConfigured, slot])

    // If AdSense is configured, show real ad
    if (isAdConfigured) {
        return (
            <ins
                ref={adRef}
                className={`adsbygoogle ${className}`}
                style={{ display: 'block', minHeight: '50px' }}
                data-ad-client={AD_SENSE_CLIENT_ID}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />
        )
    }

    // Fallback: Show placeholder
    return (
        <div className={`google-ad-container my-8 mx-auto w-full max-w-4xl px-4 ${className}`}>
            <div className="relative group overflow-hidden rounded-[32px] border border-dashed border-border bg-card/50 transition-all hover:bg-card">
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                    <div className="absolute top-2 right-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                        Sponsored
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 border border-primary/20">
                        <span className="text-lg font-black text-primary">Ad</span>
                    </div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase italic tracking-widest mb-1">Google Ad Placement</h4>
                    <p className="text-[10px] text-muted-foreground/60 font-medium max-w-[200px] leading-relaxed">
                        This area is reserved for non-disruptive sponsor content. 
                    </p>
                </div>
            </div>
        </div>
    )
}
