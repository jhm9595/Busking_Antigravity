import { prisma } from '@/lib/prisma'
import { nowKST, toKSTISOString } from '@/lib/kst-time'
import type { Prisma } from '@prisma/client'

const DEMO_SINGER_ID = 'demo-singer-001'
const DEMO_SINGER_EMAIL = 'demo@minimic.app'

export interface DemoData {
  singerId: string
  performanceIds: string[]
  generatedAt: string
  mode: 'created' | 'reset'
}

async function ensureDemoSinger(): Promise<string> {
  await prisma.profile.upsert({
    where: { id: DEMO_SINGER_ID },
    update: {
      email: DEMO_SINGER_EMAIL,
      role: 'singer',
      nickname: 'Demo'
    },
    create: {
      id: DEMO_SINGER_ID,
      email: DEMO_SINGER_EMAIL,
      role: 'singer',
      nickname: 'Demo'
    }
  })

  await prisma.singer.upsert({
    where: { id: DEMO_SINGER_ID },
    update: {
      stageName: 'Demo Artist',
      bio: 'Sample busker for demo mode',
      isVerified: true
    },
    create: {
      id: DEMO_SINGER_ID,
      stageName: 'Demo Artist',
      bio: 'Sample busker for demo mode',
      isVerified: true
    }
  })

  return DEMO_SINGER_ID
}

async function ensureDemoSongs(singerId: string): Promise<void> {
  const requiredSongs = [
    { title: 'Sample Song 1', artist: 'Demo Artist' },
    { title: 'Sample Song 2', artist: 'Demo Artist' },
    { title: 'Sample Song 3', artist: 'Demo Artist' }
  ]

  const existingSongs = await prisma.song.findMany({
    where: { singerId },
    select: { title: true, artist: true }
  })

  const existingKeys = new Set(existingSongs.map((song) => `${song.title}::${song.artist}`))
  const songsToCreate = requiredSongs.filter((song) => !existingKeys.has(`${song.title}::${song.artist}`))

  if (!songsToCreate.length) {
    return
  }

  await prisma.song.createMany({
    data: songsToCreate.map((song) => ({
      singerId,
      title: song.title,
      artist: song.artist,
      isRepertoire: true
    }))
  })
}

async function generateDemoPerformances(
  singerId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string[]> {
  const now = nowKST()

  const liveStart = new Date(now.getTime() - 5 * 60 * 1000)
  const liveEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const scheduledOneStart = new Date(now.getTime() + 1 * 60 * 60 * 1000)
  const scheduledOneEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000)

  const scheduledTwoStart = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const scheduledTwoEnd = new Date(now.getTime() + 5 * 60 * 60 * 1000)

  const created = await Promise.all([
    tx.performance.create({
      data: {
        singerId,
        title: 'Demo Live Session',
        locationText: 'Hongdae Walking Street',
        locationLat: 37.5563,
        locationLng: 126.922,
        startTime: liveStart,
        endTime: liveEnd,
        description: 'Live sample performance for demo mode',
        chatEnabled: true,
        status: 'live'
      },
      select: { id: true }
    }),
    tx.performance.create({
      data: {
        singerId,
        title: 'Demo Evening Acoustic',
        locationText: 'Yeonnam Forest Road',
        locationLat: 37.5626,
        locationLng: 126.9237,
        startTime: scheduledOneStart,
        endTime: scheduledOneEnd,
        description: 'Scheduled sample performance for demo mode',
        chatEnabled: false,
        status: 'scheduled'
      },
      select: { id: true }
    }),
    tx.performance.create({
      data: {
        singerId,
        title: 'Demo Night Set',
        locationText: 'Sinchon Star Square',
        locationLat: 37.5572,
        locationLng: 126.9368,
        startTime: scheduledTwoStart,
        endTime: scheduledTwoEnd,
        description: 'Scheduled sample performance for demo mode',
        chatEnabled: false,
        status: 'scheduled'
      },
      select: { id: true }
    })
  ])

  return created.map((item) => item.id)
}

export async function resetDemoData(): Promise<DemoData> {
  const singerId = await ensureDemoSinger()

  const performanceIds = await prisma.$transaction(async (tx) => {
    const demoPerformances = await tx.performance.findMany({
      where: { singerId },
      select: { id: true }
    })
    const ids = demoPerformances.map((performance) => performance.id)

    if (ids.length) {
      await tx.performanceSong.deleteMany({
        where: { performanceId: { in: ids } }
      })

      await tx.songRequest.deleteMany({
        where: { performanceId: { in: ids } }
      })

      await tx.performance.deleteMany({
        where: { id: { in: ids } }
      })
    }

    await tx.song.deleteMany({
      where: { singerId }
    })

    return generateDemoPerformances(singerId, tx)
  })

  await ensureDemoSongs(singerId)

  return {
    singerId,
    performanceIds,
    generatedAt: toKSTISOString(nowKST()),
    mode: 'reset'
  }
}

export async function ensureDemoData(): Promise<DemoData> {
  const singerId = await ensureDemoSinger()
  await ensureDemoSongs(singerId)

  const existingPerformances = await prisma.performance.findMany({
    where: {
      singerId,
      status: { in: ['live', 'scheduled'] }
    },
    orderBy: { startTime: 'asc' },
    select: { id: true }
  })

  const performanceIds = existingPerformances.length
    ? existingPerformances.map((performance) => performance.id)
    : await generateDemoPerformances(singerId)

  return {
    singerId,
    performanceIds,
    generatedAt: toKSTISOString(nowKST()),
    mode: 'created'
  }
}

export async function getDemoData(): Promise<DemoData | null> {
  const singer = await prisma.singer.findUnique({
    where: { id: DEMO_SINGER_ID },
    select: { id: true }
  })

  if (!singer) {
    return null
  }

  const performances = await prisma.performance.findMany({
    where: {
      singerId: DEMO_SINGER_ID,
      status: { in: ['live', 'scheduled'] }
    },
    orderBy: { startTime: 'asc' },
    select: { id: true }
  })

  return {
    singerId: DEMO_SINGER_ID,
    performanceIds: performances.map((performance) => performance.id),
    generatedAt: toKSTISOString(nowKST()),
    mode: 'created'
  }
}
