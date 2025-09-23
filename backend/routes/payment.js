import express from 'express';
import PaymentController, { PaymentTransaction, PayoutTransaction } from '../controllers/PaymentController.js';
import auth from '../middleware/auth.js';
import { PaymentCrypto } from '../utils/crypto.js';
import User from '../models/User.js';
import {
  paymentRateLimit,
  payoutRateLimit,
  validatePaymentRequest,
  validatePayoutRequest,
  validateOrderId,
  validateQueryParams,
  validateWebhookIP,
  logPaymentRequest,
  handlePaymentError,
  paymentSecurityHeaders,
  validatePaymentLimits
} from '../middleware/paymentMiddleware.js';

const router = express.Router();
const paymentController = new PaymentController();

// Apply security headers and logging to all payment routes
router.use(paymentSecurityHeaders);
router.use(logPaymentRequest);

// ==================== PAYMENT ROUTES ====================

/**
 * Create payment order
 * POST /api/payments/create
 */
router.post('/create', 
  auth,
  paymentRateLimit,
  validatePaymentRequest,
  validatePaymentLimits,
  async (req, res, next) => {
    console.log('💳 Incoming payment body:', req.body);
    console.log('👤 User ID from token:', req.userId);
    try {
      await paymentController.createPayment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Add a simple test route to verify routing is working
router.post('/test', (req, res) => {
  res.json({ success: true, message: 'Payment routes are working' });
});

/**
 * Query payment status
 * GET /api/payments/:orderId/status
 */
router.get('/:orderId/status',
  auth,
  validateOrderId,
  async (req, res, next) => {
    try {
      await paymentController.queryPayment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get payment history
 * GET /api/payments/history
 */
router.get('/history',
  auth,
  validateQueryParams,
  async (req, res, next) => {
    try {
      await paymentController.getPaymentHistory(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get supported payment methods
 * GET /api/payments/methods
 */
router.get('/methods',
  auth,
  async (req, res, next) => {
    try {
      await paymentController.getPaymentMethods(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Query gateway balance (for WatchGLB)
 * GET /api/payments/gateway-balance
 */
router.get('/gateway-balance',
  auth,
  async (req, res, next) => {
    try {
      const { gateway = 'watchglb' } = req.query;
      const paymentService = paymentController.getPaymentService(gateway);
      
      if (paymentService.queryBalance) {
        const result = await paymentService.queryBalance();
        res.json(result);
      } else {
        res.status(400).json({
          success: false,
          error: 'Balance query not supported for this gateway'
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// ==================== PAYOUT ROUTES ====================

/**
 * Create payout request
 * POST /api/payments/payout
 */
router.post('/payout',
  auth,
  payoutRateLimit,
  validatePayoutRequest,
  async (req, res, next) => {
    try {
      await paymentController.createPayout(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Query payout status
 * GET /api/payments/payout/:payoutId/status
 */
router.get('/payout/:payoutId/status',
  auth,
  validateOrderId,
  async (req, res, next) => {
    try {
      const { payoutId } = req.params;
      const { gateway = 'watchglb' } = req.query;
      
      const paymentService = paymentController.getPaymentService(gateway);
      
      if (paymentService.queryPayout) {
        const result = await paymentService.queryPayout(payoutId);
        res.json(result);
      } else {
        res.status(400).json({
          success: false,
          error: 'Payout query not supported for this gateway'
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// ==================== WEBHOOK ROUTES ====================


/**
 * WatchGLB payment callback
 * POST /api/payments/watchglb/callback
 */
router.post('/watchglb/callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      await paymentController.handleCallback(req, res, 'watchglb');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * WatchGLB payment callback (alternative route)
 * POST /api/payment/callback
 */
router.post('/callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      await paymentController.handleCallback(req, res, 'watchglb');
    } catch (error) {
      next(error);
    }
  }
);


/**
 * WatchGLB payout callback
 * POST /api/payments/watchglb/payout-callback
 */
router.post('/watchglb/payout-callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      const callbackData = req.body;
      
      // Handle payout status updates from WatchGLB
        // PayoutTransaction is already imported
      
      // Find the payout transaction
      const payout = await PayoutTransaction.findOne({ 
        payoutId: callbackData.payoutNumber 
      });

      if (payout) {
        payout.status = paymentController.watchglb.mapPaymentStatus(callbackData.status);
        payout.transactionId = callbackData.transactionId;
        payout.processedAt = callbackData.processedTime ? new Date(callbackData.processedTime * 1000) : new Date();
        payout.rawData = callbackData;
        await payout.save();
        
        // If payout failed, refund user balance
        if (payout.status === 'failed') {
          // User is already imported
          const user = await User.findById(payout.userId);
          if (user) {
            user.balance += payout.amount;
            await user.save();
          }
        }
      }

      res.status(200).json({ success: true, message: 'Payout callback processed' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * WatchGLB payout callback (alternative route)
 * POST /api/payment/payout-callback
 */
router.post('/payout-callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      const callbackData = req.body;
      
      // Handle payout status updates from WatchGLB
        // PayoutTransaction is already imported
      
      // Find the payout transaction
      const payout = await PayoutTransaction.findOne({ 
        payoutId: callbackData.payoutNumber 
      });

      if (payout) {
        payout.status = paymentController.watchglb.mapPaymentStatus(callbackData.status);
        payout.transactionId = callbackData.transactionId;
        payout.processedAt = callbackData.processedTime ? new Date(callbackData.processedTime * 1000) : new Date();
        payout.rawData = callbackData;
        await payout.save();
        
        // If payout failed, refund user balance
        if (payout.status === 'failed') {
          // User is already imported
          const user = await User.findById(payout.userId);
          if (user) {
            user.balance += payout.amount;
            await user.save();
          }
        }
      }

      res.status(200).json({ success: true, message: 'Payout callback processed' });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== TESTING ROUTES ====================

/**
 * Test payment creation with gateway simulation
 * POST /api/payments/test/create
 */
router.post('/test/create',
  auth,
  async (req, res, next) => {
    try {
      const { 
        amount = 500, 
        paymentMethod = 'upi', 
        bankCode = 'SBI', 
        gateway = 'watchglb',
        useRealGateway = false
      } = req.body;
      
      const userId = req.userId;
      
      // Validation
      if (!amount || amount < 100) {
        return res.status(400).json({
          success: false,
          error: 'Minimum payment amount is ₹100'
        });
      }

      // Use real gateway if requested
      if (useRealGateway) {
        req.body = {
          amount: parseFloat(amount),
          paymentMethod,
          bankCode,
          gateway,
          subject: 'Test Payment',
          description: `Test payment for ${amount} INR`
        };
        
        return await paymentController.createPayment(req, res);
      }

      // Simulate payment creation
      const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const paymentUrl = `https://api.watchpay.com/pay/web?orderNumber=${orderId}&amount=${amount}`;
      
      // Save pending transaction
        // PaymentTransaction is already imported
      const transaction = new PaymentTransaction({
        orderId: orderId,
        userId: userId,
        gateway: gateway,
        amount: parseFloat(amount),
        currency: 'INR',
        paymentUrl: paymentUrl,
        paymentMethod: paymentMethod,
        bankCode: bankCode,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          platform: 'trading',
          version: '1.0',
          testMode: true
        }
      });

      await transaction.save();

      res.json({
        success: true,
        data: {
          orderId: orderId,
          paymentUrl: paymentUrl,
          qrCode: paymentMethod === 'upi' ? `upi://pay?pa=merchant@${gateway}&pn=TradingPlatform&am=${amount}&tr=${orderId}` : null,
          amount: parseFloat(amount),
          currency: 'INR',
          expiresAt: transaction.expiresAt,
          gateway: gateway,
          testMode: true
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * Manually complete test payment
 * POST /api/payments/test/complete/:orderId
 */
router.post('/test/complete/:orderId',
  auth,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.userId;

      // Find the pending transaction
        // PaymentTransaction is already imported
      const transaction = await PaymentTransaction.findOne({ 
        orderId: orderId, 
        userId: userId,
        status: 'pending'
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found or already completed'
        });
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.paidAt = new Date();
      transaction.transactionId = `TXN_${Date.now()}`;
      transaction.updatedAt = new Date();
      await transaction.save();

      // Update user balance
      // User is already imported
      const user = await User.findById(userId);
      if (user) {
        user.balance += transaction.amount;
        user.totalDeposits += transaction.amount;
        await user.save();
      }

      res.json({
        success: true,
        data: {
          orderId: orderId,
          status: 'completed',
          amount: transaction.amount,
          newBalance: user.balance,
          transactionId: transaction.transactionId
        }
      });

    } catch (error) {
      console.error('Test payment completion error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Test webhook callback
 * POST /api/payments/test/callback/:gateway
 */
router.post('/test/callback/:gateway',
  async (req, res, next) => {
    try {
      const { gateway } = req.params;
      const { orderId = 'TEST_ORDER_123', amount = '100.00', status = 'success' } = req.body;
      
      // Mock callback data for WatchGLB
      const mockCallbackData = {
        orderNumber: orderId,
        transactionId: `TXN_${Date.now()}`,
        amount: amount,
        currency: 'INR',
        status: status,
        paidTime: Math.floor(Date.now() / 1000),
        sign: 'mock_signature'
      };

      req.body = mockCallbackData;
      
      // Add mock signature to headers
      req.headers['x-signature'] = 'mock_signature';
      
      await paymentController.handleCallback(req, res, gateway);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get payment service status
 * GET /api/payments/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      environment: process.env.NODE_ENV,
      gateways: {
        watchglb: {
          enabled: !!process.env.WATCHGLB_MERCHANT_ID,
          merchantId: process.env.WATCHGLB_MERCHANT_ID,
          baseUrl: process.env.WATCHGLB_BASE_URL || 'https://api.watchglb.com',
          documentation: 'https://www.showdoc.com.cn/WatchPay'
        }
      },
      defaultGateway: 'watchglb',
      features: {
        realGatewayIntegration: true,
        testMode: process.env.NODE_ENV === 'development',
        webhookValidation: true,
        signatureVerification: true,
        rateLimiting: true,
        logging: true
      }
    }
  });
});

/**
 * Test signature generation
 * POST /api/payments/test/signature
 */
router.post('/test/signature', (req, res) => {
  try {
    const { gateway, params, secretKey } = req.body;
    
    if (!gateway || !params || !secretKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gateway, params, secretKey'
      });
    }

    // PaymentCrypto is already imported at the top
    const signature = PaymentCrypto.generateTestSignature(gateway, params, secretKey);
    
    res.json({
      success: true,
      data: {
        gateway,
        signature,
        params,
        algorithm: 'SHA256'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * Get payment statistics (admin only)
 * GET /api/payments/admin/stats
 */
router.get('/admin/stats',
  auth,
  async (req, res, next) => {
    try {
      // Check if user is admin (you might have admin middleware)
      // User is already imported
      const user = await User.findById(req.userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      // PaymentTransaction and PayoutTransaction are already imported
      
      // Get payment statistics
      const paymentStats = await PaymentTransaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const payoutStats = await PayoutTransaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Get gateway distribution
      const gatewayStats = await PaymentTransaction.aggregate([
        {
          $group: {
            _id: '$gateway',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          payments: paymentStats,
          payouts: payoutStats,
          gateways: gatewayStats,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// ==================== ERROR HANDLING ====================

// Handle 404 for payment routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Payment endpoint not found',
    availableEndpoints: [
      'POST /api/payments/create',
      'GET /api/payments/:orderId/status',
      'GET /api/payments/history',
      'GET /api/payments/methods',
      'POST /api/payments/payout',
      'POST /api/payments/watchglb/callback'
    ]
  });
});

// Error handling middleware (must be last)
router.use(handlePaymentError);

export default router;