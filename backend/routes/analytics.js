const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../config/database');

const router = express.Router();

// Make db available from request
router.use((req, res, next) => {
  req.db = getDb();
  next();
});

// Get analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = '';
    if (period === '7d') {
      dateFilter = "AND fetched_at >= datetime('now', '-7 days')";
    } else if (period === '30d') {
      dateFilter = "AND fetched_at >= datetime('now', '-30 days')";
    }

    // Get total stats using a raw query for SQLite
    let statsQuery = `
      SELECT 
        COUNT(*) as total_reels,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(AVG(views), 0) as avg_views
       FROM reels 
       WHERE user_id = ? ${dateFilter}
    `;
    
    const stats = req.db.prepare(statsQuery).get(req.user.id);

    // Get top performing reels
    const topReels = req.db.prepare(
      `SELECT * FROM reels WHERE user_id = ? ${dateFilter} ORDER BY views DESC LIMIT 5`
    ).all(req.user.id);

    // Get recent activity
    const recent = req.db.prepare(
      `SELECT * FROM reels WHERE user_id = ? ORDER BY fetched_at DESC LIMIT 10`
    ).all(req.user.id);

    // Get daily views for chart (last 30 days)
    const dailyViews = req.db.prepare(
      `SELECT 
        DATE(fetched_at) as date,
        SUM(views) as views,
        COUNT(*) as count
       FROM reels 
       WHERE user_id = ? 
         AND fetched_at >= datetime('now', '-30 days')
       GROUP BY DATE(fetched_at)
       ORDER BY date`
    ).all(req.user.id);

    res.json({
      summary: stats,
      topReels,
      recent,
      dailyViews
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;