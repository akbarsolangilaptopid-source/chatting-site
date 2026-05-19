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
const peerListSection = document.getElementById('peer-list-section');
const peerList = document.getElementById('peer-list');
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
let currentPeer = null;
let pendingDirectMode = false;
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

socket.on('active_users', (users) => {
    const otherPeers = users.filter(user => user.username !== currentUser);
    renderPeerList(otherPeers);
    const globalCount = users.filter(user => user.room === 'global-lobby').length;
    updateUserCount('global-lobby', globalCount);
    updateUserCount('private-peer', otherPeers.length);
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
    messagesStream.innerHTML = '';

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

    if (currentRoomType === 'direct' && pendingDirectMode && !currentPeer) {
        appendSystemMessage('Please select a peer from the list before sending a private message.');
        return;
    }

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

        const selectedType = item.getAttribute('data-chat-type');
        const targetRoom = item.getAttribute('data-target');
        currentRoomType = selectedType;

        if (currentRoomType === 'group') {
            pendingDirectMode = false;
            currentPeer = null;
            peerListSection.classList.add('hidden');
            switchRoom(targetRoom, "# Global Lobby", "Open group channel for all concurrent users");
        } else {
            pendingDirectMode = true;
            activeChatTitle.textContent = "🔒 Direct Peer Chat";
            activeChatDesc.textContent = "Choose one user to start a private conversation";
            peerListSection.classList.remove('hidden');
            appendSystemMessage('Select a peer from the list to begin direct chat.');
        }

        hideTypingIndicator();
        isTyping = false;
    });
});

// Leave Chat
leaveBtn.addEventListener('click', () => {
    chatDashboard.classList.add('hidden');
    joinContainer.classList.remove('hidden');
    usernameInput.value = '';
    messagesStream.innerHTML = '';
    activeChatTitle.textContent = '# Global Lobby';
    activeChatDesc.textContent = 'Open group channel for all concurrent users';
    displayUsername.textContent = 'Anonymous';
    userAvatar.textContent = '?';
    currentRoomType = 'group';
    currentRoomTarget = 'global-lobby';
        currentPeer = null;
        pendingDirectMode = false;
        peerListSection.classList.add('hidden');
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
        document.body.classList.toggle('sidebar-open', sidebar.classList.contains('active'));
    });

    // Close sidebar when room is selected on mobile
    roomItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 480) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
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

function renderPeerList(users) {
    peerList.innerHTML = '';
    if (!users.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'peer-item empty';
        emptyState.textContent = 'No peers are online right now.';
        peerList.appendChild(emptyState);
        return;
    }

    users.forEach(user => {
        const peerItem = document.createElement('div');
        peerItem.className = 'peer-item';
        peerItem.textContent = user.username;
        peerItem.addEventListener('click', () => {
            startDirectChat(user.username);
        });
        peerList.appendChild(peerItem);
    });
}

function startDirectChat(peerName) {
    if (!currentUser || peerName === currentUser) return;

    const oldRoom = currentRoomTarget;
    const newRoom = createDirectRoomId(currentUser, peerName);
    currentPeer = peerName;
    pendingDirectMode = false;
    currentRoomTarget = newRoom;
    currentRoomType = 'direct';

    activeChatTitle.textContent = `🔒 Chat with ${peerName}`;
    activeChatDesc.textContent = 'Private one-on-one conversation';

    socket.emit('switch_room', {
        oldRoom: oldRoom,
        newRoom: currentRoomTarget,
        username: currentUser
    });

    appendSystemMessage(`Private chat started with ${peerName}.`);
}

function createDirectRoomId(userA, userB) {
    const normalizedA = userA.trim().toLowerCase().replace(/\s+/g, '_');
    const normalizedB = userB.trim().toLowerCase().replace(/\s+/g, '_');
    return `direct-${[normalizedA, normalizedB].sort().join('-')}`;
}

function switchRoom(room, title, desc) {
    const oldRoom = currentRoomTarget;
    if (room === oldRoom) return;

    currentRoomTarget = room;
    currentRoomType = 'group';
    peerListSection.classList.add('hidden');

    activeChatTitle.textContent = title;
    activeChatDesc.textContent = desc;

    socket.emit('switch_room', {
        oldRoom: oldRoom,
        newRoom: currentRoomTarget,
        username: currentUser
    });
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