# Payment Gateway Configuration Guide

## Overview
Your trading platform now supports **real payment gateways** instead of test payments. You need to configure the environment variables for the payment gateways to work.

## Required Environment Variables

### For Qeawapay (QEPay) Gateway

#### Production Configuration
```bash
# Qeawapay Production Settings
QEAWAPAY_SANDBOX=false
QEAWAPAY_MERCHANT_ID=your_merchant_id
QEAWAPAY_COLLECTION_SECRET_KEY=your_collection_secret_key
QEAWAPAY_PAYOUT_SECRET_KEY=your_payout_secret_key

# Qeawapay URLs
QEAWAPAY_CALLBACK_URL=http://yourdomain.com/api/payments/qeawapay/callback
QEAWAPAY_RETURN_URL=http://yourdomain.com/payment/success
QEAWAPAY_CANCEL_URL=http://yourdomain.com/payment/cancel
```

#### Sandbox/Test Configuration
```bash
# Qeawapay Sandbox Settings
QEAWAPAY_SANDBOX=true
QEAWAPAY_SANDBOX_MERCHANT_ID=your_sandbox_merchant_id
QEAWAPAY_SANDBOX_COLLECTION_SECRET_KEY=your_sandbox_collection_key
QEAWAPAY_SANDBOX_PAYOUT_SECRET_KEY=your_sandbox_payout_key

# Qeawapay URLs (can use localhost for testing)
QEAWAPAY_CALLBACK_URL=http://localhost:5000/api/payments/qeawapay/callback
QEAWAPAY_RETURN_URL=http://localhost:5173/payment/success
QEAWAPAY_CANCEL_URL=http://localhost:5173/payment/cancel
```

### For WatchGLB Gateway

#### Production Configuration
```bash
# WatchGLB Production Settings
WATCHGLB_SANDBOX=false
WATCHGLB_MERCHANT_NUMBER=your_merchant_number
WATCHGLB_PAYMENT_KEY=your_payment_key
WATCHGLB_PAYOUT_KEY=your_payout_key

# WatchGLB URLs
WATCHGLB_CALLBACK_URL=http://yourdomain.com/api/payments/watchglb/callback
WATCHGLB_RETURN_URL=http://yourdomain.com/payment/success
WATCHGLB_CANCEL_URL=http://yourdomain.com/payment/cancel
```

#### Sandbox/Test Configuration
```bash
# WatchGLB Sandbox Settings
WATCHGLB_SANDBOX=true
WATCHGLB_SANDBOX_MERCHANT_NUMBER=your_sandbox_merchant_number
WATCHGLB_SANDBOX_PAYMENT_KEY=your_sandbox_payment_key
WATCHGLB_SANDBOX_PAYOUT_KEY=your_sandbox_payout_key

# WatchGLB URLs (can use localhost for testing)
WATCHGLB_CALLBACK_URL=http://localhost:5000/api/payments/watchglb/callback
WATCHGLB_RETURN_URL=http://localhost:5173/payment/success
WATCHGLB_CANCEL_URL=http://localhost:5173/payment/cancel
```

### General Configuration
```bash
# Default Payment Gateway (qeawapay or watchglb)
PAYMENT_GATEWAY=qeawapay

# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

## How to Get API Credentials

### Qeawapay (QEPay)
1. Visit: https://www.showdoc.com.cn/qepay/7093425388879009
2. Register for an account
3. Get your Merchant ID and Secret Keys
4. Configure webhook URLs in their dashboard

### WatchGLB
1. Visit: https://www.showdoc.com.cn/WatchPay (password: watchpay277)
2. Register for an account
3. Get your Merchant Number and Payment Keys
4. Configure webhook URLs in their dashboard

## Setup Steps

1. **Create .env file** in the backend directory:
   ```bash
   cd Ratan-Trading-Platform/backend
   touch .env
   ```

2. **Add your credentials** to the .env file using the configuration above

3. **Restart the server**:
   ```bash
   npm run dev
   ```

4. **Test the integration**:
   - Open the frontend
   - Try creating a payment
   - You should see real payment gateway URLs instead of test payments

## Testing

### For Development
- Use sandbox credentials (`*_SANDBOX=true`)
- Use localhost URLs for callbacks
- Test with small amounts first

### For Production
- Use production credentials (`*_SANDBOX=false`)
- Use your domain URLs for callbacks
- Ensure HTTPS is enabled

## Troubleshooting

### Common Issues

1. **"Configuration incomplete" error**
   - Check if all required environment variables are set
   - Verify merchant IDs and secret keys are correct

2. **"Authentication failed" error**
   - Verify your API credentials
   - Check if you're using sandbox vs production credentials correctly

3. **Webhook not working**
   - Ensure callback URLs are accessible from the internet
   - Check if your server is running and accessible

4. **Payment stuck in pending**
   - Check server logs for errors
   - Verify webhook endpoints are working
   - Test with sandbox credentials first

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Security Notes

1. **Never commit .env file** to version control
2. **Use HTTPS** in production
3. **Validate webhook signatures** (already implemented)
4. **Rate limit** payment requests (already implemented)
5. **Log all transactions** (already implemented)

## Support

- Qeawapay Documentation: https://www.showdoc.com.cn/qepay/7093425388879009
- WatchGLB Documentation: https://www.showdoc.com.cn/WatchPay
- Your trading platform logs: `backend/logs/payments.log`
