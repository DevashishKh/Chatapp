/**
 * routes/users.js - User listing and search
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { onlineUsers } = require("../controllers/socketController");

// GET /api/users - Get all users (for contacts list)
router.get("/", protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { _id: { $ne: req.user._id } }; // Exclude current user

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("username email avatar status lastSeen").limit(50);

    // Add real-time online status
    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      status: onlineUsers.has(user._id.toString()) ? "online" : user.status,
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:userId - Get single user profile
router.get("/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("username email avatar status lastSeen");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: {
        ...user.toObject(),
        status: onlineUsers.has(user._id.toString()) ? "online" : user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
