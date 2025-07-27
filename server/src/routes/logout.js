const express = require("express");
const redisClient = require("../config/redisClient");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionKey = `session:${userId}`;

    await redisClient.del(sessionKey);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

module.exports = router;
