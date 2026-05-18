const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ephemeral Messages for active rooms only
const messagesByRoom = {
    'global-lobby': [],
    'private-peer': []
};

function loadMessages(room = 'global-lobby') {
    return messagesByRoom[room] || [];
}

function addMessage(room, sender, text) {
    if (!messagesByRoom[room]) {
        messagesByRoom[room] = [];
    }

    const message = {
        id: uuidv4(),
        sender: sender,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
    };
    messagesByRoom[room].push(message);
    return message;
}

function clearMessages(room) {
    if (messagesByRoom[room]) {
        messagesByRoom[room] = [];
    }
}

// Active Users Tracking
let activeUsers = {};

// REST API Routes
app.get('/api/messages/:room', (req, res) => {
    const { room } = req.params;
    const messages = loadMessages(room);
    res.json({ success: true, messages });
});

app.post('/api/messages/:room', (req, res) => {
    const { room } = req.params;
    const { sender, text } = req.body;

    if (!sender || !text) {
        return res.status(400).json({ success: false, error: 'Sender and text required' });
    }

    const message = addMessage(room, sender, text);
    io.to(room).emit('new_message', message);
    
    res.json({ success: true, message });
});

app.get('/api/users', (req, res) => {
    const users = Object.values(activeUsers);
    res.json({ success: true, users });
});

// Socket.IO Events
io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    // User joins
    socket.on('join', (data) => {
        const { username, room } = data;
        socket.join(room);

        activeUsers[socket.id] = {
            id: socket.id,
            username: username,
            room: room,
            joinedAt: new Date()
        };

        // Do not expose previous conversation history to new users
        socket.emit('load_messages', []);

        // Notify room that user joined
        io.to(room).emit('user_joined', {
            username: username,
            userCount: io.sockets.adapter.rooms.get(room)?.size || 0
        });

        console.log(`${username} joined room: ${room}`);
    });

    // Handle new message
    socket.on('send_message', (data) => {
        const { room, sender, text } = data;
        
        if (!room || !sender || !text) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
        }

        const message = addMessage(room, sender, text);
        io.to(room).emit('new_message', message);
    });

    // Switch room
    socket.on('switch_room', (data) => {
        const { oldRoom, newRoom, username } = data;
        
        socket.leave(oldRoom);
        socket.join(newRoom);

        if (activeUsers[socket.id]) {
            activeUsers[socket.id].room = newRoom;
        }

        // Clear messages for the room if no members remain
        if (!io.sockets.adapter.rooms.get(oldRoom)?.size) {
            clearMessages(oldRoom);
        }

        // Load messages for new room for current session
        const messages = loadMessages(newRoom);
        socket.emit('load_messages', messages);

        // Update user counts
        io.to(oldRoom).emit('user_left', {
            username: username,
            userCount: io.sockets.adapter.rooms.get(oldRoom)?.size || 0
        });

        io.to(newRoom).emit('user_joined', {
            username: username,
            userCount: io.sockets.adapter.rooms.get(newRoom)?.size || 0
        });
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { room, username } = data;
        socket.to(room).emit('user_typing', { username });
    });

    socket.on('stop_typing', (data) => {
        const { room, username } = data;
        socket.to(room).emit('user_stop_typing', { username });
    });

    // User disconnects
    socket.on('disconnect', () => {
        const user = activeUsers[socket.id];
        if (user) {
            const roomSize = io.sockets.adapter.rooms.get(user.room)?.size || 0;
            io.to(user.room).emit('user_left', {
                username: user.username,
                userCount: roomSize
            });

            if (!roomSize) {
                clearMessages(user.room);
            }

            delete activeUsers[socket.id];
        }
        console.log(`User disconnected: ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 AnonChat Server running on http://localhost:${PORT}`);
});
