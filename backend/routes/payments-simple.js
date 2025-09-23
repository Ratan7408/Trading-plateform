// routes/payments-simple.js - Simplified version for debugging
import express from 'express';
import WatchGLBService from '../services/WatchGLBService.js';
import auth from '../middleware/auth.js';

const router = express.Router();
let watchglbService = null; // Lazy load the service

// ==================== CREATE PAYMENT ====================
router.post('/create', auth, async (req, res) => {
  try {
    console.log('💳 Simple payment create - Request body:', req.body);
    console.log('👤 Simple payment create - User ID:', req.userId);
    console.log('🔍 Request headers:', req.headers);
    
    const { amount, paymentMethod, bankCode, gateway, payType } = req.body;
    const userId = req.userId;

    console.log('🔍 Extracted values:', {
      amount: amount,
      amountType: typeof amount,
      paymentMethod: paymentMethod,
      bankCode: bankCode,
      gateway: gateway,
      userId: userId
    });

    if (!amount || !paymentMethod) {
      console.log('❌ Validation failed - missing required fields:', { amount, paymentMethod });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: amount, paymentMethod',
        received: { amount, paymentMethod }
      });
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      console.log('❌ Validation failed - amount is not a number:', { amount, type: typeof amount });
      return res.status(400).json({ 
        success: false, 
        error: 'Amount must be a valid number',
        received: { amount, type: typeof amount }
      });
    }

    if (amount < 100) {
      console.log('❌ Validation failed - amount too low:', { amount });
      return res.status(400).json({ 
        success: false, 
        error: 'Minimum payment amount is ₹100',
        received: { amount }
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User authentication required' 
      });
    }

    const paymentData = {
      amount: parseFloat(amount),
      currency: 'INR',
      subject: 'Trading Platform Recharge',
      description: `Recharge for ${amount} INR`,
      paymentMethod,
      payType,
      bankCode: bankCode || '',
      userId,
      gateway: gateway || 'watchglb'
    };

        // Lazy load the service
        if (!watchglbService) {
          console.log('🔄 Lazy loading WatchGLB service...');
          watchglbService = new WatchGLBService();
        }
        
        console.log('💳 Calling WatchGLBService with data:', paymentData);
        const result = await watchglbService.createPayment(paymentData);
    
    console.log('💳 WatchGLBService result:', result);
    
    if (result.success) {
      res.json({ 
        success: true, 
        data: {
          orderId: result.orderId,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
          amount: result.amount,
          currency: result.currency,
          gateway: gateway || 'watchglb'
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
    console.error('❌ Error in /payments/create:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== QUERY PAYMENT STATUS ====================
router.get('/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    console.log('🔍 Querying payment status:', { orderId, userId });
    
    // For now, return a simple status
    res.json({
      success: true,
      data: {
        orderId,
        status: 'pending',
        amount: 500,
        currency: 'INR',
        gateway: 'watchglb'
      }
    });
  } catch (error) {
    console.error('❌ Error in /payments/:orderId/status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== PAYMENT HISTORY ====================
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📊 Getting payment history for user:', userId);
    
    // For now, return empty array
    res.json({
      success: true,
      data: {
        transactions: []
      }
    });
  } catch (error) {
    console.error('❌ Error in /payments/history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== CREATE PAYOUT ====================
router.post('/payout', auth, async (req, res) => {
  try {
    const { amount, accountName, accountNumber, ifscCode, bankCode, mobile, email } = req.body;
    const userId = req.userId;

    console.log('💰 Creating payout:', { amount, accountName, userId });

    if (!amount || !accountName || !accountNumber || !ifscCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required payout fields' 
      });
    }

    const payoutData = {
      amount: parseFloat(amount),
      accountName,
      accountNumber,
      ifscCode,
      bankCode: bankCode || '',
      mobile: mobile || '',
      email: email || '',
      userId
    };

        // Lazy load the service
        if (!watchglbService) {
          console.log('🔄 Lazy loading WatchGLB service...');
          watchglbService = new WatchGLBService();
        }
        
        const result = await watchglbService.createPayout(payoutData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        data: {
          payoutId: result.payoutId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          estimatedTime: result.estimatedTime
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
    console.error('❌ Error in /payments/payout:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== GET PAYMENT METHODS ====================
router.get('/methods', async (req, res) => {
  try {
    console.log('📋 Getting payment methods and banks');
    
        // Lazy load the service
        if (!watchglbService) {
          console.log('🔄 Lazy loading WatchGLB service...');
          watchglbService = new WatchGLBService();
        }
        
        const methods = watchglbService.getPaymentMethods();
        const banks = watchglbService.getSupportedBanks();

    res.json({
      success: true,
      data: { 
        methods, 
        banks,
        gateway: 'watchglb'
      }
    });
  } catch (error) {
    console.error('❌ Error in /payments/methods:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== CALLBACK HANDLERS ====================

// Payment callback
router.post('/watchglb/callback', async (req, res) => {
  try {
        console.log('🔄 WatchGLB payment callback received:', req.body);
        
        // Lazy load the service
        if (!watchglbService) {
          console.log('🔄 Lazy loading WatchGLB service...');
          watchglbService = new WatchGLBService();
        }
        
        const callbackData = req.body;
        const result = await watchglbService.processCallback(callbackData, callbackData.sign);

    if (result.success) {
      console.log('✅ Payment callback processed successfully');
      return res.send('SUCCESS');
    } else {
      console.log('❌ Payment callback processing failed:', result.error);
      return res.send('FAIL');
    }
  } catch (error) {
    console.error('❌ Payment callback error:', error);
    res.send('FAIL');
  }
});

// Payout callback
router.post('/watchglb/payout-callback', async (req, res) => {
  try {
        console.log('🔄 WatchGLB payout callback received:', req.body);
        
        // Lazy load the service
        if (!watchglbService) {
          console.log('🔄 Lazy loading WatchGLB service...');
          watchglbService = new WatchGLBService();
        }
        
        const callbackData = req.body;
        const result = await watchglbService.processCallback(callbackData, callbackData.sign);

    if (result.success) {
      console.log('✅ Payout callback processed successfully');
      return res.send('SUCCESS');
    } else {
      console.log('❌ Payout callback processing failed:', result.error);
      return res.send('FAIL');
    }
  } catch (error) {
    console.error('❌ Payout callback error:', error);
    res.send('FAIL');
  }
});

export default router;
