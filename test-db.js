const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const performances = await prisma.performance.findMany();
    console.log("ALL PERFORMANCES:");
    for (const p of performances) {
        console.log(`ID: ${p.id}, Status: ${p.status}, Title: ${p.title}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
