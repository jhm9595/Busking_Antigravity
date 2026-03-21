import AppFooter from './AppFooter'

export default function PublicPageLayout({ children, title }: { children: React.ReactNode, title?: string }) {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
                {title && (
                    <h1 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter uppercase text-primary italic">
                        {title}
                    </h1>
                )}
                <div className="space-y-8 text-foreground/90 leading-relaxed">
                    {children}
                </div>
            </main>
            <AppFooter />
        </div>
    )
}
