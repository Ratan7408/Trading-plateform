import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  tradeName: String,
  tradeSignal: String,
  oldTrade: String,
  oldSignal: String,
  profitPercentage: {
    type: Number,
    default: 6
  },
  minimumAmount: {
    type: Number,
    default: 600
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('AdminSettings', adminSettingsSchema);
