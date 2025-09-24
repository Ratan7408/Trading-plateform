import dotenv from "dotenv";
const result = dotenv.config();
console.log('🔧 Dotenv config result:', result);
console.log('✅ Environment variables loaded:');
console.log('  WATCHGLB_MERCHANT_ID:', process.env.WATCHGLB_MERCHANT_ID);
console.log('  WATCHGLB_DEPOSIT_KEY:', process.env.WATCHGLB_DEPOSIT_KEY ? 'SET' : 'MISSING');
console.log('  WATCHGLB_CALLBACK_URL:', process.env.WATCHGLB_CALLBACK_URL);

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import withdrawRoutes from './routes/withdraw.js';
import orderRoutes from './routes/order.js';
import rechargeRoutes from './routes/recharge.js';
import bankRoutes from './routes/bank.js';
import adminRoutes from './routes/admin.js';
import tradeRoutes from './routes/trade.js';
import paymentsRouter from './routes/payments.js';
import payoutsRouter from './routes/payouts.js';
import callbacksRouter from './routes/callbacks.js';
import paymentCallbackRouter from './routes/paymentCallback.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Allow requests from your frontend (both local and VPS)
app.use(cors({
  origin: [
    'http://localhost:5173',     // local development
    'http://62.72.29.193',       // VPS frontend (port 80)
    'http://62.72.29.193:5173',  // VPS frontend dev
    'http://62.72.29.193:3000'   // alternative VPS port
  ],
  credentials: true,               // allow cookies, auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log('➡️ Incoming request:', req.method, req.url);
  next();
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
      console.log('❌ MongoDB connection failed:', err.message);
      console.log('💡 To fix this:');
      console.log('   1. Install MongoDB locally, OR');
      console.log('   2. Use MongoDB Atlas (free): https://www.mongodb.com/atlas');
      console.log('   3. Update MONGODB_URI in .env file');
      process.exit(1);
    });
} else {
  console.log('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trade', tradeRoutes);
// WatchGLB payments routes
app.use('/api/payments', paymentsRouter);
app.use('/api/payment/callback', paymentCallbackRouter);
app.use('/api/payouts', payoutsRouter);
app.use('/api/payment/extra-callbacks', callbacksRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Trading Platform Backend API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
