const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Allow CORS for development access from localhost:3000
const io = new Server(server, {
    cors: {
        origin: "*", // Secure this in production!
        methods: ["GET", "POST"]
    }
});

// In-memory storage for simple history (reset on server restart)
const roomMessages = {}; // { performanceId: [messages] }

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join a specific performance room
    socket.on('join_room', (data) => {
        // data: { performanceId, username, userType }
        const { performanceId, username } = data;
        socket.join(performanceId);
        console.log(`User ${username} joined room: ${performanceId}`);

        // Send existing history to the user who just joined
        if (roomMessages[performanceId]) {
            socket.emit('load_history', roomMessages[performanceId]);
        } else {
            socket.emit('load_history', []);
        }
    });

    // Send Message
    socket.on('send_message', (data) => {
        // data: { performanceId, author, message, timestamp, type (singer/audience) }
        const { performanceId } = data;

        // Save to memory
        if (!roomMessages[performanceId]) {
            roomMessages[performanceId] = [];
        }
        roomMessages[performanceId].push(data);

        // Limit history per room (optional, prevents memory overflow)
        if (roomMessages[performanceId].length > 100) {
            roomMessages[performanceId].shift();
        }

        // Broadcast to everyone in the room INCLUDING sender (simplifies frontend state)
        io.in(performanceId).emit('receive_message', data);
    });

    // Song Request Notification
    socket.on('song_requested', (data) => {
        const { performanceId, title } = data;
        // Broadcast to everyone (or just the singer if we had targeted emit, but broadcast is fine for "System Message" feeling)
        io.in(performanceId).emit('song_requested', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Chat Server running on port ${PORT}`);
});
