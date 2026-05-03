/**
 * routes/messages.js - Message endpoints
 */

const express = require("express");
const router = express.Router();
const { getChatHistory, sendMessage, getScheduledMessages, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

// All message routes are protected
router.use(protect);

// GET /api/messages/scheduled
router.get("/scheduled", getScheduledMessages);

// GET /api/messages/:userId - Get chat history
router.get("/:userId", getChatHistory);

// POST /api/messages - Send message
router.post("/", sendMessage);

// DELETE /api/messages/:messageId
router.delete("/:messageId", deleteMessage);

module.exports = router;
