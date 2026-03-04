const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = "513ae0aa-2163-4a5b-8f97-aa43271bc60f";
    const performance = await prisma.performance.findUnique({
        where: { id },
        include: {
            performanceSongs: {
                include: { song: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!performance) {
        console.log("NOT FOUND!");
        return;
    }

    const now = new Date()
    const start = new Date(performance.startTime)
    const end = performance.endTime ? new Date(performance.endTime) : new Date(start.getTime() + 3 * 60 * 60 * 1000)

    let currentStatus = performance.status

    if (end < now && (currentStatus === 'live' || currentStatus === 'scheduled')) {
        currentStatus = 'completed';
    }

    const result = JSON.parse(JSON.stringify({
        ...performance,
        status: currentStatus,
        songs: (performance.performanceSongs || []).map(ps => ({
            ...ps.song,
            status: ps.status,
            order: ps.order
        }))
    }));

    console.log("SUCCESS!", result.id, result.status);
}

main().catch(console.error).finally(() => prisma.$disconnect());
