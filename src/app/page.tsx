import { auth } from '@clerk/nextjs/server'
import LandingPage from '@/components/home/LandingPage'

export default async function Home() {
  const { userId } = await auth()

  return (
    <LandingPage userId={userId} />
  )
}
