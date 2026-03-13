'use client'

import React from 'react'

interface GoogleAdProps {
    slot: string
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
    responsive?: boolean
    className?: string
}

export default function GoogleAd({ slot, format = 'auto', responsive = true, className = "" }: GoogleAdProps) {
    // In a real implementation, this would contain the ins tag and the script to push the ad.
    // For now, we'll create a stylized placeholder that matches the product's aesthetic
    // and serves as a placement marker for Pixel Design and Scout QA.

    return (
        <div className={`google-ad-container my-8 mx-auto w-full max-w-4xl px-4 ${className}`}>
            <div className="relative group overflow-hidden rounded-[32px] border border-dashed border-white/10 bg-white/[0.02] transition-all hover:bg-white/[0.04]">
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="absolute top-2 right-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                        Sponsored
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-xl font-black text-indigo-400">Ad</span>
                    </div>
                    <h4 className="text-sm font-black text-white/40 uppercase italic tracking-widest mb-2">Google Ad Placement</h4>
                    <p className="text-[11px] text-white/20 font-bold max-w-[280px] leading-relaxed uppercase italic">
                        This area is reserved for non-disruptive sponsor content. 
                        Slot ID: {slot}
                    </p>
                </div>
                
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 rounded-tl-[32px]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/10 rounded-tr-[32px]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/10 rounded-bl-[32px]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 rounded-br-[32px]" />
            </div>
        </div>
    )
}
