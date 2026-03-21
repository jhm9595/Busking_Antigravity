import PublicPageLayout from '@/components/common/PublicPageLayout'
import { Metadata } from 'next'
import { Mail, MessageSquare, MapPin } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Contact Us | miniMic',
    description: 'Contact the miniMic support team for inquiries, feedback, or assistance.',
    alternates: {
        canonical: '/contact',
    },
}

export default function ContactPage() {
    return (
        <PublicPageLayout title="Contact Us">
            <section className="space-y-12">
                <div className="space-y-6">
                    <p className="text-xl font-medium text-foreground">
                        Have questions, feedback, or need assistance with miniMic? 
                        Our support team is here to help you.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="p-8 rounded-[40px] border border-border bg-card shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Email Support</h2>
                        <p className="text-sm text-muted-foreground">
                            For general inquiries, technical support, or account issues, please email us at:
                        </p>
                        <p className="text-xl font-black text-primary break-all">
                            support@busking.minibig.pw
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                            We typically respond within 24-48 hours.
                        </p>
                    </div>

                    <div className="p-8 rounded-[40px] border border-border bg-card shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-primary">Feedback</h2>
                        <p className="text-sm text-muted-foreground">
                            We love hearing from our community. 
                            If you have suggestions for new features or improvements, feel free to reach out.
                        </p>
                        <p className="text-sm font-bold">
                            Your feedback helps us build a better platform for everyone.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-primary">Location</h2>
                            <p className="text-sm text-muted-foreground">
                                miniMic is a global platform, but our heart is in the streets where the music happens.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed">
                        While we don't have a physical office for public visits, you can find us virtually on the map wherever buskers are performing. 
                        For all official correspondence, please use our support email.
                    </p>
                </div>

            </section>
        </PublicPageLayout>
    )
}
