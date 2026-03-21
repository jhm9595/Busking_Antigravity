import PublicPageLayout from '@/components/common/PublicPageLayout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'About miniMic | Street Performance Revolution',
    description: 'Learn about miniMic, the platform connecting buskers and fans through real-time interaction and location-based discovery.',
    alternates: {
        canonical: '/about',
    },
}

export default function AboutPage() {
    return (
        <PublicPageLayout title="About miniMic">
            <section className="space-y-6">
                <p className="text-xl font-medium text-foreground">
                    miniMic is a next-generation busking platform designed to bridge the gap between street performers and their audience in the digital age.
                </p>
                
                <div className="grid gap-8 md:grid-cols-2 mt-12">
                    <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">For Buskers</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Manage your performances, setlists, and fan interactions all in one place. 
                            Use our real-time dashboard to control your show, accept song requests, and receive sponsorships directly from your audience.
                        </p>
                    </div>
                    <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">For Fans</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Discover live performances near you using our interactive map. 
                            Engage with artists in real-time through chat, request your favorite songs, and support the performers you love with points.
                        </p>
                    </div>
                </div>

                <div className="mt-12 space-y-6">
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Why miniMic?</h2>
                    <p>
                        Street performance is the heartbeat of urban culture, but it often lacks the digital tools to sustain and grow its community. 
                        miniMic provides those tools, offering location-based discovery, real-time setlist synchronization, and a unique sponsorship model that includes rewarded advertising.
                    </p>
                    <p>
                        Our mission is to empower artists to turn every street corner into a world-class stage and to give fans a front-row seat to the best live music, wherever they are.
                    </p>
                </div>

                <div className="mt-12 p-8 rounded-[40px] bg-primary/5 border border-primary/10">
                    <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-primary">Key Features</h2>
                    <ul className="grid gap-4 md:grid-cols-2 list-none p-0">
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <span><strong>Real-time Setlists:</strong> See what's playing now and what's coming up next.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <span><strong>Interactive Map:</strong> Find buskers performing live in your area.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <span><strong>Song Requests:</strong> Directly influence the performance with your requests.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <span><strong>Sponsorship:</strong> Support artists with points or by watching rewarded ads.</span>
                        </li>
                    </ul>
                </div>
            </section>
        </PublicPageLayout>
    )
}
