const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const singerId = 'user_2r9qTjF2r8V0S8l0N9Kj6d'; // Need correct singerId.
    const all = await prisma.performance.findMany({
        where: { id: "48dacc5a-9a28-4945-97a6-221d37517e5d" }
    });
    console.log(all[0]);
}
main().catch(console.error).finally(() => prisma.$disconnect());
