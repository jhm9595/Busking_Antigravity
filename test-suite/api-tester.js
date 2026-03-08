/**
 * Busking Antigravity API 테스터 🚀
 * 
 * 이 스크립트는 플랫폼의 주요 REST 엔드포인트를 자동으로 점검합니다.
 * 백엔드 로직과 프론트엔드 흐름을 시뮬레이션하여 한 번에 테스트할 수 있도록 설계되었습니다.
 */

const API_BASE = 'http://localhost:3000/api';

async function runTests() {
    console.log('--- 🎸 Busking Antigravity API 테스트 시작 ---');

    try {
        const tests = [
            { name: '공개 공연 정보 조회', run: testPublicPerformances },
            { name: '가수 프로필 접근 권한', run: testSingerProfile },
            { name: '공연 목록 필터링 (라이브/전체)', run: testPerformanceFilters },
            { name: '신청곡 생성 프로세스', run: testSongRequestFlow }
        ];

        for (const test of tests) {
            console.log(`[시작] ${test.name}...`);
            await test.run();
            console.log(`[성공] ${test.name}`);
        }

        console.log('--- ✨ 모든 API 테스트가 성공적으로 완료되었습니다! ---');
    } catch (error) {
        console.error('--- ❌ 테스트 실패! ---');
        console.error(error.message);
        process.exit(1);
    }
}

async function testPublicPerformances() {
    const res = await fetch(`${API_BASE}/performances`);
    if (!res.ok) throw new Error('공개 공연 정보 조회에 실패했습니다.');
    const data = await res.json();
    console.log(`  - 현재 ${data.items?.length || 0}개의 활성 또는 예정된 공연이 있습니다.`);
}

async function testSingerProfile() {
    const res = await fetch(`${API_BASE}/performances`);
    const perfs = await res.json();
    const items = perfs.items || [];
    if (items.length > 0) {
        const singerId = items[0].singerId;
        const singerRes = await fetch(`${API_BASE}/singers/${singerId}`);
        if (!singerRes.ok) throw new Error(`가수 프로필 조회 실패 (ID: ${singerId})`);
        const data = await singerRes.json();
        console.log(`  - 가수 프로필 조회 완료: ${data.stageName}`);
    } else {
        console.log('  - 활성화된 공연이 없어 가수 프로필 테스트를 건너뜁니다.');
    }
}

async function testPerformanceFilters() {
    const filters = ['live', 'all'];
    for (const filter of filters) {
        const res = await fetch(`${API_BASE}/performances?filter=${filter}`);
        if (!res.ok) throw new Error(`필터 [${filter}] 조회에 실패했습니다.`);
        const data = await res.json();
        console.log(`  - 필터 [${filter}] 결과: ${data.items?.length || 0} 건`);
    }
}

async function testSongRequestFlow() {
    const res = await fetch(`${API_BASE}/performances`);
    const perfs = await res.json();
    const items = perfs.items || [];
    if (items.length === 0) {
        console.log('  - 활성화된 공연이 없어 신청곡 테스트를 건너뜁니다.');
        return;
    }

    const performanceId = items[0].id;
    console.log(`  - 공연 ID [${performanceId}]로 신청곡 테스트를 진행 중...`);

    const requestBody = {
        performanceId,
        title: '테스트용 노래 ' + Date.now(),
        artist: '테스트 가수',
        requesterName: '자동화 테스터'
    };

    const postRes = await fetch(`${API_BASE}/song-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!postRes.ok) throw new Error('POST /api/song-requests 요청이 실패했습니다.');
    console.log('  - 신청곡이 성공적으로 생성되었습니다.');
}

runTests();
