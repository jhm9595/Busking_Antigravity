/**
 * DB & Prisma Sync Checker 🧩
 * 
 * This script checks if the database columns match the Prisma schema.
 * It's part of the pre-test health check.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSync() {
    console.log('--- 🛡️  Pre-Test Sync Check ---');
    try {
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'song_requests' 
            AND column_name = 'requester_name'
        `);

        if (columns.length === 0) {
            console.warn('⚠️  CRITICAL MISMATCH: Table "song_requests" is missing "requester_name" column.');
            console.warn('   The code expects this column, but the database is not updated.');
            console.warn('   Action Needed: Run "npx prisma db push" or apply migrations.');
            // Skip the test that relies on this, or proceed with dummy data
        } else {
            console.log('✅ DB Schema is in sync with Code (requester_name found).');
        }

        const junctionTable = await prisma.$queryRawUnsafe(`
            SELECT table_name FROM information_schema.tables WHERE table_name = 'performance_songs'
        `);
        if (junctionTable.length === 0) {
            console.warn('⚠️  CRITICAL MISMATCH: Table "performance_songs" (setlist logic) is missing!');
        } else {
            console.log('✅ Junction table "performance_songs" verified.');
        }

    } catch (e) {
        console.error('❌ Sync Check Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSync();
