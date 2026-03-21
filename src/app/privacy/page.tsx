import PublicPageLayout from '@/components/common/PublicPageLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | miniMic',
    description: 'Privacy policy for miniMic, explaining how we handle your data and our use of advertising cookies.',
    alternates: {
        canonical: '/privacy',
    },
}

export default function PrivacyPage() {
    return (
        <PublicPageLayout title="Privacy Policy">
            <section className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Introduction</h2>
                    <p>
                        At miniMic, we value your privacy and are committed to protecting your personal data. 
                        This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Data Collection</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, update your profile, or interact with performers. 
                        This may include your name, email address, and profile information. 
                        We also collect location data to provide our interactive map features.
                    </p>
                </div>

                <div className="space-y-4 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Advertising and Cookies</h2>
                    <p>
                        miniMic uses third-party advertising providers, including Google AdSense, to serve ads when you visit our website. 
                        These companies may use cookies or similar technologies to collect information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you.
                    </p>
                    <p className="font-bold">
                        Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our sites and/or other sites on the Internet.
                    </p>
                    <p>
                        Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. 
                        Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Data Usage</h2>
                    <p>
                        We use your data to provide and improve our services, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Connecting buskers and fans in real-time.</li>
                        <li>Providing location-based discovery of performances.</li>
                        <li>Processing sponsorships and point transactions.</li>
                        <li>Communicating with you about our services and updates.</li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy or our data practices, please contact us at:
                    </p>
                    <p className="font-black text-primary">
                        support@busking.minibig.pw
                    </p>
                </div>
            </section>
        </PublicPageLayout>
    )
}
