import WatchGLBService from '../services/WatchGLBService.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Payment Controller
 * Handles payment operations for both gateways
 */

// Payment Transaction Model
const paymentTransactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gateway: { type: String, enum: ['watchglb'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  transactionId: String,
  paymentUrl: String,
  qrCode: String,
  paymentMethod: String,
  bankCode: String,
  expiresAt: Date,
  paidAt: Date,
  failureReason: String,
  rawData: mongoose.Schema.Types.Mixed,
  metadata: {
    userAgent: String,
    ip: String,
    platform: String,
    version: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

// Payout Transaction Model
const payoutTransactionSchema = new mongoose.Schema({
  payoutId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gateway: { type: String, enum: ['watchglb'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: String,
  accountName: String,
  accountNumber: String,
  bankCode: String,
  ifscCode: String,
  mobile: String,
  email: String,
  processedAt: Date,
  failureReason: String,
  estimatedTime: String,
  rawData: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PayoutTransaction = mongoose.model('PayoutTransaction', payoutTransactionSchema);

export class PaymentController {
  constructor() {
    this.watchglb = null; // Lazy load the service
    this.defaultGateway = 'watchglb';
  }

  /**
   * Get payment service by gateway name
   */
  getPaymentService(gateway = this.defaultGateway) {
    if (gateway.toLowerCase() === 'watchglb') {
      if (!this.watchglb) {
        console.log('🔄 Lazy loading WatchGLB service...');
        this.watchglb = new WatchGLBService();
      }
      return this.watchglb;
    }
    throw new Error(`Unsupported payment gateway: ${gateway}. Only WatchGLB is supported.`);
  }

  /**
   * Create payment order
   */
  async createPayment(req, res) {
    try {
      console.log('💳 Incoming payment request body:', req.body);
      console.log('👤 User ID from request:', req.userId);
      console.log('🔑 Authorization header:', req.headers.authorization);
      const { amount, currency, subject, description, paymentMethod, bankCode, gateway, payType } = req.body;
      const userId = req.userId;

      // Validation
      console.log('🔍 Validating payment request:', {
        amount: amount,
        paymentMethod: paymentMethod,
        bankCode: bankCode,
        gateway: gateway,
        userId: userId
      });

      if (!amount || amount < 100) {
        console.log('❌ Amount validation failed:', { amount });
        return res.status(400).json({
          success: false,
          error: 'Minimum payment amount is ₹100',
          received: { amount }
        });
      }

      if (!paymentMethod) {
        console.log('❌ Payment method validation failed:', { paymentMethod });
        return res.status(400).json({
          success: false,
          error: 'Payment method is required',
          received: { paymentMethod }
        });
      }

      if (paymentMethod === 'bank_transfer' && !bankCode) {
        console.log('❌ Bank code validation failed for bank transfer');
        return res.status(400).json({
          success: false,
          error: 'Bank code is required for bank transfer',
          received: { paymentMethod, bankCode }
        });
      }

      if (!userId) {
        console.log('❌ User authentication failed:', { userId });
        return res.status(401).json({
          success: false,
          error: 'User authentication required',
          received: { userId }
        });
      }

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Select payment service
      const paymentService = this.getPaymentService(gateway);
      
      // Prepare payment data
      const paymentData = {
        amount: parseFloat(amount),
        currency: currency || 'INR',
        subject: subject || 'Trading Platform Recharge',
        description: description || `Recharge for ${amount} INR`,
        paymentMethod: paymentMethod || 'upi',
        payType: payType, // optional explicit WatchGLB pay_type
        bankCode: paymentMethod === 'bank_transfer' ? (bankCode || '') : undefined,
        userId: userId,
        userName: user.username,
        userEmail: user.email || '',
        userPhone: user.phone || '',
        customerIP: req.ip || req.connection.remoteAddress
      };

      // Create payment with selected gateway
      console.log('💳 Calling payment service with data:', paymentData);
      const result = await paymentService.createPayment(paymentData);
      console.log('💳 Payment service result:', result);

      if (result.success) {
        // Save transaction to database
        const transaction = new PaymentTransaction({
          orderId: result.orderId,
          userId: userId,
          gateway: gateway || this.defaultGateway,
          amount: result.amount,
          currency: result.currency,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
          transactionId: result.transactionId,
          paymentMethod: paymentMethod,
          bankCode: bankCode,
          expiresAt: result.expiresAt,
          metadata: {
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            platform: 'trading',
            version: '1.0'
          }
        });

        await transaction.save();

        logger.info('Payment order created and saved', {
          orderId: result.orderId,
          userId: userId,
          amount: result.amount,
          gateway: gateway || this.defaultGateway
        });

        res.json({
          success: true,
          data: {
            orderId: result.orderId,
            paymentUrl: result.paymentUrl,
            qrCode: result.qrCode,
            amount: result.amount,
            currency: result.currency,
            expiresAt: result.expiresAt,
            gateway: gateway || this.defaultGateway
          }
        });

      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code
        });
      }

    } catch (error) {
      logger.error('Payment creation failed', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Query payment status
   */
  async queryPayment(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.userId;

      // Find transaction in database
      const transaction = await PaymentTransaction.findOne({ orderId, userId });
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Check if this is a test transaction
      const isTestTransaction = transaction.metadata?.testMode === true || orderId.startsWith('TEST_');

      // For test transactions, return the current database status
      if (isTestTransaction) {
        logger.info('Test payment status query', {
          orderId,
          currentStatus: transaction.status,
          isTestMode: true
        });

        return res.json({
          success: true,
          data: {
            orderId: transaction.orderId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionId: transaction.transactionId,
            paidAt: transaction.paidAt,
            gateway: transaction.gateway,
            isTestMode: true
          }
        });
      }

      // For real transactions, query from gateway
      try {
        const paymentService = this.getPaymentService(transaction.gateway);
        const result = await paymentService.queryPayment(orderId);

        if (result.success) {
          // Update transaction status
          const oldStatus = transaction.status;
          transaction.status = result.status;
          transaction.transactionId = result.transactionId || transaction.transactionId;
          transaction.paidAt = result.paidAt;
          transaction.updatedAt = new Date();
          
          await transaction.save();

          // If payment completed and wasn't already completed, update user balance
          if (result.status === 'completed' && oldStatus !== 'completed') {
            const user = await User.findById(userId);
            if (user) {
              user.balance += transaction.amount;
              user.totalDeposits += transaction.amount;
              await user.save();

              logger.info('User balance updated after payment', {
                userId: userId,
                amount: transaction.amount,
                newBalance: user.balance,
                orderId: orderId
              });
            }
          }

          res.json({
            success: true,
            data: {
              orderId: result.orderId,
              status: result.status,
              amount: result.amount,
              currency: result.currency,
              transactionId: result.transactionId,
              paidAt: result.paidAt,
              gateway: transaction.gateway
            }
          });

        } else {
          // If gateway query fails, return database status
          logger.warn('Gateway query failed, returning database status', {
            orderId,
            gatewayError: result.error,
            databaseStatus: transaction.status
          });

          res.json({
            success: true,
            data: {
              orderId: transaction.orderId,
              status: transaction.status,
              amount: transaction.amount,
              currency: transaction.currency,
              transactionId: transaction.transactionId,
              paidAt: transaction.paidAt,
              gateway: transaction.gateway,
              note: 'Gateway query failed, showing database status'
            }
          });
        }

      } catch (gatewayError) {
        // If gateway error, return database status
        logger.error('Gateway query error, returning database status', gatewayError);
        
        res.json({
          success: true,
          data: {
            orderId: transaction.orderId,
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionId: transaction.transactionId,
            paidAt: transaction.paidAt,
            gateway: transaction.gateway,
            note: 'Gateway temporarily unavailable'
          }
        });
      }

    } catch (error) {
      logger.error('Payment query failed', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user payment history
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, limit = 10, status } = req.query;

      const query = { userId };
      if (status) {
        query.status = status;
      }

      const transactions = await PaymentTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-rawData -metadata')
        .lean();

      const total = await PaymentTransaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalTransactions: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Payment history query failed', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Create payout request
   */
  async createPayout(req, res) {
    try {
      const { 
        amount, 
        currency, 
        accountName, 
        accountNumber, 
        bankCode, 
        ifscCode, 
        mobile, 
        email, 
        gateway 
      } = req.body;
      const userId = req.userId;

      // Validation
      if (!amount || amount < 500) {
        return res.status(400).json({
          success: false,
          error: 'Minimum payout amount is ₹500'
        });
      }

      // Get user and check balance
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
      }

      // Select payment service
      const paymentService = this.getPaymentService(gateway);
      
      // Prepare payout data
      const payoutData = {
        amount: parseFloat(amount),
        currency: currency || 'INR',
        accountName,
        accountNumber,
        bankCode,
        ifscCode,
        mobile: mobile || user.phone,
        email: email || user.email,
        userId: userId
      };

      // Create payout with selected gateway
      const result = await paymentService.createPayout(payoutData);

      if (result.success) {
        // Deduct amount from user balance
        user.balance -= amount;
        await user.save();

        // Save payout transaction
        const payout = new PayoutTransaction({
          payoutId: result.payoutId,
          userId: userId,
          gateway: gateway || this.defaultGateway,
          amount: result.amount,
          currency: result.currency,
          accountName,
          accountNumber,
          bankCode,
          ifscCode,
          mobile,
          email,
          transactionId: result.transactionId,
          estimatedTime: result.estimatedTime
        });

        await payout.save();

        logger.info('Payout created and balance deducted', {
          payoutId: result.payoutId,
          userId: userId,
          amount: result.amount,
          newBalance: user.balance,
          gateway: gateway || this.defaultGateway
        });

        res.json({
          success: true,
          data: {
            payoutId: result.payoutId,
            amount: result.amount,
            currency: result.currency,
            status: result.status,
            estimatedTime: result.estimatedTime,
            newBalance: user.balance
          }
        });

      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code
        });
      }

    } catch (error) {
      logger.error('Payout creation failed', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get supported payment methods
   */
  async getPaymentMethods(req, res) {
    try {
      const { gateway } = req.query;
      const paymentService = this.getPaymentService(gateway);
      
      const methods = paymentService.getPaymentMethods();
      const banks = paymentService.getSupportedBanks();

      res.json({
        success: true,
        data: {
          methods,
          banks,
          gateway: gateway || this.defaultGateway
        }
      });

    } catch (error) {
      logger.error('Failed to get payment methods', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle payment callback (webhook)
   */
  async handleCallback(req, res, gateway) {
    try {
      const callbackData = req.body;
      const signature = req.headers['x-signature'] || req.body.signature || req.body.sign;
      
      logger.info('Payment callback received', {
        gateway,
        orderId: callbackData.order_id || callbackData.orderNumber,
        ip: req.ip
      });

      // Process callback with appropriate service
      const paymentService = this.getPaymentService(gateway);
      const result = await paymentService.processCallback(callbackData, signature);

      if (result.success) {
        // Update transaction in database
        const transaction = await PaymentTransaction.findOne({ 
          orderId: result.data.orderId 
        });

        if (transaction) {
          transaction.status = result.data.status;
          transaction.transactionId = result.data.transactionId;
          transaction.paidAt = result.data.paidAt;
          transaction.rawData = result.data.rawData;
          transaction.updatedAt = new Date();

          await transaction.save();

          // Update user balance if payment completed
          if (result.data.status === 'completed' && transaction.status !== 'completed') {
            const user = await User.findById(transaction.userId);
            if (user) {
              user.balance += transaction.amount;
              await user.save();

              logger.info('User balance updated via callback', {
                userId: transaction.userId,
                amount: transaction.amount,
                orderId: result.data.orderId
              });
            }
          }
        }

        // Return success response to gateway
        res.status(200).json({ success: true, message: 'OK' });

      } else {
        logger.warn('Callback processing failed', {
          gateway,
          error: result.error
        });

        res.status(400).json({ success: false, error: result.error });
      }

    } catch (error) {
      logger.error('Callback handling failed', error, gateway);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export { PaymentTransaction, PayoutTransaction };
export default PaymentController;
