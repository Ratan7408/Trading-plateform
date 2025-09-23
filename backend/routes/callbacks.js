import express from 'express';
import { signParams } from '../utils/sign.js';

const router = express.Router();

const DEPOSIT_KEY = process.env.WATCHGLB_DEPOSIT_KEY;
const PAYOUT_KEY = process.env.WATCHGLB_PAYOUT_KEY;
const ALLOWED_IP = process.env.WATCHGLB_NOTIFY_IP || '18.141.88.123';

function validateIp(req) {
  const sourceIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  return ALLOWED_IP ? String(sourceIp).includes(ALLOWED_IP) : true;
}

// Payment callback
router.post('/callback', express.urlencoded({ extended: false }), (req, res) => {
  const data = req.body;
  console.log('📥 Payment Callback:', data);

  if (!validateIp(req)) {
    console.warn('❌ Invalid IP for payment callback');
    return res.status(403).send('forbidden');
  }

  const expectedSign = signParams(data, DEPOSIT_KEY);
  if (expectedSign !== data.sign) {
    console.warn('❌ Invalid signature in payment callback');
    return res.status(400).send('invalid sign');
  }

  if (data.tradeResult === '1') {
    console.log('✅ Payment success:', data.mchOrderNo || data.orderNo || data.orderNumber);
    // TODO: mark order as paid in DB
  }

  return res.send('success');
});

// Payout callback
router.post('/payout-callback', express.urlencoded({ extended: false }), (req, res) => {
  const data = req.body;
  console.log('📥 Payout Callback:', data);

  if (!validateIp(req)) {
    console.warn('❌ Invalid IP for payout callback');
    return res.status(403).send('forbidden');
  }

  const expectedSign = signParams(data, PAYOUT_KEY);
  if (expectedSign !== data.sign) {
    console.warn('❌ Invalid signature in payout callback');
    return res.status(400).send('invalid sign');
  }

  if (data.tradeResult === '1') {
    console.log('✅ Payout success:', data.merTransferId || data.mch_transferId);
    // TODO: mark payout as completed in DB
  } else {
    console.log('❌ Payout failed:', data);
  }

  return res.send('success');
});

export default router;


