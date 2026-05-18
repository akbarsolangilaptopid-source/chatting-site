# AnonChat - Responsive Anonymous Chat Application

A modern, fully responsive real-time chat application built with **Node.js**, **Express**, **Socket.IO**, and vanilla JavaScript. Features real-time messaging across devices and screen sizes.

## Features

✨ **Real-Time Chat** - Instant message delivery using WebSocket technology
📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
🎨 **Modern UI** - Dark theme with neon accent colors
🚀 **Scalable Backend** - Node.js server with persistent data storage
🔄 **Multi-Room Support** - Global Lobby and Direct messaging
⌨️ **Typing Indicators** - See when others are typing
👥 **Active User Count** - Real-time user presence tracking
📤 **Message History** - Persistent message storage

## Project Structure

```
chatting site/
├── index.html           # Main HTML file (responsive)
├── style.css           # CSS with responsive design (mobile-first)
├── script.js           # Frontend JavaScript (Socket.IO client)
├── server.js           # Node.js/Express backend (WebSocket server)
├── package.json        # Node.js dependencies
├── data/               # Message storage (auto-created)
│   ├── messages.json   # Persisted messages by room
│   └── users.json      # User tracking
└── README.md           # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Setup Instructions

1. **Navigate to project directory**
```bash
cd "path/to/chatting site"
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

The server will run on `http://localhost:3000`

4. **Open in browser**
- Primary window: `http://localhost:3000`
- Secondary window (same host): `http://localhost:3000`
- Mobile device: `http://<your-computer-ip>:3000`

## Responsive Design Breakpoints

| Device Type | Breakpoint | Features |
|-------------|-----------|----------|
| Desktop | 1200px+ | Full sidebar (300px), standard layout |
| Tablet | 769px - 1199px | Adjusted sidebar (250px), compact messaging |
| Mobile | 480px - 768px | Horizontal sidebar, optimized buttons |
| Small Phone | < 480px | Minimized UI, touch-friendly controls |

## Development

### Watch Mode (Auto-reload)
```bash
npm run dev
```

### API Endpoints

#### REST Endpoints
- `GET /api/messages/:room` - Get all messages in a room
- `POST /api/messages/:room` - Send a message
- `GET /api/users` - Get active users list

### WebSocket Events

**Client → Server**
- `join` - Join a chat room
- `send_message` - Send a message
- `switch_room` - Switch between chat rooms
- `typing` - Notify typing status
- `stop_typing` - Stop typing notification

**Server → Client**
- `load_messages` - Load previous messages
- `new_message` - Receive new message
- `user_joined` - User joined notification
- `user_left` - User disconnected notification
- `user_typing` - Typing indicator received
- `user_stop_typing` - Typing stopped

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Mobile Safari (iOS) | ✅ Full |
| Chrome Mobile | ✅ Full |
| Firefox Mobile | ✅ Full |

## Configuration

### Server Port
Edit `server.js` to change the default port:
```javascript
const PORT = process.env.PORT || 3000;
```

### Data Persistence
Messages are stored in `data/messages.json` by default. Change the path in `server.js`:
```javascript
const DATA_DIR = path.join(__dirname, 'data');
```

## Security Features

- **XSS Prevention** - HTML escaping on all messages
- **Input Validation** - Server-side validation for all messages
- **Connection Handling** - Proper socket cleanup on disconnect
- **Error Handling** - Comprehensive error logging and handling

## Mobile Optimization

- **Touch-Friendly** - Large tap targets (min 44x44px)
- **Viewport Meta** - Proper scaling and zoom control
- **Responsive Images** - SVG icons (no image bloat)
- **Performance** - Minimized CSS/JS, no external libraries except Socket.IO
- **Virtual Keyboard** - Proper input handling on mobile

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

### Connection Issues
- Ensure Node.js is running: `npm start`
- Check firewall settings
- Verify port 3000 is accessible
- On mobile, use `http://<computer-ip>:3000` (not localhost)

### Messages Not Persisting
- Verify `data/` directory exists
- Check file permissions for `data/messages.json`
- Restart the server

### Mobile Responsiveness Issues
- Clear browser cache (Ctrl+Shift+Del)
- Test in incognito/private mode
- Check device orientation (portrait/landscape)

## Performance Tips

1. **Use the app** in a modern browser
2. **Limit** concurrent users for better performance
3. **Clear messages** periodically by removing `data/messages.json`
4. **Enable compression** for production deployment

## Deployment

### Deploy to Heroku
```bash
# Install Heroku CLI
# Then:
git init
heroku create <your-app-name>
git push heroku main
```

### Deploy to Firebase
```bash
npm install -g firebase-tools
firebase init
firebase deploy
```

## Future Enhancements

- 🔐 User authentication & accounts
- 💬 Direct messaging between specific users
- 📎 File/image sharing
- 🎤 Voice/video chat
- 🔔 Push notifications
- 📊 Message search & history
- 🌙 Light/dark theme toggle
- 🌍 Multiple language support

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the code comments
3. Check browser console for errors

---

**Happy Chatting!** 🚀
