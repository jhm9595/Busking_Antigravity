
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for singers...')
    const singers = await prisma.singer.findMany()

    if (singers.length === 0) {
        console.log('No singers found. Please create a singer first via the dashboard or database manually.')
        // For now, I will abort if no signer is found to avoid complexity of creating a dummy user + profile + singer. 
        // Usually User/Profile is managed by Clerk which is harder to fake without auth.
        // BUT! Since id is just uuid, I CAN fake it for testing.
        console.log('Creating a dummy singer for testing...')

        const dummyId = 'test-singer-' + Date.now()

        // Check/Create Profile first
        await prisma.profile.create({
            data: {
                id: dummyId,
                role: 'singer',
                nickname: 'Test Singer',
                email: 'test@example.com'
            }
        })

        await prisma.singer.create({
            data: {
                id: dummyId,
                stageName: 'Test Singer Band',
                qrCodePattern: 'test',
                isVerified: true
            }
        })
        console.log('Created dummy singer:', dummyId)
    }

    const singer = await prisma.singer.findFirst()
    console.log('Using singer:', singer.stageName)

    // Check Performances
    const performances = await prisma.performance.findMany()
    const livePerf = performances.find(p => p.status === 'live')
    const scheduledPerf = performances.find(p => p.status === 'scheduled')

    if (!livePerf) {
        console.log('Creating LIVE performance...')
        await prisma.performance.create({
            data: {
                singerId: singer.id,
                title: 'Live Street Jam',
                locationText: 'Gangnam Station Exit 11',
                locationLat: 37.4979,
                locationLng: 127.0276,
                startTime: new Date(), // Now
                status: 'live',
                chatEnabled: true
            }
        })
    } else {
        console.log('Live performance already exists:', livePerf.title)
    }

    if (!scheduledPerf) {
        console.log('Creating SCHEDULED performance...')
        // One hour later
        const scheduledTime = new Date()
        scheduledTime.setHours(scheduledTime.getHours() + 2)

        await prisma.performance.create({
            data: {
                singerId: singer.id,
                title: 'Evening Acoustic Set',
                locationText: 'Yeouido Han River Park',
                locationLat: 37.5284,  // Yeouido
                locationLng: 126.9328,
                startTime: scheduledTime,
                status: 'scheduled',
                chatEnabled: true
            }
        })
    } else {
        console.log('Scheduled performance already exists:', scheduledPerf.title)
    }

    console.log('Test data setup complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
