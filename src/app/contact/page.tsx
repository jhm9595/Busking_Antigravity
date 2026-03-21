import { Metadata } from 'next'
import { ContactPageContent } from '@/components/public/PublicPageContent'
import { getLocaleForLanguage, getRequestLanguage } from '@/lib/requestLanguage'

export async function generateMetadata(): Promise<Metadata> {
    const locale = getLocaleForLanguage(await getRequestLanguage())

    return {
        title: `${locale.publicPages.contactPage.title} | miniMic`,
        description: locale.publicPages.contactPage.meta_description,
        alternates: {
            canonical: '/contact',
        },
    }
}

export default function ContactPage() {
    return <ContactPageContent />
}
