const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { init: initDb, getDb, save } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Make db available to routes - will be set after init
app.use((req, res, next) => {
  req.db = getDb();
  req.dbSave = save;
  next();
});

// Initialize and start server
async function start() {
  try {
    await initDb();
    console.log('Database initialized');
    
    // Load routes after db is ready
    const authRoutes = require('./routes/auth');
    const reelsRoutes = require('./routes/reels');
    const analyticsRoutes = require('./routes/analytics');
    
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/reels', reelsRoutes);
    app.use('/api/analytics', analyticsRoutes);
    
    // Serve static frontend files
    app.use(express.static(path.join(__dirname, '../frontend')));
    
    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Serve frontend for all other routes (SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
    
    // Schedule automatic refresh every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled Reels refresh...');
    });
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;