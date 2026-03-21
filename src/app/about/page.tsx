import { Metadata } from 'next'
import { AboutPageContent } from '@/components/public/PublicPageContent'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
    const locale = getLocaleForLanguage(await getRequestLanguage())

    return {
        title: `${locale.publicPages.about.title} | miniMic`,
        description: locale.publicPages.about.meta_description,
        alternates: {
            canonical: '/about',
        },
    }
}

export default function AboutPage() {
    return <AboutPageContent />
}
