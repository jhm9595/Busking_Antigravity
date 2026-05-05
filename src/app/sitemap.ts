import { type MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://minimic.app').replace(/\/$/, '')

  // Static pages
  const staticPages = [
    { url: `${baseUrl}/`, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/explore`, changeFrequency: 'hourly' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/guides`, changeFrequency: 'weekly' as const, priority: 0.7 },
  ]

  // Dynamic singer pages (only verified singers)
  try {
     const singers = await prisma.singer.findMany({
       where: { isVerified: true },
       select: { id: true },
     })

     const singerPages = singers.map(s => ({
       url: `${baseUrl}/singer/${s.id}`,
       changeFrequency: 'weekly' as const,
       priority: 0.6,
     }))

    return [...staticPages, ...singerPages]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return staticPages
  }
}
