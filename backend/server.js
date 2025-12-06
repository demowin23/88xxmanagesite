require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/teams', require('./routes/teams'));
app.use('/api/websites', require('./routes/websites'));
app.use('/api/proxies', require('./routes/proxies'));
app.use('/api/block-check', require('./routes/blockCheck'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Khởi động scheduler
  scheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  scheduler.stop();
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});



