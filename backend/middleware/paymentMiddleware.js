import rateLimit from 'express-rate-limit';
import { body, validationResult, param, query } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Payment Middleware
 * Security, validation, and logging middleware for payment operations
 */

// Rate limiting for payment endpoints
export const paymentRateLimit = rateLimit({
  windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX) || 10, // 10 requests per window
  message: {
    success: false,
    error: 'Too many payment requests. Please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Payment rate limit exceeded', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      endpoint: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW) || 900000) / 1000)
    });
  }
});

// Stricter rate limiting for payout endpoints
export const payoutRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 payout requests per hour
  message: {
    success: false,
    error: 'Too many payout requests. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Payment request validation
export const validatePaymentRequest = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (parseFloat(value) < 100) {
        throw new Error('Minimum payment amount is ₹100');
      }
      if (parseFloat(value) > 500000) {
        throw new Error('Maximum payment amount is ₹500,000');
      }
      return true;
    }),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Currency must be INR, USD, or EUR'),
  
  body('paymentMethod')
    .optional()
    .isIn(['bank_transfer', 'upi', 'wallet', 'netbanking'])
    .withMessage('Invalid payment method'),
  
  body('gateway')
    .optional()
    .isIn(['qeawapay', 'watchglb'])
    .withMessage('Invalid payment gateway'),
  
  body('subject')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),

  handleValidationErrors
];

// Payout request validation
export const validatePayoutRequest = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (parseFloat(value) < 500) {
        throw new Error('Minimum payout amount is ₹500');
      }
      if (parseFloat(value) > 100000) {
        throw new Error('Maximum payout amount is ₹100,000');
      }
      return true;
    }),
  
  body('accountName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Account name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Account name must contain only letters and spaces'),
  
  body('accountNumber')
    .isLength({ min: 9, max: 18 })
    .withMessage('Account number must be between 9 and 18 digits')
    .isNumeric()
    .withMessage('Account number must contain only numbers'),
  
  body('ifscCode')
    .isLength({ min: 11, max: 11 })
    .withMessage('IFSC code must be exactly 11 characters')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format'),
  
  body('bankCode')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Bank code must be between 2 and 10 characters'),
  
  body('mobile')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Invalid mobile number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('gateway')
    .optional()
    .isIn(['qeawapay', 'watchglb'])
    .withMessage('Invalid payment gateway'),

  handleValidationErrors
];

// Order ID validation
export const validateOrderId = [
  param('orderId')
    .isLength({ min: 10, max: 50 })
    .withMessage('Invalid order ID format')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Order ID must contain only uppercase letters, numbers, and underscores'),

  handleValidationErrors
];

// Query parameters validation
export const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'])
    .withMessage('Invalid status'),
  
  query('gateway')
    .optional()
    .isIn(['qeawapay', 'watchglb'])
    .withMessage('Invalid gateway'),

  handleValidationErrors
];

// Handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    
    logger.warn('Payment validation failed', {
      errors: errorMessages,
      body: req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
}

// IP whitelist validation for webhooks
export const validateWebhookIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Define allowed IPs for each gateway
  const allowedIPs = {
    qeawapay: [
      '103.XXX.XXX.XXX', // Replace with actual Qeawapay IPs
      '104.XXX.XXX.XXX',
      '127.0.0.1', // For development
      '::1'
    ],
    watchglb: [
      '105.XXX.XXX.XXX', // Replace with actual WatchGLB IPs  
      '106.XXX.XXX.XXX',
      '127.0.0.1', // For development
      '::1'
    ]
  };
  
  // Extract gateway from path
  const gateway = req.path.includes('qeawapay') ? 'qeawapay' : 'watchglb';
  
  // Skip IP validation in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  const gatewayIPs = allowedIPs[gateway] || [];
  
  if (!gatewayIPs.includes(clientIP)) {
    logger.warn('Webhook from unauthorized IP', {
      ip: clientIP,
      gateway: gateway,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      error: 'Unauthorized IP address'
    });
  }
  
  next();
};

// Request logging middleware
export const logPaymentRequest = (req, res, next) => {
  const startTime = Date.now();
  
  logger.info('Payment request received', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.userId || 'anonymous'
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Payment request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous'
    });
  });
  
  next();
};

// Error handling middleware for payments
export const handlePaymentError = (error, req, res, next) => {
  logger.error('Payment operation failed', error, 'payment');
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: 'Payment operation failed',
    timestamp: new Date().toISOString()
  };
  
  if (isDevelopment) {
    errorResponse.details = error.message;
    errorResponse.stack = error.stack;
  }
  
  // Set appropriate status code
  let statusCode = 500;
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Invalid request data';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error = 'Authentication required';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse.error = 'Access denied';
  }
  
  res.status(statusCode).json(errorResponse);
};

// Sanitize sensitive data from logs
export const sanitizePaymentData = (data) => {
  const sensitiveFields = [
    'accountNumber', 
    'ifscCode', 
    'mobile', 
    'email', 
    'signature', 
    'sign', 
    'key',
    'secret',
    'password',
    'token'
  ];
  
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      if (field === 'accountNumber') {
        // Show only last 4 digits
        sanitized[field] = '****' + sanitized[field].slice(-4);
      } else if (field === 'mobile') {
        // Show only last 4 digits
        sanitized[field] = '****' + sanitized[field].slice(-4);
      } else if (field === 'email') {
        // Show only domain
        const [, domain] = sanitized[field].split('@');
        sanitized[field] = '****@' + domain;
      } else {
        sanitized[field] = '***REDACTED***';
      }
    }
  });
  
  return sanitized;
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
  sanitizePaymentData
};
