'use client'

import Script from 'next/script'

const AD_SENSE_CLIENT_ID = 'ca-pub-3509429679243965'

export default function AdSenseScript() {
    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_SENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    )
}
