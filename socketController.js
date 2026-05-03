/**
 * controllers/socketController.js - Real-time Socket.IO event handling
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

// Track online users: userId -> socketId
const onlineUsers = new Map();

const handleSocketEvents = (io) => {
  // ─── Authentication Middleware for Sockets ──────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      const user = await User.findById(decoded.id).select("-password");

      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.userId})`);

    // ─── Join personal room ───────────────────────────────────────────────────
    socket.join(socket.userId);
    onlineUsers.set(socket.userId, socket.id);

    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, { status: "online", lastSeen: new Date() });

    // Broadcast online status to all connected users
    io.emit("user_status_change", { userId: socket.userId, status: "online" });

    // Send list of currently online users to the newly connected user
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    // ─── Handle sending messages ──────────────────────────────────────────────
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content, type = "text" } = data;

        if (!receiverId || !content) return;

        // Save message to DB
        const message = await Message.create({
          sender: socket.userId,
          receiver: receiverId,
          content,
          type,
          status: onlineUsers.has(receiverId) ? "delivered" : "sent",
        });

        await message.populate("sender", "username avatar");
        await message.populate("receiver", "username avatar");

        // Send to receiver's room
        io.to(receiverId).emit("new_message", message);

        // Send back to sender (confirmation + any other tabs)
        socket.emit("message_sent", message);

        // Check auto-reply
        const receiver = await User.findById(receiverId);
        if (receiver?.autoReply?.enabled && !onlineUsers.has(receiverId)) {
          setTimeout(async () => {
            const autoReply = await Message.create({
              sender: receiverId,
              receiver: socket.userId,
              content: receiver.autoReply.message,
              type: "text",
              status: "sent",
            });
            await autoReply.populate("sender", "username avatar");
            io.to(socket.userId).emit("new_message", autoReply);
          }, 1500);
        }
      } catch (err) {
        console.error("Socket send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── Typing indicators ────────────────────────────────────────────────────
    socket.on("typing_start", ({ receiverId }) => {
      io.to(receiverId).emit("user_typing", {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ receiverId }) => {
      io.to(receiverId).emit("user_typing", {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false,
      });
    });

    // ─── Mark messages as read ────────────────────────────────────────────────
    socket.on("mark_read", async ({ senderId }) => {
      await Message.updateMany(
        { sender: senderId, receiver: socket.userId, status: { $ne: "read" } },
        { status: "read" }
      );
      // Notify sender that messages were read
      io.to(senderId).emit("messages_read", { byUserId: socket.userId });
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(socket.userId);

      await User.findByIdAndUpdate(socket.userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      io.emit("user_status_change", { userId: socket.userId, status: "offline" });
    });
  });
};

// Export online users map so other controllers can use it
module.exports = { handleSocketEvents, onlineUsers };
