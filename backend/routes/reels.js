const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { fetchReelData } = require('../services/apifay');
const { getDb } = require('../config/database');

const router = express.Router();

// Make db available from request
router.use((req, res, next) => {
  req.db = getDb();
  next();
});

// Get all reels for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sort = 'newest' } = req.query;
    
    let orderBy = 'fetched_at DESC';
    if (sort === 'oldest') orderBy = 'fetched_at ASC';
    if (sort === 'views') orderBy = 'views DESC';
    
    const reels = req.db.prepare(
      `SELECT * FROM reels WHERE user_id = ? ORDER BY ${orderBy}`
    ).all(req.user.id);

    res.json({ reels });
  } catch (error) {
    console.error('Get reels error:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

// Add new reel
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reelUrl } = req.body;

    if (!reelUrl) {
      return res.status(400).json({ error: 'Reel URL is required' });
    }

    // Validate Instagram Reels URL
    if (!reelUrl.includes('instagram.com/reel/')) {
      return res.status(400).json({ error: 'Invalid Instagram Reels URL' });
    }

    const reelData = await fetchReelData(reelUrl);

    const result = req.db.prepare(
      'INSERT INTO reels (user_id, reel_url, reel_id, views, thumbnail_url, published_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, reelUrl, reelData.reelId, reelData.views, reelData.thumbnail, reelData.publishedAt);

    const reel = req.db.prepare('SELECT * FROM reels WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Reel added successfully',
      reel
    });
  } catch (error) {
    console.error('Add reel error:', error);
    res.status(500).json({ error: 'Failed to add reel' });
  }
});

// Delete reel
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = req.db.prepare(
      'DELETE FROM reels WHERE id = ? AND user_id = ?'
    ).run(id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    res.json({ message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Delete reel error:', error);
    res.status(500).json({ error: 'Failed to delete reel' });
  }
});

// Refresh single reel from APIFAY
router.post('/:id/refresh', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const reel = req.db.prepare('SELECT * FROM reels WHERE id = ? AND user_id = ?').get(id, req.user.id);

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const reelData = await fetchReelData(reel.reel_url);

    req.db.prepare(
      'UPDATE reels SET views = ?, thumbnail_url = ?, published_at = ?, fetched_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(reelData.views, reelData.thumbnail, reelData.publishedAt, id);

    const updated = req.db.prepare('SELECT * FROM reels WHERE id = ?').get(id);

    res.json({
      message: 'Reel refreshed successfully',
      reel: updated
    });
  } catch (error) {
    console.error('Refresh reel error:', error);
    res.status(500).json({ error: 'Failed to refresh reel' });
  }
});

module.exports = router;