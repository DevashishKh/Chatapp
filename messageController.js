/**
 * controllers/messageController.js - Message CRUD and history
 */

const Message = require("../models/Message");
const User = require("../models/User");

// GET /api/messages/:userId - Get chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages between the two users (both directions)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      isScheduled: false, // Don't include scheduled messages
    })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar");

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, status: { $ne: "read" } },
      { status: "read" }
    );

    res.json({
      messages: messages.reverse(), // Return oldest first
      page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/messages - Send a message via REST (also used for scheduled messages)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, type = "text", scheduledAt } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      type,
      status: "sent",
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
      isScheduled,
    });

    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");

    // If not scheduled, emit via Socket.IO
    if (!isScheduled) {
      const io = req.app.get("io");
      io.to(receiverId.toString()).emit("new_message", message);

      // Update status to delivered if receiver is online
      // (handled in socketController)
    }

    // Auto-reply logic
    if (!isScheduled && receiver.autoReply?.enabled) {
      setTimeout(async () => {
        const autoReplyMsg = await Message.create({
          sender: receiverId,
          receiver: req.user._id,
          content: receiver.autoReply.message,
          type: "text",
          status: "sent",
          source: "app",
        });
        await autoReplyMsg.populate("sender", "username avatar");

        const io = req.app.get("io");
        io.to(req.user._id.toString()).emit("new_message", autoReplyMsg);
      }, 1500);
    }

    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/messages/scheduled - Get scheduled messages
const getScheduledMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.user._id,
      isScheduled: true,
    })
      .sort({ scheduledAt: 1 })
      .populate("receiver", "username avatar");

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/messages/:messageId - Delete a message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      sender: req.user._id,
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getChatHistory, sendMessage, getScheduledMessages, deleteMessage };
