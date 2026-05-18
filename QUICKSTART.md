# 🚀 Quick Start Guide for AnonChat

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Start the Server
```bash
npm start
```

You should see:
```
🚀 AnonChat Server running on http://localhost:3000
```

## Step 3: Open in Browser
- **Main window**: Open `http://localhost:3000`
- **Test locally**: Open another tab/window to test real-time messaging
- **Test on mobile**: Open `http://<your-computer-ip>:3000` on your phone

## 📱 Responsive Breakpoints

✅ **Desktop** (1200px+) - Full interface
✅ **Tablet** (480-1200px) - Compact interface  
✅ **Mobile** (< 480px) - Optimized mobile layout

## 🎯 Key Features Implemented

### Backend (server.js)
- ✅ Express server on port 3000
- ✅ Socket.IO for real-time WebSocket communication
- ✅ Persistent message storage (JSON files)
- ✅ Multi-room support (global-lobby, private-peer)
- ✅ User tracking and presence indicators
- ✅ Typing indicators
- ✅ REST API endpoints
- ✅ Error handling and logging

### Frontend (index.html + script.js)
- ✅ Socket.IO client integration
- ✅ Real-time message synchronization
- ✅ User join/leave notifications
- ✅ Typing indicator animations
- ✅ Connection status indicator
- ✅ XSS protection (HTML escaping)
- ✅ Responsive design with all screen sizes

### Responsive Design (style.css)
- ✅ Mobile-first approach
- ✅ Tablets (768px breakpoint)
- ✅ Phones (480px breakpoint)
- ✅ Small phones (360px breakpoint)
- ✅ Touch-friendly buttons
- ✅ Optimized sidebar for mobile
- ✅ Flexible message bubbles
- ✅ Auto-hiding mobile menu

## 🧪 Testing

### Test 1: Single User
1. Open browser at `http://localhost:3000`
2. Enter a username
3. You should see the dashboard

### Test 2: Real-Time Messaging (Desktop)
1. Open two browser windows side-by-side
2. Join with different usernames
3. Send messages - both should receive instantly

### Test 3: Mobile Responsiveness
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test at different screen sizes (iPhone, iPad, etc.)

### Test 4: Multi-Device
1. Get your computer IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On phone/tablet, visit `http://<your-ip>:3000`
3. Chat across devices in real-time

## 📝 File Structure

```
├── server.js             # Node.js backend (WebSocket server)
├── package.json          # Dependencies & scripts
├── index.html            # Responsive HTML
├── style.css             # Responsive CSS (mobile-first)
├── script.js             # Frontend (Socket.IO client)
├── README.md             # Full documentation
├── QUICKSTART.md         # This file
└── data/
    ├── messages.json     # Message storage
    └── users.json        # User tracking
```

## 🔧 Configuration

### Change Server Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Add More Chat Rooms
Edit `data/messages.json`:
```json
{
  "global-lobby": [],
  "private-peer": [],
  "announcements": [],
  "general": []
}
```

Update HTML room items accordingly.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Kill process: `netstat -ano \| findstr :3000` |
| Won't connect | Ensure server is running: `npm start` |
| Mobile can't reach | Use IP address, not localhost |
| Messages not appearing | Check browser console (F12) for errors |
| Responsive not working | Clear cache (Ctrl+Shift+Del) |

## 💡 Next Steps

1. ✅ Run the application
2. ✅ Test with multiple browsers
3. ✅ Test on mobile devices
4. ✅ Explore responsive design at different sizes
5. ✅ Check browser console for any errors
6. ✅ Review code documentation

## 📚 Additional Resources

- Express.js: https://expressjs.com
- Socket.IO: https://socket.io
- CSS Media Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries
- Responsive Web Design: https://www.w3schools.com/css/css_rwd_intro.asp

---

**Ready to chat?** 🎉

```bash
npm start
```

Then visit: `http://localhost:3000`
