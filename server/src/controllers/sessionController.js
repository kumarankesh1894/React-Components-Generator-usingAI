const Session = require("../models/Session");

const createSession = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Session name is required" });

  try {
    const session = await Session.create({
      userId: req.user.userId,
      name,
    });
    res.json({ session });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
};

module.exports = { createSession, getSessions };
