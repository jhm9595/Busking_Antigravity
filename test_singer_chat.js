const io = require('socket.io-client');

const socket = io('http://localhost:4000');
const PERFORMANCE_ID = '2a5863e3-8b83-4d2e-8c03-d422499d45fa';

console.log('Singer Logic: Connecting...');

socket.on('connect', () => {
    console.log('Singer Logic: Connected to chat server');

    // Join as Singer
    socket.emit('join_room', {
        performanceId: PERFORMANCE_ID,
        username: 'SingerBot',
        userType: 'singer'
    });

    // Send a welcome message after a delay
    setTimeout(() => {
        console.log('Singer Logic: Sending welcome message...');
        socket.emit('send_message', {
            performanceId: PERFORMANCE_ID,
            author: 'SingerBot',
            message: 'Hello Audience! Welcome to the browser test!',
            timestamp: new Date().toLocaleTimeString(),
            type: 'singer'
        });
    }, 3000);
});

socket.on('receive_message', (data) => {
    console.log(`Singer Logic: Received message from ${data.author}: ${data.message}`);
    if (data.type === 'audience' && data.message.includes('Hello')) {
        setTimeout(() => {
            socket.emit('send_message', {
                performanceId: PERFORMANCE_ID,
                author: 'SingerBot',
                message: `Thanks for the hello, ${data.author}!`,
                timestamp: new Date().toLocaleTimeString(),
                type: 'singer'
            });
        }, 1000);
    }
});
