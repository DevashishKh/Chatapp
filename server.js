/**
 * server.js - Main entry point for the ChatApp backend
 * Sets up Express, Socket.IO, and MongoDB connection
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

// Import routes
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const webhookRoutes = require("./routes/webhooks");

// Socket handler
const { handleSocketEvents } = require("./controllers/socketController");

const app = express();
const server = http.createServer(app);

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" })); // Support base64 image uploads
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes/controllers
app.set("io", io);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/webhooks", webhookRoutes); // Cross-app messaging

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "ChatApp API is running 🚀" });
});

// ─── Socket.IO Event Handlers ─────────────────────────────────────────────────
handleSocketEvents(io);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Don't crash - allow health checks to still work
  });

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, io };
