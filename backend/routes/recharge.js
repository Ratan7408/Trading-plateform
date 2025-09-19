import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get recharge records for authenticated user
router.get('/records', auth, async (req, res) => {
  try {
    // For now, return empty array (no data state)
    // In a real app, you would fetch from database
    res.json([]);
  } catch (error) {
    console.error('Error fetching recharge records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
