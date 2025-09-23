import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true
  },
  tradeType: {
    type: String,
    enum: ['Call', 'Put'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 600 // Minimum trade amount
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number,
    default: null
  },
  adminSignal: {
    type: String,
    enum: ['Call', 'Put'],
    required: true
  },
  followedSignal: {
    type: Boolean,
    required: true
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  duration: {
    type: Number,
    default: 300000 // 5 minutes in milliseconds
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  isWin: {
    type: Boolean,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  transactionId: {
    type: String
  },
  gatewayUsed: {
    type: String,
    enum: ['qeawapay', 'watchglb']
  },
  marketData: {
    volume24h: Number,
    marketCap: Number,
    rank: Number,
    priceChange24h: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate end time before saving
tradeSchema.pre('save', function(next) {
  if (this.isNew && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration);
  }
  this.updatedAt = new Date();
  next();
});

// Method to calculate profit/loss
tradeSchema.methods.calculateResult = function(currentPrice) {
  if (!this.exitPrice) {
    this.exitPrice = currentPrice;
  }

  const priceMovement = ((this.exitPrice - this.entryPrice) / this.entryPrice) * 100;
  
  // Determine if trade was correct
  let isCorrectPrediction = false;
  if (this.tradeType === 'Call' && this.exitPrice > this.entryPrice) {
    isCorrectPrediction = true;
  } else if (this.tradeType === 'Put' && this.exitPrice < this.entryPrice) {
    isCorrectPrediction = true;
  }

  this.isWin = isCorrectPrediction;

  // Calculate profit/loss based on signal following
  if (this.followedSignal) {
    if (isCorrectPrediction) {
      // Followed admin signal and was correct - 6% profit
      this.profitLoss = this.amount * 0.06;
      this.profitPercentage = 6;
    } else {
      // Followed admin signal but was wrong - 30% loss
      this.profitLoss = -this.amount * 0.30;
      this.profitPercentage = -30;
    }
  } else {
    // Didn't follow admin signal - automatic 30% penalty
    this.profitLoss = -this.amount * 0.30;
    this.profitPercentage = -30;
  }

  this.status = 'completed';
  return this.profitLoss;
};

// Static method to get user's trade statistics
tradeSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        totalProfit: { $sum: '$profitLoss' },
        winningTrades: { $sum: { $cond: ['$isWin', 1, 0] } },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalTrades: 0,
      totalProfit: 0,
      winRate: 0,
      totalAmount: 0
    };
  }

  const result = stats[0];
  return {
    totalTrades: result.totalTrades,
    totalProfit: result.totalProfit,
    winRate: (result.winningTrades / result.totalTrades) * 100,
    totalAmount: result.totalAmount
  };
};

export default mongoose.model('Trade', tradeSchema);
