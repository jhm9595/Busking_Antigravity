'use client'

import React, { useEffect, useRef } from 'react'

interface GoogleAdProps {
    slot: string
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
    responsive?: boolean
    className?: string
}

const AD_SENSE_CLIENT_ID = 'ca-pub-3509429679243965'
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'

export default function GoogleAd({ slot, format = 'auto', responsive = true, className = "" }: GoogleAdProps) {
    const adRef = useRef<HTMLModElement>(null)
    const isAdConfigured = !!AD_SENSE_CLIENT_ID && ADS_ENABLED

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

    // Hide completely until AdSense is approved and enabled
    if (!isAdConfigured) {
        return null
    }

    // Render real ad (only when enabled and configured)
    return (
        <ins
            ref={adRef}
            className={`adsbygoogle ${className}`}
            style={{ display: 'block' }}
            data-ad-client={AD_SENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
        />
    )
}
