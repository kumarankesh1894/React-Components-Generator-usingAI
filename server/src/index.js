const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const history = require('./routes/history');
const sessionRoutes = require("./routes/session");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));
const aiRoutes = require('./routes/ai');
app.use('/api', aiRoutes); // This will make /api/generate available

app.use('/api/auth', authRoutes);
app.use("/api/history", history);
app.use("/api/sessions", sessionRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
