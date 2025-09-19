import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    trim: true
  },
  percentageAmount: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  buyAmount: {
    type: Number,
    required: true,
    min: 0
  },
  putAmount: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('AdminSettings', adminSettingsSchema);
