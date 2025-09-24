import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const DEPOSIT_KEY = process.env.WATCHGLB_DEPOSIT_KEY;
const ALLOWED_IP = process.env.WATCHGLB_NOTIFY_IP || '18.141.88.123';

function signParams(params, key) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([k, v]) => k !== 'sign' && k !== 'signType' && v !== '' && v !== null && v !== undefined)
  );

  const sortedKeys = Object.keys(filtered).sort();
  const queryString = sortedKeys.map(k => `${k}=${filtered[k]}`).join('&') + `&key=${key}`;

  return crypto.createHash('md5').update(queryString).digest('hex').toUpperCase();
}

// WatchGLB payment callback
router.post('/callback', express.urlencoded({ extended: false }), (req, res) => {
  try {
    const data = req.body;

    console.log('📥 Payment Callback Received:', data);

    // Optional: validate source IP
    const sourceIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    if (ALLOWED_IP && !String(sourceIp).includes(ALLOWED_IP)) {
      console.warn('❌ Callback rejected, invalid source IP:', sourceIp);
      return res.status(403).send('forbidden');
    }

    if (!DEPOSIT_KEY) {
      console.warn('❌ DEPOSIT_KEY not configured');
      return res.status(500).send('error');
    }

    // Verify signature
    const expectedSign = signParams(data, DEPOSIT_KEY);
    if (expectedSign !== data.sign) {
      console.warn('❌ Invalid signature in callback');
      return res.status(400).send('invalid sign');
    }

    // Check payment status
    if (data.tradeResult === '1') {
      console.log('✅ Payment success for order:', data.mchOrderNo || data.orderNumber || data.orderNo);
      // TODO: mark order as paid in DB
    } else {
      console.log('❌ Payment failed or pending:', data);
    }

    // Must return "success" or WatchGLB will retry
    return res.send('success');
  } catch (err) {
    console.error('Callback handler error:', err.message);
    return res.status(500).send('error');
  }
});

export default router;


