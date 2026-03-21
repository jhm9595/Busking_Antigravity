import type { Metadata } from 'next'
import { GuidesIndexContent } from '@/components/public/GuidesContent'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleForLanguage(await getRequestLanguage())

  return {
    title: `${locale.publicPages.guides.title} | miniMic`,
    description: locale.publicPages.guides.meta_description,
    alternates: {
      canonical: '/guides',
    },
  }
}

export default function GuidesIndexPage() {
  return <GuidesIndexContent />
}
