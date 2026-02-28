const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const singer = await prisma.singer.findFirst()
    if (!singer) return;

    // Create a performance starting in 5 minutes
    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() + 5)
    
    // Create an end time 10 minutes from now (so 5 min warning triggers immediately after opening)
    const endTime = new Date()
    endTime.setMinutes(endTime.getMinutes() + 10)

    console.log('Creating upcoming performance (Starts in 5 min, ends in 10 min)...')
    const perf = await prisma.performance.create({
        data: {
            singerId: singer.id,
            title: 'Chat Test Performance',
            locationText: 'Chat Test Location',
            startTime: startTime,
            endTime: endTime,
            status: 'scheduled',
            chatEnabled: true
        }
    })
    
    console.log('Created performance ID:', perf.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
