import { auth } from '@clerk/nextjs/server'
import LandingPage from '@/components/home/LandingPage'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const { userId } = await auth()

  let isSinger = false;
  if (userId) {
    try {
      const singer = await prisma.singer.findUnique({ where: { id: userId } });
      isSinger = !!singer;
    } catch (error) {
      console.error('Error fetching singer profile on home page:', error);
    }
  }

  return (
    <LandingPage userId={userId} isSinger={isSinger} />
  )
}
