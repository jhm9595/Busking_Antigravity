/**
 * Busking Antigravity Chat Tester 💬
 * 
 * Verifies the Socket.IO connection and basic event handling for the live performance chat.
 */

const { io } = require('socket.io-client');

const CHAT_URL = 'http://localhost:4000'; // Default chat server port

async function startChatTest() {
    console.log('--- Busking Antigravity Chat Test Suite ---');
    
    // Testing specific performance channel
    const testPerformanceId = 'test_perf_' + Math.random().toString(36).substring(7);
    const socket = io(CHAT_URL);

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error('Connection timed out. Is the chat-server running on :4000?'));
        }, 5000);

        socket.on('connect', () => {
            console.log('  - Connected to Chat Server!');
            
            // 1. Join a test room
            socket.emit('join_room', { 
                performanceId: testPerformanceId, 
                username: 'AutomatedTester',
                userType: 'audience' 
            });
            console.log(`  - Emitted join_room for: ${testPerformanceId}`);
        });

        socket.on('join_room_success', (data) => {
            console.log(`  - Successfully joined room. Current capacity: ${data.viewingCount}/${data.capacity}`);
            
            // 2. Test sending a message
            socket.emit('send_message', {
                performanceId: testPerformanceId,
                username: 'AutomatedTester',
                text: 'System health check: Connection stable 🎸'
            });
        });

        socket.on('new_message', (msg) => {
            if (msg.username === 'AutomatedTester') {
                console.log('  - Message echo received: ' + msg.text);
                clearTimeout(timeout);
                socket.disconnect();
                console.log('✅ Chat Test Success!');
                resolve();
            }
        });

        socket.on('connect_error', (error) => {
            socket.disconnect();
            reject(new Error('Connection error: ' + error.message));
        });
    });
}

startChatTest().catch(err => {
    console.error('❌ Chat Test Failed: ' + err.message);
    process.exit(1);
});
