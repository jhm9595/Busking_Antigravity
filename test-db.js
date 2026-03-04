const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const performances = await prisma.performance.findMany();
    console.log("ALL PERFORMANCES:");
    for (const p of performances) {
        if (p.status === 'scheduled' || p.status === 'live') {
            console.log(`ID: ${p.id}, Status: ${p.status}, Title: ${p.title}, start: ${p.startTime}, end: ${p.endTime}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
