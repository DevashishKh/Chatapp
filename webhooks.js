/**
 * routes/webhooks.js - Cross-app messaging API
 * 
 * This allows external apps to send messages via REST API.
 * Secured with API token authentication.
 * 
 * Usage example:
 * POST /api/webhooks/send
 * Headers: { "x-api-token": "your_api_secret_token" }
 * Body: { "senderEmail": "user@example.com", "receiverEmail": "other@example.com", "content": "Hello!" }
 */

const express = require("express");
const router = express.Router();
const { verifyApiToken } = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

// POST /api/webhooks/send - Send message from external app
router.post("/send", verifyApiToken, async (req, res) => {
  try {
    const { senderEmail, receiverEmail, content, type = "text" } = req.body;

    if (!senderEmail || !receiverEmail || !content) {
      return res.status(400).json({
        message: "senderEmail, receiverEmail, and content are required",
      });
    }

    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });

    if (!sender) return res.status(404).json({ message: "Sender not found" });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const message = await Message.create({
      sender: sender._id,
      receiver: receiver._id,
      content,
      type,
      status: "sent",
      source: "api", // Mark as coming from external API
    });

    await message.populate("sender", "username email avatar");
    await message.populate("receiver", "username email avatar");

    // Emit via Socket.IO if receiver is online
    const io = req.app.get("io");
    io.to(receiver._id.toString()).emit("new_message", message);

    res.status(201).json({
      success: true,
      message: "Message delivered",
      data: {
        messageId: message._id,
        sender: sender.username,
        receiver: receiver.username,
        timestamp: message.createdAt,
      },
    });
  } catch (error) {
    console.error("Webhook send error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/webhooks/messages - Get messages for a user (external app polling)
router.get("/messages", verifyApiToken, async (req, res) => {
  try {
    const { email, since } = req.query;

    if (!email) return res.status(400).json({ message: "email query param required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const query = { receiver: user._id };
    if (since) query.createdAt = { $gte: new Date(since) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("sender", "username email")
      .populate("receiver", "username email");

    res.json({ messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/webhooks/receive - Receive webhook from external apps
router.post("/receive", verifyApiToken, async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log(`📨 Webhook received - Event: ${event}`, payload);

    // Process different event types
    switch (event) {
      case "message":
        // Handle incoming message from external app
        res.json({ received: true, event });
        break;
      default:
        res.json({ received: true, event: "unknown" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
