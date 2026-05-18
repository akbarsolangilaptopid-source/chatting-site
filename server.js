const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// Data Storage Path
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize data files if they don't exist
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}));
}
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helper Functions
function loadMessages(room = 'global-lobby') {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    return data[room] || [];
}

function saveMessages(room, messages) {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    data[room] = messages;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
}

function addMessage(room, sender, text) {
    const messages = loadMessages(room);
    const message = {
        id: uuidv4(),
        sender: sender,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
    };
    messages.push(message);
    saveMessages(room, messages);
    return message;
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

        // Send previous messages to the new user
        const messages = loadMessages(room);
        socket.emit('load_messages', messages);

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

        // Load messages for new room
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
            io.to(user.room).emit('user_left', {
                username: user.username,
                userCount: io.sockets.adapter.rooms.get(user.room)?.size || 0
            });
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
