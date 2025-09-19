import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get withdraw records for authenticated user
router.get('/records', auth, async (req, res) => {
  try {
    // For now, return empty array (no data state)
    // In a real app, you would fetch from database
    res.json([]);
  } catch (error) {
    console.error('Error fetching withdraw records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new withdraw request
router.post('/request', auth, async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    
    // Validate required fields
    if (!amount || !method || !accountDetails) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // In a real app, you would save to database
    const withdrawRequest = {
      id: Date.now(),
      userId: req.user.id,
      amount,
      method,
      accountDetails,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ 
      message: 'Withdraw request submitted successfully',
      withdrawRequest 
    });
  } catch (error) {
    console.error('Error creating withdraw request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
