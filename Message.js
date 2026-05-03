/**
 * models/Message.js - MongoDB Message schema
 */

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, "Message too long"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    // For message scheduling feature
    scheduledAt: {
      type: Date,
      default: null,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    // For cross-app messaging
    source: {
      type: String,
      enum: ["app", "api", "webhook"],
      default: "app",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model("Message", messageSchema);
