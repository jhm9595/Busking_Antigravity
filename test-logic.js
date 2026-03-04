const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const performances = await prisma.performance.findMany({
        where: { singerId: 'user_2r9qTjF2r8V0S8l0N9Kj6d' }, // Replace with a real one
        include: { performanceSongs: { include: { song: true } } }
    });
    console.log("Found performances:", performances.length);

    if(performances.length > 0) {
        const p = performances[0];
        console.log("ID is:", p.id);
        
        const single = await prisma.performance.findUnique({ where: { id: p.id } });
        console.log("Single fetch result:", single ? "Success" : "NULL");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
