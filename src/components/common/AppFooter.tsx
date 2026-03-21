import Link from 'next/link'

export default function AppFooter() {
    return (
        <footer className="w-full border-t border-border bg-background py-8 mt-auto z-10 relative">
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <Link href="/" className="text-xl font-black italic tracking-tighter text-foreground hover:opacity-80 transition-opacity">
                        miniMic
                    </Link>
                    <span className="text-xs text-muted-foreground font-medium">
                        © {new Date().getFullYear()} miniMic. All rights reserved.
                    </span>
                </div>
                
                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-bold text-muted-foreground">
                    <Link href="/about" className="hover:text-primary transition-colors uppercase tracking-wider text-[11px]">
                        About
                    </Link>
                    <Link href="/guides" className="hover:text-primary transition-colors uppercase tracking-wider text-[11px]">
                        Guides
                    </Link>
                    <Link href="/contact" className="hover:text-primary transition-colors uppercase tracking-wider text-[11px]">
                        Contact
                    </Link>
                    <Link href="/terms" className="hover:text-primary transition-colors uppercase tracking-wider text-[11px]">
                        Terms
                    </Link>
                    <Link href="/privacy" className="hover:text-primary transition-colors uppercase tracking-wider text-[11px]">
                        Privacy
                    </Link>
                </nav>
            </div>
        </footer>
    )
}
