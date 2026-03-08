/**
 * Busking Antigravity Full Lifecycle Simulator 🎭
 * 
 * This script simulates the entire journey:
 * 1. Singer Onboarding
 * 2. Performance Scheduling
 * 3. Performance Going Live
 * 4. Audience Interaction (Song Request)
 * 5. Performance Completion
 * 6. Verification of Status Updates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
    console.log('--- 🎭 System Lifecycle Simulation Started ---');
    const testId = 'sim_' + Math.random().toString(36).substring(7);

    try {
        // STEP 1: Create Singer
        console.log('[1/6] Creating Mock Singer...');
        await prisma.profile.create({
            data: { id: testId, email: `${testId}@test.com`, role: 'singer' }
        });
        await prisma.singer.create({
            data: { id: testId, stageName: 'Simulated Star', isVerified: true }
        });

        // STEP 2: Schedule Performance
        console.log('[2/6] Scheduling Performance...');
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 3600000); // +1 hour
        const performance = await prisma.performance.create({
            data: {
                singerId: testId,
                title: 'Grand Simulation Concert',
                locationText: 'Virtual Stage A',
                startTime,
                endTime,
                status: 'scheduled',
                chatEnabled: true,
                chatCostPerHour: 0
            }
        });

        // STEP 3: Go Live
        console.log('[3/6] Transitioning to LIVE...');
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'live' }
        });

        // STEP 4: Audience Song Request
        console.log('[4/6] Simulating Audience Song Request...');
        const songRequest = await prisma.songRequest.create({
            data: {
                performanceId: performance.id,
                title: 'Imagine',
                artist: 'John Lennon',
                requesterName: 'Fan_42',
                status: 'pending'
            }
        });

        // STEP 5: Verification
        console.log('[5/6] Verifying Data Consistency...');
        const livePerf = await prisma.performance.findUnique({
            where: { id: performance.id },
            include: { songRequests: true }
        });
        
        if (livePerf.status === 'live' && livePerf.songRequests.length > 0) {
            console.log('✅ Consistency Check Passed: Live status and Requests verified.');
        } else {
            throw new Error('Data inconsistency detected during simulation!');
        }

        // STEP 6: Complete Performance
        console.log('[6/6] Completing Performance & Cleanup...');
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'completed' }
        });

        console.log('--- ✨ Simulation Completed Successfully! ---');

    } catch (error) {
        console.error('❌ Simulation Error:', error);
    } finally {
        // Comprehensive Cleanup
        console.log('Cleaning up simulation data...');
        try {
            await prisma.songRequest.deleteMany({ where: { performance: { singerId: testId } } });
            await prisma.performance.deleteMany({ where: { singerId: testId } });
            await prisma.singer.delete({ where: { id: testId } });
            await prisma.profile.delete({ where: { id: testId } });
        } catch (cleanupError) {
            console.warn('Cleanup warning:', cleanupError.message);
        }
        await prisma.$disconnect();
    }
}

simulate();
