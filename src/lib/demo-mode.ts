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
  // Popular Korean busking songs with YouTube reference links
  const requiredSongs = [
    { title: '무한대한', artist: 'entos', youtubeUrl: 'https://www.youtube.com/watch?v=Q_P4UJSI2Xg' },
    { title: '리泡沫', artist: 'akos', youtubeUrl: 'https://www.youtube.com/watch?v=ruI1G3D2V_U' },
    { title: '그때 그 순간', artist: '김필', youtubeUrl: 'https://www.youtube.com/watch?v=1vkH4DnvHs4' },
    { title: '가을 우체국', artist: '김동률', youtubeUrl: 'https://www.youtube.com/watch?v=7gJ1kNuj1T0' },
    { title: '잠이 오질 않아', artist: '장범준', youtubeUrl: 'https://www.youtube.com/watch?v=WQ0dFcF3pGc' },
    { title: '주저하도록', artist: 'entos', youtubeUrl: 'https://www.youtube.com/watch?v=K3J6H4cH7sE' },
    { title: '안녕', artist: '지아', youtubeUrl: 'https://www.youtube.com/watch?v=0G5fZqT3z4M' },
    { title: '흔들리는 꽃들 속에서 네 샴푸향이 바람날 때', artist: '장범준', youtubeUrl: 'https://www.youtube.com/watch?v=6Dr2J8H0rAo' },
    { title: '사건의 지평선', artist: '윤하', youtubeUrl: 'https://www.youtube.com/watch?v=MKpsFFFFPWA' },
    { title: '우리를構成する何か', artist: '잔나비', youtubeUrl: 'https://www.youtube.com/watch?v=N7gZ9X7z3Fo' }
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
      isRepertoire: true,
      youtubeUrl: song.youtubeUrl
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

  // Get demo songs to include in performances
  const demoSongs = await tx.song.findMany({
    where: { singerId },
    orderBy: { title: 'asc' },
    take: 6 // Take first 6 songs
  })

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
        status: 'live',
        performanceSongs: {
          create: demoSongs.slice(0, 4).map((song, index) => ({
            songId: song.id,
            order: index,
            status: index === 0 ? 'live' : 'planned'
          }))
        }
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
        status: 'scheduled',
        performanceSongs: {
          create: demoSongs.slice(2, 5).map((song, index) => ({
            songId: song.id,
            order: index,
            status: 'planned'
          }))
        }
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
        status: 'scheduled',
        performanceSongs: {
          create: demoSongs.slice(4, 6).map((song, index) => ({
            songId: song.id,
            order: index,
            status: 'planned'
          }))
        }
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
