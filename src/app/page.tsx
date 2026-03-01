import { auth } from '@clerk/nextjs/server'
import LandingPage from '@/components/home/LandingPage'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const { userId } = await auth()

  let isSinger = false;
  if (userId) {
    const singer = await prisma.singer.findUnique({ where: { id: userId } });
    isSinger = !!singer;
  }

  return (
    <LandingPage userId={userId} isSinger={isSinger} />
  )
}
