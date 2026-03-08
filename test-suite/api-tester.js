/**
 * Busking Antigravity API Tester 🚀
 * 
 * This script performs automated testing on all key REST endpoints of the Busking Antigravity platform.
 * It's designed to be a "one-click" testing solution that covers both backend API logic and simulated frontend flows.
 * 
 * It's expected to be run against a local development server (localhost:3000).
 */

const API_BASE = 'http://localhost:3000/api';

async function runTests() {
    console.log('--- Busking Antigravity API Test Suite ---');

    try {
        const tests = [
            { name: 'Fetch Public Performances', run: testPublicPerformances },
            { name: 'Singer Profile Access', run: testSingerProfile },
            { name: 'Performance List Filtering', run: testPerformanceFilters },
            { name: 'Song Request Lifecycle', run: testSongRequestFlow }
        ];

        for (const test of tests) {
            console.log(`[TEST] ${test.name}...`);
            await test.run();
            console.log(`[PASS] ${test.name}`);
        }

        console.log('--- All Tests Finished Successfully! ---');
    } catch (error) {
        console.error('--- Test Failed! ---');
        console.error(error.message);
        process.exit(1);
    }
}

async function testPublicPerformances() {
    const res = await fetch(`${API_BASE}/performances`);
    if (!res.ok) throw new Error('Failed to fetch public performances');
    const data = await res.json();
    console.log(`  - Found ${data.length} active or scheduled performances`);
}

async function testSingerProfile() {
    // Attempt to fetch a random singer ID to check if the route is valid
    const res = await fetch(`${API_BASE}/performances`);
    const perfs = await res.json();
    if (perfs.length > 0) {
        const singerId = perfs[0].singerId;
        const singerRes = await fetch(`${API_BASE}/singers/${singerId}`);
        if (!singerRes.ok) throw new Error(`Failed to fetch singer profile for ID: ${singerId}`);
        const data = await singerRes.json();
        console.log(`  - Successfully fetched singer profile: ${data.stageName}`);
    } else {
        console.log('  - No active performances found, skipping singer profile test');
    }
}

async function testPerformanceFilters() {
    const filters = ['live', 'all'];
    for (const filter of filters) {
        const res = await fetch(`${API_BASE}/performances?filter=${filter}`);
        if (!res.ok) throw new Error(`Filter [${filter}] failed`);
        const data = await res.json();
        console.log(`  - Filter [${filter}] returned ${data.length} results`);
    }
}

async function testSongRequestFlow() {
    const res = await fetch(`${API_BASE}/performances`);
    const perfs = await res.json();
    if (perfs.length === 0) {
        console.log('  - No active performances found, skipping song request flow test');
        return;
    }

    const performanceId = perfs[0].id;
    console.log(`  - Testing song request for performance: ${performanceId}`);

    const requestBody = {
        performanceId,
        title: 'Test Song ' + Date.now(),
        artist: 'Test Artist',
        requesterName: 'Automated Tester'
    };

    const postRes = await fetch(`${API_BASE}/song-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!postRes.ok) throw new Error('POST /api/song-requests failed');
    const data = await postRes.json();
    console.log('  - Successfully created song request');
}

runTests();
