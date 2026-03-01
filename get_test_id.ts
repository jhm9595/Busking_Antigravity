import { prisma } from './src/lib/prisma';

async function main() {
    const performance = await prisma.performance.findFirst({
        select: { id: true, singerId: true }
    });
    console.log('TEST_DATA:', JSON.stringify(performance));
}

main().catch(console.error).finally(() => prisma.$disconnect());
