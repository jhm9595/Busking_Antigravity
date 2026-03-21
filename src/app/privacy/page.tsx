import { Metadata } from 'next'
import { PrivacyPageContent } from '@/components/public/PublicPageContent'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
    const locale = getLocaleForLanguage(await getRequestLanguage())

    return {
        title: `${locale.publicPages.privacy.title} | miniMic`,
        description: locale.publicPages.privacy.meta_description,
        alternates: {
            canonical: '/privacy',
        },
    }
}

export default function PrivacyPage() {
    return <PrivacyPageContent />
}
