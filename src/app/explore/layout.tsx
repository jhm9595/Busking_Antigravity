import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Busking | miniMic',
  description: 'Find public busking performances, browse active singers, and discover live street music around you on miniMic.',
  alternates: {
    canonical: '/explore',
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
