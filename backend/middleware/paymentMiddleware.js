import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Payment Middleware
 * Handles validation, rate limiting, and security for payment operations
 */

// Rate limiting for payment operations
export const paymentRateLimit = rateLimit({
  windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX_REQUESTS) || 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many payment requests. Please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Payment rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      userAgent: req.headers['user-agent']
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiting for payout operations (stricter)
export const payoutRateLimit = rateLimit({
  windowMs: parseInt(process.env.PAYOUT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.PAYOUT_RATE_LIMIT_MAX_REQUESTS) || 3, // 3 requests per hour
  message: {
    success: false,
    error: 'Too many payout requests. Please try again later.',
    retryAfter: 60 * 60 // 1 hour in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Payout rate limit exceeded', {
      ip: req.ip,
      userId: req.userId,
      userAgent: req.headers['user-agent']
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many payout requests. Please try again later.',
      retryAfter: 60 * 60
    });
  }
});

// Validate payment request
export const validatePaymentRequest = [
  (req, res, next) => {
    console.log('🔍 Payment validation middleware - Request body:', req.body);
    next();
  },
  body('amount')
    .isFloat({ min: 100, max: 500000 })
    .withMessage('Amount must be between ₹100 and ₹500,000')
    .customSanitizer(value => parseFloat(value)),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  
  body('paymentMethod')
    .isIn(['bank_transfer', 'upi', 'wallet', 'netbanking'])
    .withMessage('Invalid payment method'),
  
  // bankCode is required only for bank_transfer; ignored for others
  body('bankCode')
    .if(body('paymentMethod').equals('bank_transfer'))
    .notEmpty()
    .withMessage('Bank code is required for bank transfer')
    .bail()
    .isAlphanumeric()
    .isLength({ min: 2, max: 10 })
    .withMessage('Invalid bank code'),

  body('bankCode')
    .if(body('paymentMethod').not().equals('bank_transfer'))
    .optional({ nullable: true, checkFalsy: true }),
  
  body('gateway')
    .optional()
    .isIn(['watchglb'])
    .withMessage('Invalid payment gateway. Only WatchGLB is supported.'),
  
  body('subject')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 200 })
    .trim()
    .escape(),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Payment validation failed:', errors.array());
      logger.warn('Payment validation failed', {
        errors: errors.array(),
        userId: req.userId,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    console.log('✅ Payment validation passed');
    next();
  }
];

// Validate payout request
export const validatePayoutRequest = [
  body('amount')
    .isFloat({ min: 500, max: 100000 })
    .withMessage('Amount must be between ₹500 and ₹100,000')
    .customSanitizer(value => parseFloat(value)),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  
  body('accountName')
    .isLength({ min: 2, max: 50 })
    .trim()
    .escape()
    .withMessage('Account name must be 2-50 characters'),
  
  body('accountNumber')
    .isNumeric()
    .isLength({ min: 9, max: 18 })
    .withMessage('Account number must be 9-18 digits'),
  
  body('bankCode')
    .isAlphanumeric()
    .isLength({ min: 2, max: 10 })
    .withMessage('Invalid bank code'),
  
  body('ifscCode')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format (e.g., SBIN0001234)'),
  
  body('mobile')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid mobile number'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  body('gateway')
    .optional()
    .isIn(['watchglb'])
    .withMessage('Invalid payment gateway. Only WatchGLB is supported.'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Payout validation failed', {
        errors: errors.array(),
        userId: req.userId,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate order ID parameter
export const validateOrderId = [
  param('orderId')
    .isLength({ min: 10, max: 50 })
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('Invalid order ID format'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Order ID validation failed:', {
        orderId: req.params.orderId,
        errors: errors.array()
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate query parameters
export const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .toInt()
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'])
    .withMessage('Invalid status filter'),
  
  query('gateway')
    .optional()
    .isIn(['watchglb'])
    .withMessage('Invalid gateway filter. Only WatchGLB is supported.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: errors.array()
      });
    }
    next();
  }
];

// Validate webhook IP addresses
export const validateWebhookIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const forwardedIP = req.headers['x-forwarded-for'];
  
  // Get allowed IPs from environment variable
  const allowedIPs = process.env.WEBHOOK_IP_WHITELIST 
    ? process.env.WEBHOOK_IP_WHITELIST.split(',').map(ip => ip.trim())
    : ['127.0.0.1', '::1', '182.69.146.75']; // Default to localhost and user IP
  
  // Check if client IP is in whitelist
  const isAllowed = allowedIPs.some(allowedIP => {
    return clientIP.includes(allowedIP) || (forwardedIP && forwardedIP.includes(allowedIP));
  });
  
  // In development, allow all IPs
  if (process.env.NODE_ENV === 'development') {
    logger.info('Webhook received (development mode)', {
      clientIP,
      forwardedIP,
      userAgent: req.headers['user-agent']
    });
    return next();
  }
  
  if (!isAllowed) {
    logger.warn('Webhook from unauthorized IP', {
      clientIP,
      forwardedIP,
      allowedIPs,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(403).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  logger.info('Webhook IP validated', {
    clientIP,
    forwardedIP
  });
  
  next();
};

// Log payment requests
export const logPaymentRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Payment request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.userId,
    body: req.method === 'POST' ? { ...req.body, sign: '[REDACTED]', signature: '[REDACTED]' } : undefined
  });
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - startTime;
    
    logger.info('Payment response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: body?.success,
      error: body?.error
    });
    
    return originalJson.call(this, body);
  };
  
  next();
};

// Handle payment errors
export const handlePaymentError = (error, req, res, next) => {
  logger.error('Payment operation error', error, req.url);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid data format'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate transaction'
    });
  }
  
  // Handle network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Payment gateway temporarily unavailable'
    });
  }
  
  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      error: 'Payment request timeout'
    });
  }
  
  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

// Security headers for payment routes
export const paymentSecurityHeaders = (req, res, next) => {
  // Prevent caching of payment pages
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });
  
  next();
};

// Validate payment amount based on user VIP level
export const validatePaymentLimits = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;
    
    // Get user from database to check VIP level
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Define limits based on VIP level
    const vipLimits = {
      'VIP0': { min: 100, max: 10000 },
      'VIP1': { min: 100, max: 25000 },
      'VIP2': { min: 100, max: 50000 },
      'VIP3': { min: 100, max: 100000 },
      'VIP4': { min: 100, max: 250000 },
      'VIP5': { min: 100, max: 500000 }
    };
    
    const limits = vipLimits[user.vipLevel] || vipLimits['VIP0'];
    
    if (amount < limits.min || amount > limits.max) {
      return res.status(400).json({
        success: false,
        error: `Payment amount must be between ₹${limits.min} and ₹${limits.max} for ${user.vipLevel} users`,
        limits: limits
      });
    }
    
    next();
  } catch (error) {
    logger.error('Payment limit validation error', error);
    next(); // Continue with default limits if validation fails
  }
};

export default {
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
};