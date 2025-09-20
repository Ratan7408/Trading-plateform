import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import Trade from '../models/Trade.js';
import User from '../models/User.js';

const router = express.Router();

// Get order records for authenticated user
router.get('/records', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;

    // Build query
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) {
      query.status = status;
    }

    // Get trades (orders)
    const trades = await Trade.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Trade.countDocuments(query);

    // Format trades as order records
    const orders = trades.map(trade => ({
      id: trade._id,
      symbol: trade.symbol,
      type: trade.tradeType,
      amount: trade.amount,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      profitLoss: trade.profitLoss,
      profitPercentage: trade.profitPercentage,
      status: trade.status,
      isWin: trade.isWin,
      followedSignal: trade.followedSignal,
      adminSignal: trade.adminSignal,
      startTime: trade.startTime,
      endTime: trade.endTime,
      duration: trade.duration,
      createdAt: trade.createdAt,
      marketData: trade.marketData
    }));

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching order records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get order statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await Trade.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          activeOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalProfit: { $sum: '$profitLoss' },
          totalAmount: { $sum: '$amount' },
          winningOrders: {
            $sum: { $cond: ['$isWin', 1, 0] }
          },
          followedSignals: {
            $sum: { $cond: ['$followedSignal', 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      pendingOrders: 0,
      totalProfit: 0,
      totalAmount: 0,
      winningOrders: 0,
      followedSignals: 0
    };

    // Calculate percentages
    const winRate = result.completedOrders > 0 ? 
      (result.winningOrders / result.completedOrders) * 100 : 0;
    
    const signalFollowRate = result.totalOrders > 0 ? 
      (result.followedSignals / result.totalOrders) * 100 : 0;

    res.json({
      ...result,
      winRate: parseFloat(winRate.toFixed(2)),
      signalFollowRate: parseFloat(signalFollowRate.toFixed(2)),
      averageProfit: result.completedOrders > 0 ? 
        parseFloat((result.totalProfit / result.completedOrders).toFixed(2)) : 0,
      roi: result.totalAmount > 0 ? 
        parseFloat(((result.totalProfit / result.totalAmount) * 100).toFixed(2)) : 0
    });

  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent orders (last 10)
router.get('/recent', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const recentOrders = await Trade.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('symbol tradeType amount profitLoss status isWin createdAt')
      .lean();

    res.json(recentOrders);

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel an active order
router.put('/cancel/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const trade = await Trade.findOne({ 
      _id: orderId, 
      userId: userId,
      status: { $in: ['pending', 'active'] }
    });

    if (!trade) {
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    // Cancel the trade
    trade.status = 'cancelled';
    await trade.save();

    // Refund the amount to user
    const user = await User.findById(userId);
    user.balance += trade.amount;
    await user.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      refundedAmount: trade.amount,
      newBalance: user.balance
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEST ENDPOINT - Create sample trade for testing (remove in production)
router.post('/create-test-trade', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const testTrade = new Trade({
      userId: new mongoose.Types.ObjectId(userId),
      symbol: 'BTC/USDT',
      tradeType: 'Call',
      amount: 1000,
      entryPrice: 43250.50,
      exitPrice: 43890.25,
      adminSignal: 'Call',
      followedSignal: true,
      profitLoss: 60,
      profitPercentage: 6,
      status: 'completed',
      isWin: true,
      marketData: {
        volume24h: 28000000000,
        marketCap: 850000000000,
        rank: 1,
        priceChange24h: 2.5
      }
    });

    await testTrade.save();
    
    res.json({ 
      success: true, 
      message: 'Test trade created successfully',
      trade: testTrade 
    });
  } catch (error) {
    console.error('Error creating test trade:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
