const cors = require("cors");

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin || "no-origin"}`);

    // Allow requests with no origin (like mobile apps, curl requests, or Postman)
    if (!origin) {
      console.log("✅ Allowing request with no origin");
      return callback(null, true);
    }

    const allowedOrigins = [
      "http://localhost:3000", // Next.js dev server (default)
      "http://127.0.0.1:3000", // Alternative localhost
      "http://localhost:3001", // Alternative port for client
      "http://localhost:4000", // Another alternative port
      process.env.CLIENT_URL || "http://localhost:3000", // Production URL from env

      // Production domains - Replace with your actual Netlify URL
      "https://aicomponentgenerator.netlify.app",
      

      // Preview URLs (Netlify generates these for pull requests)
      /^https:\/\/deploy-preview-\d+--aicomponentgenerator\.netlify\.app$/,
      /^https:\/\/[a-f0-9-]+--aicomponentgenerator\.netlify\.app$/,
    ];

    // In development, be more permissive
    if (process.env.NODE_ENV === "development") {
      // Allow any localhost origin in development
      if (origin && origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      if (origin && origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
    }

    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-HTTP-Method-Override",
    "X-CSRF-Token",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range", "Authorization"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  maxAge: 86400, // Cache preflight response for 24 hours
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Error handler for CORS errors
const handleCorsError = (err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Your origin is not allowed by our CORS policy",
      origin: req.headers.origin || "unknown",
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware,
  handleCorsError,
  corsOptions,
};
