import express from 'express';
import AdminSettings from '../models/AdminSettings.js';
import User from '../models/User.js';

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

// Get current admin signal
router.get('/current-signal', async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ isActive: true });
    res.json({ 
      signal: settings?.tradeSignal || 'Call',
      tradeName: settings?.tradeName || 'Bitcoin'
    });
  } catch (error) {
    console.error('Error fetching admin signal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Preview trade results
router.post('/preview-trade-results', async (req, res) => {
  try {
    const { tradeName, tradeSignal } = req.body;
    
    // Find users who placed trades matching the criteria
    const users = await User.find({
      'trades.symbol': tradeName,
      'trades.signal': tradeSignal,
      'trades.date': {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today's trades
      }
    });

    const affectedUsers = users.map(user => {
      const matchingTrade = user.trades.find(trade => 
        trade.symbol === tradeName && trade.signal === tradeSignal
      );
      
      return {
        username: user.username,
        tradeAmount: matchingTrade?.amount || 0,
        userId: user._id
      };
    });

    res.json({ affectedUsers });
  } catch (error) {
    console.error('Error previewing trade results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manage trade - new endpoint for trade management
router.post('/manage-trade', async (req, res) => {
  try {
    const { tradeName, tradeSignal, oldTrade, oldSignal, profitPercentage, minimumAmount } = req.body;
    
    // Update admin settings with new trade signal
    await AdminSettings.updateMany({ isActive: true }, { isActive: false });
    
    const newSettings = new AdminSettings({
      tradeName,
      tradeSignal,
      oldTrade,
      oldSignal,
      profitPercentage: profitPercentage || 6,
      minimumAmount: minimumAmount || 600,
      isActive: true,
      createdAt: new Date()
    });

    await newSettings.save();

    // Find and update users who followed the signal
    const eligibleUsers = await User.find({
      'trades.symbol': tradeName,
      'trades.signal': tradeSignal,
      'trades.amount': { $gte: minimumAmount },
      'trades.date': {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today's trades
      }
    });

    let totalProfitDistributed = 0;
    let usersUpdated = 0;

    for (const user of eligibleUsers) {
      const matchingTrade = user.trades.find(trade => 
        trade.symbol === tradeName && 
        trade.signal === tradeSignal && 
        trade.amount >= minimumAmount
      );

      if (matchingTrade) {
        const profit = matchingTrade.amount * (profitPercentage / 100);
        user.balance += profit;
        matchingTrade.profit = profit;
        matchingTrade.status = 'completed';
        
        await user.save();
        totalProfitDistributed += profit;
        usersUpdated++;
      }
    }

    res.json({ 
      message: 'Trade management completed successfully',
      usersUpdated,
      totalProfitDistributed,
      settings: newSettings
    });
  } catch (error) {
    console.error('Error managing trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
