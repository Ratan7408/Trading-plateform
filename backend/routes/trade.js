import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import Market from '../models/Market.js';
import Signal from '../models/Signal.js';

const router = express.Router();

// Place a new trade
router.post('/place', auth, async (req, res) => {
  try {
    const { symbol, tradeType, amount } = req.body;
    const userId = req.userId;

    // Validation
    if (!symbol || !tradeType || !amount) {
      return res.status(400).json({ message: 'Symbol, trade type, and amount are required' });
    }

    if (!['Call', 'Put'].includes(tradeType)) {
      return res.status(400).json({ message: 'Trade type must be Call or Put' });
    }

    if (amount < 600) {
      return res.status(400).json({ message: 'Minimum trade amount is ₹600' });
    }

    // Get user
    const user = await User.findById(userId);
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTrade = await Trade.findOne({
      userId: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (todayTrade) {
      return res.status(400).json({ message: 'You can only trade once per day' });
    }

    // Get current market data
    let market = await Market.findOne({ symbol: symbol.replace('/', '') });
    if (!market) {
      // Create market entry with mock data for testing
      market = new Market({
        symbol: symbol.replace('/', ''),
        name: symbol.split('/')[0],
        currentPrice: Math.random() * 50000 + 1000, // Random price for testing
        priceChangePercentage24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
        marketCap: Math.random() * 100000000000,
        rank: Math.floor(Math.random() * 100) + 1
      });
      await market.save();
    }

    // Get current admin signal
    let currentSignal = await Signal.getCurrentSignal(symbol.replace('/', ''));
    if (!currentSignal) {
      // Create a default signal for testing
      const adminUser = await User.findOne({ username: 'admin' });
      const adminId = adminUser ? adminUser._id : userId;
      
      currentSignal = new Signal({
        symbol: symbol.replace('/', ''),
        signalType: Math.random() > 0.5 ? 'Call' : 'Put',
        confidence: Math.floor(Math.random() * 30) + 70,
        targetPrice: market.currentPrice * (1 + (Math.random() - 0.5) * 0.1),
        currentPrice: market.currentPrice,
        timeframe: '15m',
        analysis: 'Automated signal for testing',
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      });
      await currentSignal.save();
    }

    // Check if user followed the admin signal
    const followedSignal = tradeType === currentSignal.signalType;

    // Create trade
    const trade = new Trade({
      userId: userId,
      symbol: symbol,
      tradeType: tradeType,
      amount: amount,
      entryPrice: market.currentPrice,
      adminSignal: currentSignal.signalType,
      followedSignal: followedSignal,
      marketData: {
        volume24h: market.volume24h,
        marketCap: market.marketCap,
        rank: market.rank,
        priceChange24h: market.priceChangePercentage24h
      },
      status: 'active'
    });

    await trade.save();

    // Deduct amount from user balance
    user.balance -= amount;
    await user.save();

    // Simulate trade completion after 5 minutes (for testing, we'll complete immediately)
    setTimeout(async () => {
      try {
        const completedTrade = await Trade.findById(trade._id);
        if (completedTrade && completedTrade.status === 'active') {
          // Simulate price movement
          const priceMovement = (Math.random() - 0.5) * 0.05; // ±2.5% movement
          const exitPrice = completedTrade.entryPrice * (1 + priceMovement);
          
          const profitLoss = completedTrade.calculateResult(exitPrice);
          await completedTrade.save();

          // Update user balance with profit/loss
          const tradeUser = await User.findById(completedTrade.userId);
          tradeUser.balance += completedTrade.amount + profitLoss;
          await tradeUser.save();

          console.log(`Trade ${completedTrade._id} completed with P&L: ${profitLoss}`);
        }
      } catch (error) {
        console.error('Error completing trade:', error);
      }
    }, 5000); // Complete trade after 5 seconds for testing

    res.status(201).json({
      success: true,
      message: 'Trade placed successfully',
      trade: {
        id: trade._id,
        symbol: trade.symbol,
        tradeType: trade.tradeType,
        amount: trade.amount,
        entryPrice: trade.entryPrice,
        adminSignal: trade.adminSignal,
        followedSignal: trade.followedSignal,
        status: trade.status,
        startTime: trade.startTime,
        endTime: trade.endTime
      },
      userBalance: user.balance
    });

  } catch (error) {
    console.error('Error placing trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's trade history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const trades = await Trade.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Trade.countDocuments({ userId });

    res.json({
      trades,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's trading statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await Trade.getUserStats(userId);
    
    res.json(stats);

  } catch (error) {
    console.error('Error fetching trade stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active trades
router.get('/active', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const activeTrades = await Trade.find({
      userId: userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json(activeTrades);

  } catch (error) {
    console.error('Error fetching active trades:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user can trade today
router.get('/can-trade-today', auth, async (req, res) => {
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
      canTrade: !todayTrade,
      hasTradeToday: !!todayTrade,
      todayTrade: todayTrade || null
    });

  } catch (error) {
    console.error('Error checking today trade status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current market data
router.get('/market/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    let market = await Market.getBySymbol(symbol);
    
    if (!market) {
      // Create mock market data for testing
      market = new Market({
        symbol: symbol.replace('/', ''),
        name: symbol.split('/')[0] || 'Unknown',
        currentPrice: Math.random() * 50000 + 1000,
        priceChangePercentage24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
        marketCap: Math.random() * 100000000000,
        rank: Math.floor(Math.random() * 100) + 1
      });
      await market.save();
    }

    res.json(market);

  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current admin signal
router.get('/signal/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    let signal = await Signal.getCurrentSignal(symbol);
    
    if (!signal) {
      // Create default signal for testing
      const adminUser = await User.findOne({ username: 'admin' });
      const adminId = adminUser ? adminUser._id : req.userId;
      
      signal = new Signal({
        symbol: symbol.replace('/', ''),
        signalType: Math.random() > 0.5 ? 'Call' : 'Put',
        confidence: Math.floor(Math.random() * 30) + 70,
        targetPrice: Math.random() * 50000 + 1000,
        currentPrice: Math.random() * 50000 + 1000,
        timeframe: '15m',
        analysis: 'Automated signal for testing',
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      });
      await signal.save();
    }

    res.json(signal);

  } catch (error) {
    console.error('Error fetching signal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
