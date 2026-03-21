import PublicPageLayout from '@/components/common/PublicPageLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | miniMic',
    description: 'Terms of service for miniMic, defining acceptable use and our platform policies.',
    alternates: {
        canonical: '/terms',
    },
}

export default function TermsPage() {
    return (
        <PublicPageLayout title="Terms of Service">
            <section className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Acceptance of Terms</h2>
                    <p>
                        By accessing or using miniMic, you agree to be bound by these Terms of Service. 
                        If you do not agree to these terms, please do not use our platform.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Acceptable Use</h2>
                    <p>
                        miniMic is a platform for street performance and fan interaction. 
                        We expect all users to behave respectfully and legally. 
                        The following activities are strictly prohibited:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Harassment, bullying, or hate speech in chat or profiles.</li>
                        <li>Posting illegal, offensive, or inappropriate content.</li>
                        <li>Impersonating other users or performers.</li>
                        <li>Attempting to manipulate our point or sponsorship systems.</li>
                        <li>Using the platform for unauthorized commercial purposes.</li>
                    </ul>
                </div>

                <div className="space-y-4 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">For Performers</h2>
                    <p>
                        Buskers are responsible for the content of their performances and for ensuring they have the necessary permits and rights to perform in their chosen locations. 
                        miniMic does not provide legal advice or permits for street performance.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Points and Sponsorship</h2>
                    <p>
                        Points on miniMic are a virtual currency used for sponsorships and other platform features. 
                        Points have no cash value and cannot be redeemed for real-world currency. 
                        We reserve the right to modify our point system and sponsorship models at any time.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your account if you violate these Terms of Service or engage in behavior that we deem harmful to our community or platform.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Contact</h2>
                    <p>
                        For any questions regarding these terms, please contact us at:
                    </p>
                    <p className="font-black text-primary">
                        support@busking.minibig.pw
                    </p>
                </div>
            </section>
        </PublicPageLayout>
    )
}
