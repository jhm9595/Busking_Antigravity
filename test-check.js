const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const performances = await prisma.performance.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(performances);
}
main().catch(console.error).finally(() => prisma.$disconnect());
