/**
 * routes/auth.js - Authentication endpoints
 */

const express = require("express");
const router = express.Router();
const { signup, login, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me (protected)
router.get("/me", protect, getMe);

// PUT /api/auth/profile (protected)
router.put("/profile", protect, updateProfile);

module.exports = router;
