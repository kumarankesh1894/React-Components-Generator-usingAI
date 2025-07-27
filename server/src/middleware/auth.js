require("dotenv").config();
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redisClient");

const JWT_SECRET = process.env.JWT_SECRET || "ankesh123";

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    // Verify the JWT (throws error if invalid)
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const session = await redisClient.get(`session:${userId}`);
    if (!session) {
      return res.status(401).json({ error: "Session expired or invalid" });
    }

    req.user = {
      ...decoded,
      ...JSON.parse(session),
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid token or session" });
  }
};

module.exports = authenticate;
