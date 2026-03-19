const { io } = require('socket.io-client');

const SERVER_URL = 'https://busking-chat-server-678912953258.us-central1.run.app';
const PERFORMANCE_ID = 'test_max_capacity_room_' + Date.now();
const CAPACITY = 50; 
const TOTAL_CLIENTS = 52; 

async function runTest() {
    let connectedCount = 0;
    let rejectedCount = 0;
    const clients = [];
    let testCompleted = false;

    console.log(`시작: 라이브 채팅 서버(${SERVER_URL}) 접속 테스트...`);

    // Connect all clients concurrently to speed up and avoid blocking
    const promises = [];
    for (let i = 1; i <= TOTAL_CLIENTS; i++) {
        promises.push(new Promise((resolve) => {
            const socket = io(SERVER_URL, {
                reconnection: false,
                transports: ['polling', 'websocket']
            });
            clients.push(socket);

            socket.on('connect', () => {
                // If it connects, immediately emit join_room
                socket.emit('join_room', { 
                    performanceId: PERFORMANCE_ID, 
                    username: `Audience_${i}`, 
                    userType: 'audience',
                    capacity: CAPACITY 
                });
            });

            socket.on('connect_error', (err) => {
                if (!testCompleted) console.log(`[오류] 관객 ${i}번 접속 실패: ${err.message}`);
                resolve();
            });

            socket.on('join_error', (data) => {
                if (!testCompleted) console.log(`[초과 차단됨] 관객 ${i}번: ${data.message}`);
                rejectedCount++;
                resolve();
            });

            socket.on('chat_status', (data) => {
                if (!testCompleted) {
                    connectedCount++;
                    if (connectedCount % 10 === 0 || connectedCount >= CAPACITY) {
                        console.log(`[정상 접속] 관객 ${i}번 접속 완료. (현재 인원: ${connectedCount}명)`);
                    }
                }
                resolve();
            });
            
            // Timeout explicitly
            setTimeout(() => {
                if (!testCompleted && i === 1) console.log(`[타임아웃] 관객 ${i}번 타임아웃 발생.`);
                resolve();
            }, 10000);
        }));
    }

    await Promise.all(promises);
    testCompleted = true;

    console.log(`\n--- 테스트 결과 요약 ---`);
    console.log(`총 방 입장 성공 인원: ${connectedCount}명`);
    console.log(`총 방 입장 차단 인원: ${rejectedCount}명`);
    
    if (connectedCount === CAPACITY && rejectedCount === (TOTAL_CLIENTS - CAPACITY)) {
        console.log(`✅ 성공: 채팅방 최대 인원수(${CAPACITY}명) 방어 로직이 정상 동작합니다!`);
    } else {
        console.log(`❌ 실패: 최대 인원 제한이 예상대로 동작하지 않았습니다.`);
    }

    for (const socket of clients) {
        socket.disconnect();
    }
    process.exit(0);
}

runTest();
