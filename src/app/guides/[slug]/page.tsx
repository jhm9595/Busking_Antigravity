import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GuideDetailContent } from '@/components/public/GuidesContent'
import { getAllGuides, getGuideBySlug } from '@/content/guides'
import { getRequestLanguage } from '@/lib/requestLanguage'

interface GuidePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug, await getRequestLanguage())

  if (!guide) {
    return {
      title: 'Guide Not Found | miniMic',
      description: 'The requested guide could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${guide.title} | miniMic`,
    description: guide.description,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      title: `${guide.title} | miniMic`,
      description: guide.description,
      type: 'article',
      url: `/guides/${guide.slug}`,
    },
  }
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)

  if (!guide) {
    notFound()
  }

  return <GuideDetailContent slug={slug} />
}
