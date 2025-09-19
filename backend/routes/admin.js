import express from 'express';
import AdminSettings from '../models/AdminSettings.js';

const router = express.Router();

// Admin login (simple check for demo)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple admin credentials check (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
      res.json({ 
        message: 'Admin login successful',
        isAdmin: true 
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current admin settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ isActive: true });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update admin settings
router.post('/settings', async (req, res) => {
  try {
    const { currency, percentageAmount, buyAmount, putAmount } = req.body;
    
    // Validate required fields
    if (!currency || percentageAmount === undefined || buyAmount === undefined || putAmount === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate percentage amount
    if (percentageAmount < 0 || percentageAmount > 100) {
      return res.status(400).json({ message: 'Percentage amount must be between 0 and 100' });
    }

    // Validate amounts
    if (buyAmount < 0 || putAmount < 0) {
      return res.status(400).json({ message: 'Buy and Put amounts must be positive' });
    }

    // Deactivate current settings
    await AdminSettings.updateMany({ isActive: true }, { isActive: false });

    // Create new settings
    const newSettings = new AdminSettings({
      currency,
      percentageAmount,
      buyAmount,
      putAmount,
      isActive: true
    });

    await newSettings.save();

    res.status(201).json({ 
      message: 'Admin settings updated successfully',
      settings: newSettings 
    });
  } catch (error) {
    console.error('Error saving admin settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
