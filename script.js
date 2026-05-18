// --- Socket.IO Connection ---
const socket = io();

// --- DOM Element Selectors ---
const joinContainer = document.getElementById('join-container');
const chatDashboard = document.getElementById('chat-dashboard');
const joinForm = document.getElementById('join-form');
const messageForm = document.getElementById('message-form');
const usernameInput = document.getElementById('username-input');
const messageInput = document.getElementById('message-input');
const messagesStream = document.getElementById('messages-stream');
const displayUsername = document.getElementById('display-username');
const userAvatar = document.getElementById('user-avatar');
const leaveBtn = document.getElementById('leave-btn');
const roomItems = document.querySelectorAll('.room-item');
const activeChatTitle = document.getElementById('active-chat-title');
const activeChatDesc = document.getElementById('active-chat-desc');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const connectionStatus = document.getElementById('connection-status');
const typingIndicator = document.getElementById('typing-indicator');
const typingUser = document.getElementById('typing-user');
const menuLabel = document.querySelector('.menu-label');

// --- Global State ---
let currentUser = "";
let currentRoomType = "group";
let currentRoomTarget = "global-lobby";
let typingTimeout;
let isTyping = false;

// --- Socket Connection Events ---
socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});

// --- Message Events ---
socket.on('load_messages', (messages) => {
    messagesStream.innerHTML = '';
    messages.forEach(msg => {
        const layoutType = (msg.sender === currentUser) ? 'outgoing' : 'incoming';
        appendMessageElement(msg.sender, msg.text, msg.timestamp, layoutType);
    });
});

socket.on('new_message', (message) => {
    const layoutType = (message.sender === currentUser) ? 'outgoing' : 'incoming';
    appendMessageElement(message.sender, message.text, message.timestamp, layoutType);
});

socket.on('user_joined', (data) => {
    appendSystemMessage(`${data.username} joined the chat`);
    updateUserCount(currentRoomTarget, data.userCount);
});

socket.on('user_left', (data) => {
    appendSystemMessage(`${data.username} left the chat`);
    updateUserCount(currentRoomTarget, data.userCount);
});

socket.on('user_typing', (data) => {
    if (data.username !== currentUser) {
        showTypingIndicator(data.username);
    }
});

socket.on('user_stop_typing', (data) => {
    hideTypingIndicator();
});

// --- Connection Status ---
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = '✓ Connected';
        connectionStatus.classList.add('connected');
    } else {
        connectionStatus.textContent = '✗ Disconnected';
        connectionStatus.classList.remove('connected');
    }
}

// --- Event Listeners ---

// Join Dashboard
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = usernameInput.value.trim();
    if (!nickname) return;

    currentUser = nickname;
    displayUsername.textContent = currentUser;
    userAvatar.textContent = currentUser.charAt(0).toUpperCase();

    joinContainer.classList.add('hidden');
    chatDashboard.classList.remove('hidden');

    // Join the default room
    socket.emit('join', { username: currentUser, room: currentRoomTarget });
    appendSystemMessage(`Welcome to ${currentRoomTarget === 'global-lobby' ? 'Global Lobby' : 'Private Peer Chat'}`);
});

// Send Message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    socket.emit('send_message', {
        room: currentRoomTarget,
        sender: currentUser,
        text: messageText
    });

    messageInput.value = '';
    hideTypingIndicator();
    isTyping = false;
});

// Room Switching
roomItems.forEach(item => {
    item.addEventListener('click', () => {
        roomItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const oldRoom = currentRoomTarget;
        currentRoomType = item.getAttribute('data-chat-type');
        currentRoomTarget = item.getAttribute('data-target');

        if (currentRoomType === 'group') {
            activeChatTitle.textContent = "# Global Lobby";
            activeChatDesc.textContent = "Open group channel for all concurrent users";
        } else {
            activeChatTitle.textContent = "🔒 Direct Peer Chat";
            activeChatDesc.textContent = "1-on-1 private conversation";
        }

        // Switch room
        socket.emit('switch_room', {
            oldRoom: oldRoom,
            newRoom: currentRoomTarget,
            username: currentUser
        });

        hideTypingIndicator();
        isTyping = false;
    });
});

// Leave Chat
leaveBtn.addEventListener('click', () => {
    chatDashboard.classList.add('hidden');
    joinContainer.classList.remove('hidden');
    usernameInput.value = '';
    socket.disconnect();
    setTimeout(() => {
        socket.connect();
        updateConnectionStatus(true);
    }, 1000);
});

// Typing Indicator
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', {
            room: currentRoomTarget,
            username: currentUser
        });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('stop_typing', {
            room: currentRoomTarget,
            username: currentUser
        });
    }, 3000);
});

// Mobile Menu Toggle
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when room is selected on mobile
    roomItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 480) {
                sidebar.classList.remove('active');
            }
        });
    });
}

// --- UI Functions ---

function appendMessageElement(sender, text, time, type) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    msgDiv.innerHTML = `
        <div class="message-meta">${sender} • ${time}</div>
        <div class="message-bubble">${escapeHtml(text)}</div>
    `;
    messagesStream.appendChild(msgDiv);
    messagesStream.scrollTop = messagesStream.scrollHeight;
}

function appendSystemMessage(text) {
    const sysDiv = document.createElement('div');
    sysDiv.classList.add('system-message');
    sysDiv.textContent = text;
    messagesStream.appendChild(sysDiv);
    messagesStream.scrollTop = messagesStream.scrollHeight;
}

function updateUserCount(room, count) {
    const countElement = document.getElementById(`${room}-count`);
    if (countElement) {
        countElement.textContent = count;
    }
}

function showTypingIndicator(username) {
    typingUser.textContent = username;
    typingIndicator.classList.remove('hidden');
}

function hideTypingIndicator() {
    typingIndicator.classList.add('hidden');
}

// Security: Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}