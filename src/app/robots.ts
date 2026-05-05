import { MetadataRoute } from 'next'
import { NEXT_PUBLIC_APP_URL } from 'next/env'

export const dynamic = 'force-static'

export const metadata: MetadataRoute = {
  robots: {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/dashboard', '/singer/dashboard', '/live', '/api/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: ['/'],
      },
      {
        userAgent: 'Google-Adsbot',
        allow: ['/'],
      },
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/dashboard', '/singer/dashboard', '/live', '/api/', '/private/'],
      },
    ],
    sitemap: `${NEXT_PUBLIC_APP_URL || 'https://minimic.app'}/sitemap.xml`,
  },
}
