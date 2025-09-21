import express from 'express';
import PaymentController from '../controllers/PaymentController.js';
import auth from '../middleware/auth.js';
import {
  paymentRateLimit,
  payoutRateLimit,
  validatePaymentRequest,
  validatePayoutRequest,
  validateOrderId,
  validateQueryParams,
  validateWebhookIP,
  logPaymentRequest,
  handlePaymentError
} from '../middleware/paymentMiddleware.js';

const router = express.Router();
const paymentController = new PaymentController();

// Apply logging to all payment routes
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
  async (req, res, next) => {
    try {
      await paymentController.createPayment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

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
      const paymentController = new PaymentController();
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

// ==================== WEBHOOK ROUTES ====================

/**
 * Qeawapay payment callback
 * POST /api/payments/qeawapay/callback
 */
router.post('/qeawapay/callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      await paymentController.handleCallback(req, res, 'qeawapay');
    } catch (error) {
      next(error);
    }
  }
);

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
 * Qeawapay payout callback
 * POST /api/payments/qeawapay/payout-callback
 */
router.post('/qeawapay/payout-callback',
  validateWebhookIP,
  async (req, res, next) => {
    try {
      // Handle payout status updates from Qeawapay
      // Similar to payment callback but for payouts
      res.status(200).json({ success: true, message: 'Payout callback received' });
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
      // Handle payout status updates from WatchGLB
      res.status(200).json({ success: true, message: 'Payout callback received' });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== TESTING ROUTES (Development Only) ====================

// Debug endpoint (no auth required)
router.get('/debug/status', (req, res) => {
  res.json({
    success: true,
    message: 'Payment routes are working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Always enable test routes for now
if (true) { // process.env.NODE_ENV === 'development'
  
  /**
   * Test payment creation with real gateway simulation
   * POST /api/payments/test/create
   */
  router.post('/test/create',
    auth,
    async (req, res, next) => {
      try {
        const { amount = 500, paymentMethod = 'upi', bankCode = 'SBI', gateway = 'qeawapay' } = req.body;
        const userId = req.userId;
        
        // Basic validation
        if (!amount || amount < 100) {
          return res.status(400).json({
            success: false,
            error: 'Minimum payment amount is ₹100'
          });
        }

        const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Create realistic payment response (simulates real gateway)
        const paymentUrl = gateway === 'qeawapay' 
          ? `https://merchant.qeawapay.com/payment?order_id=${orderId}&amount=${amount}`
          : `https://api.watchglb.com/pay/web?orderNumber=${orderId}&amount=${amount}`;
        
        // Save pending transaction
        const { PaymentTransaction } = await import('../controllers/PaymentController.js');
        const transaction = new PaymentTransaction({
          orderId: orderId,
          userId: userId,
          gateway: gateway || 'qeawapay',
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
            version: '1.0'
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
            gateway: gateway || 'qeawapay'
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
        const { PaymentTransaction } = await import('../controllers/PaymentController.js');
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
        await transaction.save();

        // Update user balance
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(userId);
        if (user) {
          user.balance += transaction.amount;
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
        
        // Mock callback data
        const mockCallbackData = gateway === 'qeawapay' ? {
          order_id: 'TEST_ORDER_123',
          transaction_id: 'TXN_123456789',
          amount: '100.00',
          currency: 'INR',
          status: 'success',
          paid_at: Math.floor(Date.now() / 1000),
          signature: 'mock_signature'
        } : {
          orderNumber: 'TEST_ORDER_123',
          transactionId: 'TXN_123456789',
          amount: '100.00',
          currency: 'INR',
          status: 'success',
          paidTime: Math.floor(Date.now() / 1000),
          sign: 'mock_signature'
        };

        req.body = mockCallbackData;
        await paymentController.handleCallback(req, res, gateway);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get payment service status (no auth required for testing)
   * GET /api/payments/test/status
   */
  router.get('/test/status',
    (req, res) => {
      res.json({
        success: true,
        data: {
          environment: process.env.NODE_ENV,
          gateways: {
            qeawapay: {
              enabled: !!process.env.QEAWAPAY_MERCHANT_ID,
              sandbox: process.env.QEAWAPAY_SANDBOX === 'true',
              baseUrl: process.env.QEAWAPAY_SANDBOX === 'true' 
                ? process.env.QEAWAPAY_SANDBOX_BASE_URL 
                : process.env.QEAWAPAY_BASE_URL
            },
            watchglb: {
              enabled: !!process.env.WATCHGLB_MERCHANT_NUMBER,
              sandbox: process.env.WATCHGLB_SANDBOX === 'true',
              baseUrl: process.env.WATCHGLB_SANDBOX === 'true'
                ? process.env.WATCHGLB_SANDBOX_BASE_URL
                : process.env.WATCHGLB_BASE_URL
            }
          },
          defaultGateway: process.env.PAYMENT_GATEWAY || 'qeawapay'
        }
      });
    }
  );
}

// Error handling middleware (must be last)
router.use(handlePaymentError);

export default router;
