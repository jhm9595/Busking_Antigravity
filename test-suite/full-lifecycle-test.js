/**
 * Busking Antigravity Full Lifecycle Simulator 🎭
 * 
 * Updated to match the latest Setlist & Song Request logic.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
    console.log('--- 🎭 System Lifecycle Simulation Started ---');
    const testId = 'sim_' + Math.random().toString(36).substring(7);

    try {
        // STEP 1: Create Singer & Repertoire
        console.log('[1/7] Creating Mock Singer & Repertoire...');
        await prisma.profile.create({
            data: { id: testId, email: `${testId}@test.com`, role: 'singer', nickname: 'SimStar' }
        });
        await prisma.singer.create({
            data: { id: testId, stageName: 'Simulated Star', isVerified: true }
        });
        const repSong = await prisma.song.create({
            data: { singerId: testId, title: 'My Signature Hit', artist: 'SimStar', isRepertoire: true }
        });

        // STEP 2: Schedule Performance with Setlist
        console.log('[2/7] Scheduling Performance with Setlist...');
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 3600000);
        const performance = await prisma.performance.create({
            data: {
                singerId: testId,
                title: 'New Logic Concert',
                locationText: 'Digital Arena',
                startTime,
                endTime,
                status: 'scheduled',
                chatEnabled: true,
                chatCostPerHour: 0,
                performanceSongs: {
                    create: [{ songId: repSong.id, order: 0 }]
                }
            }
        });

        // STEP 3: Go Live
        console.log('[3/7] Transitioning to LIVE...');
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'live' }
        });

        // STEP 4: Audience Song Request
        console.log('[4/7] Simulating Audience Song Request...');
        const songRequest = await prisma.songRequest.create({
            data: {
                performanceId: performance.id,
                title: 'Imagine',
                artist: 'John Lennon',
                requesterName: 'Fan_42',
                status: 'pending'
            }
        });

        // STEP 5: Accept Request (Logic from services/singer.ts)
        console.log('[5/7] Simulating Request Acceptance...');
        const newSong = await prisma.song.create({
            data: {
                singerId: testId,
                title: songRequest.title,
                artist: songRequest.artist,
                isRepertoire: false,
                tags: '["requested"]'
            }
        });
        await prisma.performanceSong.create({
            data: {
                performanceId: performance.id,
                songId: newSong.id,
                order: 1
            }
        });
        await prisma.songRequest.update({
            where: { id: songRequest.id },
            data: { status: 'accepted' }
        });

        // STEP 6: Toggle Song Status (Live Dashboard feature)
        console.log('[6/7] Toggling Setlist Song Status (Live Dashboard)...');
        await prisma.performanceSong.updateMany({
            where: { performanceId: performance.id, songId: repSong.id },
            data: { status: 'completed' }
        });

        // STEP 7: Verification & Cleanup
        console.log('[7/7] Verifying Final State...');
        const finalPerf = await prisma.performance.findUnique({
            where: { id: performance.id },
            include: { performanceSongs: true, songRequests: true }
        });
        
        if (finalPerf.performanceSongs.length === 2 && finalPerf.songRequests[0].status === 'accepted') {
            const completedSong = finalPerf.performanceSongs.find(ps => ps.songId === repSong.id);
            if (completedSong.status === 'completed') {
                console.log('✅ Consistency Check Passed: Setlist, Requests, and Status Toggles verified.');
            } else {
                throw new Error('Song status toggle failed verification!');
            }
        } else {
            throw new Error('Data inconsistency detected!');
        }

        // Complete Performance
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'completed' }
        });

        console.log('--- ✨ Simulation Completed Successfully! ---');

    } catch (error) {
        console.error('❌ Simulation Error:', error);
    } finally {
        console.log('Cleaning up simulation data...');
        try {
            const perfSongs = await prisma.performanceSong.findMany({ where: { performance: { singerId: testId } } });
            const songIds = perfSongs.map(ps => ps.songId);
            
            await prisma.performanceSong.deleteMany({ where: { performance: { singerId: testId } } });
            await prisma.songRequest.deleteMany({ where: { performance: { singerId: testId } } });
            await prisma.performance.deleteMany({ where: { singerId: testId } });
            await prisma.song.deleteMany({ where: { id: { in: [repSong?.id, ...songIds].filter(Boolean) } } });
            await prisma.singer.delete({ where: { id: testId } });
            await prisma.profile.delete({ where: { id: testId } });
        } catch (cleanupError) {
            console.warn('Cleanup warning:', cleanupError.message);
        }
        await prisma.$disconnect();
    }
}

simulate();
