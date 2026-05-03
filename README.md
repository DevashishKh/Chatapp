# ChatApp — Real-time Messaging Application

A full-stack WhatsApp-style messaging app built with React, Node.js, Socket.IO, and MongoDB.

---

## 🗂 Project Structure

```
chatapp/
├── backend/               # Node.js + Express + Socket.IO
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   └── socketController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── messages.js
│   │   ├── users.js
│   │   └── webhooks.js     ← Cross-app messaging API
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/              # React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   ├── ChatWindow.js
│   │   │   ├── MessageInput.js
│   │   │   └── RightPanel.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ChatContext.js
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   └── ChatPage.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── render.yaml            # One-click Render deployment
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works) OR local MongoDB

### 1. Clone and install

```bash
git clone <your-repo-url>
cd chatapp

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
#   MONGODB_URI=<your Atlas connection string>
#   JWT_SECRET=any_long_random_string
#   FRONTEND_URL=http://localhost:3000
#   API_SECRET_TOKEN=any_secret_for_cross_app_api
```

### 3. Start backend

```bash
cd backend
npm run dev   # uses nodemon for hot-reload
# or: npm start
```

### 4. Start frontend (new terminal)

```bash
cd frontend
npm start
```

Open http://localhost:3000 — create two accounts in different browser tabs to test chat!

---

## ☁️ Deploy on Render

### Option A — One-click with Blueprint (recommended)

1. Push this repo to GitHub
2. Go to https://dashboard.render.com → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates both services automatically
5. In the **chatapp-backend** service dashboard, add environment variable:
   - `MONGODB_URI` = your MongoDB Atlas connection string
6. Click **Deploy** — done!

### Option B — Manual setup

**Backend (Web Service)**
| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Node Version | 18 |

Environment Variables:
```
MONGODB_URI        = <your Atlas URI>
JWT_SECRET         = <random string>
API_SECRET_TOKEN   = <random string>
FRONTEND_URL       = https://your-frontend.onrender.com
NODE_ENV           = production
PORT               = 10000
```

**Frontend (Static Site)**
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `build` |
| Rewrite Rule | `/*` → `/index.html` |

Environment Variables:
```
REACT_APP_BACKEND_URL = https://your-backend.onrender.com
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user (🔒) |
| PUT | `/api/auth/profile` | Update profile (🔒) |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/:userId` | Chat history (🔒) |
| POST | `/api/messages` | Send / schedule message (🔒) |
| GET | `/api/messages/scheduled` | Get scheduled messages (🔒) |
| DELETE | `/api/messages/:id` | Delete message (🔒) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (🔒) |
| GET | `/api/users/:userId` | Get user profile (🔒) |

### Cross-App Messaging (🔑 API Token required)

Add header: `x-api-token: YOUR_API_SECRET_TOKEN`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/send` | Send message from external app |
| GET | `/api/webhooks/messages?email=...` | Poll messages for a user |
| POST | `/api/webhooks/receive` | Receive webhook event |

**Example: Send message from external app**
```bash
curl -X POST https://your-backend.onrender.com/api/webhooks/send \
  -H "Content-Type: application/json" \
  -H "x-api-token: YOUR_API_SECRET_TOKEN" \
  -d '{
    "senderEmail": "alice@example.com",
    "receiverEmail": "bob@example.com",
    "content": "Hello from external app!"
  }'
```

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{ receiverId, content, type }` | Send a message |
| `typing_start` | `{ receiverId }` | Start typing indicator |
| `typing_stop` | `{ receiverId }` | Stop typing indicator |
| `mark_read` | `{ senderId }` | Mark messages as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | Message object | Incoming message |
| `message_sent` | Message object | Your sent message confirmation |
| `user_typing` | `{ userId, username, isTyping }` | Typing indicator |
| `user_status_change` | `{ userId, status }` | Online/offline update |
| `online_users` | `[userId, ...]` | List of online users on connect |
| `messages_read` | `{ byUserId }` | Your messages were read |

---

## ✨ Features

- ✅ JWT authentication (signup/login)
- ✅ Real-time messaging with Socket.IO
- ✅ Online/offline status
- ✅ Typing indicators
- ✅ Message status (sent/delivered/read ✓✓)
- ✅ Message timestamps + date dividers
- ✅ Emoji picker
- ✅ Image/file sharing
- ✅ Message scheduling
- ✅ Auto-reply when offline
- ✅ Dark/light theme toggle
- ✅ Cross-app messaging REST API
- ✅ Webhook support
- ✅ Notifications panel for unread messages
- ✅ Render-ready deployment config

---

## 🔧 MongoDB Atlas Setup (free)

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Create a database user with read/write access
4. Whitelist IP: `0.0.0.0/0` (all IPs, needed for Render)
5. Click **Connect** → **Drivers** → copy the connection string
6. Replace `<password>` with your DB user password
7. Paste into `MONGODB_URI` in your `.env` / Render env vars
