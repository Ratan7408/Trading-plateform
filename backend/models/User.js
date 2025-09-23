import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  vipLevel: {
    type: String,
    default: 'VIP0'
  },
  inviteCode: {
    type: String,
    unique: true
  },
  balance: {
    type: Number,
    default: 1000 // Starting balance ₹1000
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  paymentSettings: {
    preferredGateway: {
      type: String,
      enum: ['qeawapay', 'watchglb'],
      default: 'qeawapay'
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet', 'netbanking'],
      default: 'bank_transfer'
    }
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  trades: [{
    symbol: String,
    signal: String,
    amount: Number,
    adminSignal: String,
    followedSignal: Boolean,
    profitLoss: Number,
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate invite code
userSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
