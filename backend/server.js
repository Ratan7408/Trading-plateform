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
import paymentRoutes from './routes/payment.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/payments', paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Trading Platform Backend API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
