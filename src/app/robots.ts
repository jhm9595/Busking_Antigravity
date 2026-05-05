import { type MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
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
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://minimic.app'}/sitemap.xml`,
  }
}
