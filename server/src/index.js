const express = require('express');
const mongoose = require('mongoose');
const { corsMiddleware, handleCorsError } = require('./middleware/cors');
const authRoutes = require('./routes/auth');
const authenticate = require('./middleware/auth');
const history = require('./routes/history');
const sessionRoutes = require("./routes/session");
const aiRoutes = require('./routes/ai');
require('dotenv').config();
require('./config/redisClient')
const logoutRoutes = require('./routes/logout');
const app = express();
const PORT = process.env.PORT || 5000;

// Apply CORS middleware
app.use(corsMiddleware);
app.use(handleCorsError);
app.use(express.json({ limit: '10mb' })); // Increase limit for large code payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    origin: req.headers.origin || 'no-origin'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes); // This will make /api/generate available
app.use("/api/history", history);
app.use("/api/sessions", sessionRoutes);
app.use('/api/logout', logoutRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for client: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test CORS: http://localhost:3000/test-cors`);
});
