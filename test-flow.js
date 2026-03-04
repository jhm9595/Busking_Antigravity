const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Create a fake singer profile
    const testSingerId = "test_singer_" + Math.random().toString(36).substring(7);
    try {
        await prisma.profile.create({
            data: {
                id: testSingerId,
                email: "test@example.com",
                role: "singer"
            }
        });
        await prisma.singer.create({
            data: {
                id: testSingerId,
                stageName: "Test Singer",
                isVerified: true
            }
        });
        console.log("Created singer:", testSingerId);

        // 2. Create a scheduled performance 
        const now = new Date();
        // start time is now, end time is 1 hour from now
        const startTime = new Date(now.getTime());
        const endTime = new Date(now.getTime() + 60 * 60 * 1000);

        const perf = await prisma.performance.create({
            data: {
                singerId: testSingerId,
                title: "Test Performance Flow",
                locationText: "Test Location",
                locationLat: 37.5,
                locationLng: 127.0,
                startTime: startTime,
                endTime: endTime,
                status: "scheduled",
                chatEnabled: true,
                chatCostPerHour: 0
            }
        });
        console.log("Created scheduled performance. ID:", perf.id);

        // 3. User clicks "Start Performance Mode" -> this calls updatePerformanceStatus
        await prisma.performance.update({
            where: { id: perf.id },
            data: { status: "live" }
        });
        console.log("Updated to live.");

        // 4. Client navigates to /singer/live?performanceId=perf.id and calls getPerformanceById
        const fetched = await prisma.performance.findUnique({
            where: { id: perf.id },
            include: { performanceSongs: { include: { song: true } } }
        });
        
        if (!fetched) {
            console.log("ERROR! getPerformanceById returned null for id", perf.id);
        } else {
            console.log("SUCCESS! getPerformanceById returned", fetched.title, "Status:", fetched.status);
        }

    } catch (e) {
        console.error(e);
    } finally {
        // Cleanup if possible or just disconnect
        try {
            await prisma.performance.deleteMany({ where: { singerId: testSingerId }});
            await prisma.singer.delete({ where: { id: testSingerId }});
            await prisma.profile.delete({ where: { id: testSingerId }});
        } catch (e) {}
        await prisma.$disconnect();
    }
}
main();
