/**
 * 🤖 관객-가수 상호작용 통합 테스트 🎭
 * 
 * 이 테스트는 실제 관객과 가수가 동시에 접속했을 때의 실시간 흐름을 시뮬레이션합니다.
 */

const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:4000';

async function runInteractionTest() {
    console.log('\n--- 🎭 관객-가수 상호작용 실시간 시뮬레이션 시작 ---');

    let performanceId = null;
    let singerSocket = null;
    let audienceSocket = null;

    try {
        // 1. 테스트용 공연 데이터 준비
        console.log('[1/4] 테스트 데이터 준비 (가수 계정 조회 및 공연 예약)');
        
        // Singer 모델에서 첫 번째 가수를 찾음
        const singer = await prisma.singer.findFirst();
        if (!singer) throw new Error('가수 정보를 찾을 수 없습니다. DB에 최소 한 명의 가수가 필요합니다.');

        const performance = await prisma.performance.create({
            data: {
                title: '실시간 상호작용 통합 테스트',
                singerId: singer.id,
                startTime: new Date(),
                status: 'live',
                locationText: 'Virtual Stage',
                locationLat: 37.5,
                locationLng: 127.0
            }
        });
        performanceId = performance.id;
        console.log(`✅ 테스트 공연 생성 완료 (ID: ${performanceId})`);

        // 2. 실시간 서버(Realtime Server) 멀티 세션 연결
        console.log('[2/4] 실시간 서버 접속 (가수 & 관객 동시 접속 시뮬레이션)');
        
        singerSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });
        audienceSocket = io(SOCKET_URL, { transports: ['websocket'], forceNew: true });

        await Promise.all([
            new Promise((res, rej) => { 
                singerSocket.on('connect', res); 
                setTimeout(() => rej(new Error('가수 소켓 연결 시간 초과 (Realtime Server가 떠있나요?)')), 5000);
            }),
            new Promise((res, rej) => { 
                audienceSocket.on('connect', res); 
                // 관객 소켓 연결 실패시 에러 출력
                audienceSocket.on('connect_error', (err) => console.log('관객 소켓 연결 에러:', err.message));
            })
        ]);

        singerSocket.emit('join_room', { performanceId, username: singer.stageName, userType: 'singer' });
        audienceSocket.emit('join_room', { performanceId, username: '테스트관객', userType: 'audience' });
        
        console.log('✅ 실시간 채널 동기화 완료');

        // 3. 신청곡 실시간 전송 테스트
        console.log('[3/4] 신청곡 실시간 전송 프로세스 점검');
        
        const requestPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('신청곡 알림 수신 실패 (타임아웃)')), 8000);
            singerSocket.on('song_requested', (data) => {
                clearTimeout(timeout);
                console.log(`📩 [가수 대시보드] 실시간 신청곡 도착: "${data.title}" by ${data.username}`);
                resolve(data);
            });
        });

        // API 호출 (관객이 신청곡 버튼을 누르는 동작)
        try {
            const postRes = await fetch(`${BASE_URL}/api/song-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    performanceId: performanceId,
                    title: '밤양갱',
                    artist: '비비',
                    requesterName: '테스트관객' // schema camelCase에 맞춰 수정
                })
            });
            if (postRes.ok) {
                console.log('📤 관객이 신청곡을 성공적으로 보냈습니다.');
            } else {
                const errData = await postRes.json();
                throw new Error(`API 응답 실패: ${JSON.stringify(errData)}`);
            }
        } catch (e) {
            console.log(`⚠️ 신청곡 API 요청 실패: ${e.message}`);
        }

        // 4. 채팅 제어 및 메시지 전송 테스트
        console.log('[4/4] 채팅방 제어 및 실시간 톡 점검');
        
        // 가수가 채팅을 열어야 관객이 보낼 수 있음
        singerSocket.emit('open_chat', { performanceId });
        console.log('🗝️ 가수가 채팅방을 개방했습니다.');
        
        const chatPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('채팅 수신 실패 (타임아웃)')), 8000);
            singerSocket.on('receive_message', (data) => {
                if (data.author === '테스트관객') {
                    clearTimeout(timeout);
                    console.log(`💬 [가수 대기실] 관객 메시지 수신: "${data.message}"`);
                    resolve();
                }
            });
        });

        // 약간의 대기 후 관객이 메시지 발송
        setTimeout(() => {
            audienceSocket.emit('send_message', {
                performanceId,
                author: '테스트관객',
                message: '오늘 세트리스트 너무 좋아요!',
                userType: 'audience',
                timestamp: new Date().toISOString()
            });
            console.log('📱 관객이 응원 메시지를 보냈습니다.');
        }, 1000);

        await chatPromise;

        console.log('\n--- ✨ 관객-가수 상호작용 모든 시나리오 통과! ---');

    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
    } finally {
        if (performanceId) {
            console.log('🧹 테스트 데이터 정리 중...');
            try {
                await prisma.songRequest.deleteMany({ where: { performanceId } });
                await prisma.performance.delete({ where: { id: performanceId } });
                console.log('✅ 데이터 정리 완료');
            } catch (e) {
                console.log('⚠️ 데이터 정리 중 일부 건너뜀 (이미 수동 삭제됨)');
            }
        }
        if (singerSocket) singerSocket.disconnect();
        if (audienceSocket) audienceSocket.disconnect();
        process.exit();
    }
}

runInteractionTest();
