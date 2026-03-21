import { Metadata } from 'next'
import { TermsPageContent } from '@/components/public/PublicPageContent'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
    const locale = getLocaleForLanguage(await getRequestLanguage())

    return {
        title: `${locale.publicPages.terms.title} | miniMic`,
        description: locale.publicPages.terms.meta_description,
        alternates: {
            canonical: '/terms',
        },
    }
}

export default function TermsPage() {
    return <TermsPageContent />
}
