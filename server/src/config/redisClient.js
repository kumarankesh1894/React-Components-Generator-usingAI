const redis = require("redis");

const redisClient = redis.createClient({
  legacyMode: true, // Needed for compatibility with connect-redis
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect().catch(console.error);

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

module.exports = redisClient;
