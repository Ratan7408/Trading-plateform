import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  priceChange24h: {
    type: Number,
    default: 0
  },
  priceChangePercentage24h: {
    type: Number,
    default: 0
  },
  volume24h: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  priceHistory: [{
    price: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tradingPairs: [{
    pair: String,
    price: Number,
    volume: Number
  }],
  technicalIndicators: {
    rsi: Number,
    macd: Number,
    movingAverage20: Number,
    movingAverage50: Number,
    support: Number,
    resistance: Number
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
marketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastUpdated = new Date();
  next();
});

// Method to add price to history
marketSchema.methods.addPriceHistory = function(price) {
  this.priceHistory.push({
    price: price,
    timestamp: new Date()
  });
  
  // Keep only last 1000 entries
  if (this.priceHistory.length > 1000) {
    this.priceHistory = this.priceHistory.slice(-1000);
  }
  
  this.currentPrice = price;
};

// Method to calculate price change
marketSchema.methods.calculatePriceChange = function(previousPrice) {
  if (previousPrice && previousPrice > 0) {
    this.priceChange24h = this.currentPrice - previousPrice;
    this.priceChangePercentage24h = ((this.currentPrice - previousPrice) / previousPrice) * 100;
  }
};

// Static method to get trending markets
marketSchema.statics.getTrending = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ priceChangePercentage24h: -1 })
    .limit(limit)
    .select('symbol name currentPrice priceChangePercentage24h image');
};

// Static method to get top markets by volume
marketSchema.statics.getTopByVolume = async function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ volume24h: -1 })
    .limit(limit)
    .select('symbol name currentPrice volume24h image');
};

// Static method to get market by symbol
marketSchema.statics.getBySymbol = async function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase(), isActive: true });
};


export default mongoose.model('Market', marketSchema);
