import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  signalType: {
    type: String,
    enum: ['Call', 'Put'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  targetPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  timeframe: {
    type: String,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
    default: '15m'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  analysis: {
    type: String,
    trim: true
  },
  technicalIndicators: {
    rsi: Number,
    macd: String, // 'bullish', 'bearish', 'neutral'
    movingAverages: String, // 'above', 'below', 'crossing'
    volume: String, // 'high', 'low', 'average'
    support: Number,
    resistance: Number
  },
  performance: {
    accuracy: {
      type: Number,
      default: 0
    },
    totalSignals: {
      type: Number,
      default: 0
    },
    successfulSignals: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update timestamp before saving
signalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Set expiration time based on timeframe
signalSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const timeframeMinutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };
    
    const minutes = timeframeMinutes[this.timeframe] || 15;
    this.expiresAt = new Date(Date.now() + (minutes * 60 * 1000));
  }
  next();
});

// Method to check if signal is expired
signalSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to update performance
signalSchema.methods.updatePerformance = function(wasSuccessful) {
  this.performance.totalSignals += 1;
  if (wasSuccessful) {
    this.performance.successfulSignals += 1;
  }
  this.performance.accuracy = (this.performance.successfulSignals / this.performance.totalSignals) * 100;
};

// Static method to get current active signal for a symbol
signalSchema.statics.getCurrentSignal = async function(symbol) {
  return this.findOne({
    symbol: symbol.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get all active signals
signalSchema.statics.getActiveSignals = async function() {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get latest signal for any symbol
signalSchema.statics.getLatestSignal = async function() {
  return this.findOne({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to expire old signals
signalSchema.statics.expireOldSignals = async function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() } },
    { isActive: false }
  );
};


export default mongoose.model('Signal', signalSchema);
