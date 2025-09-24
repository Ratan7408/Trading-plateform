import express from 'express';
import axios from 'axios';
import qs from 'qs';
import { signParams } from '../utils/sign.js';

const router = express.Router();

const BASE_URL = process.env.WATCHGLB_BASE_URL || 'https://api.watchglb.com';
const MCH_ID = process.env.WATCHGLB_MERCHANT_ID;
const DEPOSIT_KEY = process.env.WATCHGLB_DEPOSIT_KEY;
const CALLBACK_URL = process.env.WATCHGLB_CALLBACK_URL;
const RETURN_URL = process.env.WATCHGLB_RETURN_URL;

// Methods with pay_type mapping
const METHODS = [
  { method: 'upi', label: 'India UPI', payType: process.env.WATCHGLB_PAYTYPE_UPI || '105' },
  { method: 'paytm', label: 'India Paytm', payType: process.env.WATCHGLB_PAYTYPE_BANK || '101' },
  { method: 'usdt', label: 'USDT (Crypto)', payType: process.env.WATCHGLB_PAYTYPE_USDT || '700' },
  { method: 'pix', label: 'Brazil PIX', payType: process.env.WATCHGLB_PAYTYPE_PIX || '600' },
  { method: 'momo', label: 'Vietnam MOMO', payType: process.env.WATCHGLB_PAYTYPE_MOMO || '003' }
];

// 🔹 Bank codes / channel list by method
const WATCHGLB_BANKS = {
  upi: [
    { code: 'IDPT0001', label: 'Canara Bank' },
    { code: 'IDPT0002', label: 'HDFC Bank' },
    { code: 'IDPT0003', label: 'ICICI Bank' },
    { code: 'IDPT0004', label: 'State Bank of India' }
  ],
  paytm: [
    { code: 'PAYTM', label: 'Paytm Wallet' }
  ],
  pix: [
    { code: 'PIX', label: 'Brazil PIX' }
  ],
  momo: [
    { code: 'MOMO', label: 'MoMo Wallet (Vietnam)' }
  ],
  usdt: [
    { code: 'TRC20', label: 'USDT TRC20' },
    { code: 'ERC20', label: 'USDT ERC20' }
  ],
  bank_transfer: [
    { code: 'IDPT0001', label: 'Canara Bank' },
    { code: 'IDPT0002', label: 'HDFC Bank' },
    { code: 'IDPT0003', label: 'ICICI Bank' },
    { code: 'IDPT0004', label: 'State Bank of India' }
  ]
};

// signer moved to utils/sign.js

router.post('/create', async (req, res) => {
  try {
    console.log("📥 Raw req.body:", req.body);
    const { amount, paymentMethod, subject, bankCode } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'amount and paymentMethod are required' });
    }

    const method = METHODS.find(m => m.method === paymentMethod);
    if (!method) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    // 🔧 Debug envs before building params
    console.log("🔧 MCH_ID from env:", process.env.WATCHGLB_MERCHANT_ID);
    console.log("🔧 CALLBACK_URL from env:", process.env.WATCHGLB_CALLBACK_URL);
    console.log("🔧 RETURN_URL from env:", process.env.WATCHGLB_RETURN_URL);
    console.log("🔧 DEPOSIT_KEY length:", process.env.WATCHGLB_DEPOSIT_KEY?.length);

    // Get default bank code if none provided
    const getDefaultBankCode = (paymentMethod) => {
      const defaults = {
        'paytm': 'PAYTM',
        'upi': 'IDPT0001',  // Canara Bank as default
        'pix': 'PIX',
        'momo': 'MOMO',
        'usdt': 'TRC20'
      };
      return defaults[paymentMethod] || '';
    };

    const params = {
      version: '1.0',
      mch_id: process.env.WATCHGLB_MERCHANT_ID,
      mch_order_no: 'ORD' + Date.now(),
      notify_url: process.env.WATCHGLB_CALLBACK_URL,
      page_url: process.env.WATCHGLB_RETURN_URL,
      pay_type: method.payType,
      bank_code: bankCode || getDefaultBankCode(paymentMethod),
      trade_amount: amount,
      order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      goods_name: subject || 'Recharge',
      // currency removed per WatchGLB spec
      sign_type: 'MD5'
    };

    params.sign = signParams(params, process.env.WATCHGLB_DEPOSIT_KEY);

    console.log('🔧 MCH_ID:', process.env.WATCHGLB_MERCHANT_ID);
    console.log('🔐 WatchGLB request params:', params);

    const response = await axios.post(`${BASE_URL}/pay/web`, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('✅ WatchGLB response:', response.data);

    return res.json({
      success: true,
      url: response.data?.payInfo || null,
      raw: response.data
    });
  } catch (err) {
    console.error('❌ Payment create error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: 'Payment request failed',
      details: err.response?.data || err.message
    });
  }
});

// List available payment methods
router.get('/methods', (req, res) => {
  return res.json(METHODS);
});

// List banks/channels by payment method
router.get('/banks', (req, res) => {
  const method = (req.query.method || '').toLowerCase();
  if (!method || !WATCHGLB_BANKS[method]) {
    return res.json([]);
  }
  return res.json(WATCHGLB_BANKS[method]);
});

export default router;


