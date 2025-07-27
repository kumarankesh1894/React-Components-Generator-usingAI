const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes); // This will make /api/generate available
app.use("/api/history", history);
app.use("/api/sessions", sessionRoutes);
app.use('/api/logout', logoutRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
