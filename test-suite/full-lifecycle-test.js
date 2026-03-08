/**
 * Busking Antigravity 서비스 생명주기 시뮬레이터 (한글판) 🎭
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
    console.log('--- 🎭 서비스 생명주기 하이라이트 시뮬레이션 시작 ---');
    const testId = 'sim_' + Math.random().toString(36).substring(7);

    try {
        // 1단계: 가수 등록 및 레퍼토리 생성
        console.log('[1/7] 가상 가수 및 기본 레퍼토리 생성 중...');
        await prisma.profile.create({
            data: { id: testId, email: `${testId}@test.com`, role: 'singer', nickname: '시뮬스타' }
        });
        await prisma.singer.create({
            data: { id: testId, stageName: '시뮬레이션 스타', isVerified: true }
        });
        const repSong = await prisma.song.create({
            data: { singerId: testId, title: '시그니처 히트곡', artist: '시뮬스타', isRepertoire: true }
        });

        // 2단계: 세트리스트를 포함한 공연 예약
        console.log('[2/7] 세트리스트 포함 공연 예약 시뮬레이션...');
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 3600000);
        const performance = await prisma.performance.create({
            data: {
                singerId: testId,
                title: '최신 로직 테스트 콘서트',
                locationText: '디지털 아레나',
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

        // 3단계: 라이브 시작
        console.log('[3/7] 라이브 모드 전환 중...');
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'live' }
        });

        // 4단계: 관객 신청곡 접수
        console.log('[4/7] 관객 신청곡 접수 시뮬레이션...');
        const songRequest = await prisma.songRequest.create({
            data: {
                performanceId: performance.id,
                title: '이매진(Imagine)',
                artist: '존 레논',
                // 주의: requester_name 컬럼 부재 시 에러 발생 가능
                status: 'pending'
            }
        });

        // 5단계: 신청곡 수락 및 세트리스트 추가
        console.log('[5/7] 신청곡 수락 및 세트리스트 자동 추가 테스트...');
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

        // 6단계: 곡 상태 토글
        console.log('[6/7] 라이브 대시보드 곡 완료(Toggle) 테스트...');
        await prisma.performanceSong.updateMany({
            where: { performanceId: performance.id, songId: repSong.id },
            data: { status: 'completed' }
        });

        // 7단계: 최종 정합성 확인 및 정리
        console.log('[7/7] 최종 데이터 정합성 확인...');
        const finalPerf = await prisma.performance.findUnique({
            where: { id: performance.id },
            include: { performanceSongs: true, songRequests: true }
        });
        
        if (finalPerf.performanceSongs.length === 2 && finalPerf.songRequests[0].status === 'accepted') {
            const completedSong = finalPerf.performanceSongs.find(ps => ps.songId === repSong.id);
            if (completedSong.status === 'completed') {
                console.log('✅ 데이터 정합성 통과: 세트리스트, 신청곡, 상태 토글 모두 정상 확인.');
            } else {
                throw new Error('곡 상태 변경 확인 실패!');
            }
        } else {
            throw new Error('데이터 정합성 이상 발견!');
        }

        // 공연 종료
        await prisma.performance.update({
            where: { id: performance.id },
            data: { status: 'completed' }
        });

        console.log('--- ✨ 모든 시뮬레이션 단계 성공! ---');

    } catch (error) {
        console.error('❌ 시뮬레이션 에러:', error.message);
    } finally {
        console.log('테스트 데이터 정리 중...');
        try {
            const perfSongs = await prisma.performanceSong.findMany({ where: { performance: { singerId: testId } } });
            const songIds = perfSongs.map(ps => ps.songId);
            
            await prisma.performanceSong.deleteMany({ where: { performance: { singerId: testId } } });
            await prisma.songRequest.deleteMany({ where: { performance: { singerId: testId } } });
            await prisma.performance.deleteMany({ where: { singerId: testId } });
            await prisma.song.deleteMany({ where: { id: { in: songIds } } });
            await prisma.singer.delete({ where: { id: testId } });
            await prisma.profile.delete({ where: { id: testId } });
        } catch (cleanupError) {
            console.warn('정리 경고:', cleanupError.message);
        }
        await prisma.$disconnect();
    }
}

simulate();
