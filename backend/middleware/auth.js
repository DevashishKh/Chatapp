/**
 * middleware/auth.js - JWT Authentication middleware
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token for protected routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized - no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");

    // Attach user to request
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized - invalid token" });
  }
};

// Verify cross-app API secret token
const verifyApiToken = (req, res, next) => {
  const token = req.headers["x-api-token"] || req.query.token;

  if (!token || token !== process.env.API_SECRET_TOKEN) {
    return res.status(401).json({ message: "Invalid API token" });
  }

  next();
};

module.exports = { protect, verifyApiToken };
