import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AdminSettings from '../models/AdminSettings.js';
import Trade from '../models/Trade.js';
import Signal from '../models/Signal.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this username or phone already exists' 
      });
    }

    // Create new user
    const user = new User({
      username,
      password,
      phone
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        vipLevel: user.vipLevel,
        inviteCode: user.inviteCode
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or phone
    const user = await User.findOne({ 
      $or: [{ username }, { phone: username }] 
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        vipLevel: user.vipLevel,
        inviteCode: user.inviteCode
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify token
router.get('/verify', auth, (req, res) => {
  res.json({ message: 'Token is valid', userId: req.userId });
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user has traded today
router.get('/user/today-trade-status', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTrade = await Trade.findOne({
      userId: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.json({ 
      hasTradeToday: !!todayTrade,
      todayTrade: todayTrade || null
    });
  } catch (error) {
    console.error('Error checking today trade status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Place a trade
router.post('/user/place-trade', auth, async (req, res) => {
  try {
    const { symbol, signal, amount, adminSignal } = req.body;
    
    // Validation
    if (!symbol || !signal || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (amount < 600) {
      return res.status(400).json({ message: 'Minimum trade amount is ₹600' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check if user has already traded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasTradeToday = user.trades.some(trade => 
      trade.date >= today
    );

    if (hasTradeToday) {
      return res.status(400).json({ message: 'You can only trade once per day' });
    }

    // Calculate profit/penalty based on signal following
    const followedSignal = signal === adminSignal;
    let profitLoss;
    let resultMessage;

    if (followedSignal) {
      profitLoss = amount * 0.06; // 6% profit
      resultMessage = `Trade successful! You followed the admin signal and earned ₹${profitLoss.toFixed(2)} profit!`;
    } else {
      profitLoss = -amount * 0.30; // 30% penalty
      resultMessage = `Trade placed but you didn't follow the admin signal (${adminSignal}). ₹${Math.abs(profitLoss).toFixed(2)} penalty applied.`;
    }

    // Deduct trade amount and add/subtract profit/penalty
    user.balance = user.balance - amount + profitLoss;

    // Add trade to user's trade history
    user.trades.push({
      symbol,
      signal,
      amount,
      adminSignal,
      followedSignal,
      profitLoss,
      date: new Date(),
      status: 'completed'
    });

    await user.save();

    res.json({ 
      success: true,
      message: resultMessage,
      newBalance: user.balance,
      profitLoss,
      followedSignal
    });
  } catch (error) {
    console.error('Error placing trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user balance
router.get('/user/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('balance');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: user.balance });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current admin signal
router.get('/admin/current-signal', auth, async (req, res) => {
  try {
    const latestSignal = await Signal.getLatestSignal();
    
    if (!latestSignal) {
      // Create a default signal if none exists
      const adminUser = await User.findOne({ username: 'admin' });
      const adminId = adminUser ? adminUser._id : req.userId;
      
      const defaultSignal = new Signal({
        symbol: 'BTCUSDT',
        signalType: Math.random() > 0.5 ? 'Call' : 'Put',
        confidence: Math.floor(Math.random() * 30) + 70,
        targetPrice: Math.random() * 50000 + 30000,
        currentPrice: Math.random() * 50000 + 30000,
        timeframe: '15m',
        analysis: 'Automated signal for testing',
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      });
      
      await defaultSignal.save();
      return res.json({ signal: defaultSignal.signalType });
    }
    
    res.json({ signal: latestSignal.signalType });
  } catch (error) {
    console.error('Error fetching admin signal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile with trading stats
router.get('/user/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get trading statistics
    const stats = await Trade.getUserStats(req.userId);
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        vipLevel: user.vipLevel,
        inviteCode: user.inviteCode,
        balance: user.balance,
        createdAt: user.createdAt
      },
      tradingStats: stats
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
