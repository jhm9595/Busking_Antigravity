import type { Metadata } from 'next'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleForLanguage(await getRequestLanguage())

  return {
    title: `${locale.home.explore_title} | miniMic`,
    description: locale.publicPages.explore.meta_description,
    alternates: {
      canonical: '/explore',
    },
  }
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
