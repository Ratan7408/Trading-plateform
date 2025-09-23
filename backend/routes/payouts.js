import express from 'express';
import axios from 'axios';
import qs from 'qs';
import { signParams } from '../utils/sign.js';

const router = express.Router();

const BASE_URL = process.env.WATCHGLB_BASE_URL || 'https://api.watchglb.com';
const MCH_ID = process.env.WATCHGLB_MERCHANT_ID;
const PAYOUT_KEY = process.env.WATCHGLB_PAYOUT_KEY;
const PAYOUT_CALLBACK_URL = process.env.WATCHGLB_PAYOUT_CALLBACK_URL || process.env.WATCHGLB_CALLBACK_URL?.replace('/callback', '/payout-callback');

// Create payout
router.post('/create', async (req, res) => {
  try {
    const { transferId, amount, bankCode, receiveName, receiveAccount, remark } = req.body;

    const params = {
      mch_id: MCH_ID,
      mch_transferId: transferId || ('TR' + Date.now()),
      transfer_amount: amount,
      apply_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      bank_code: bankCode,
      receive_name: receiveName,
      receive_account: receiveAccount,
      remark: remark || '',
      back_url: PAYOUT_CALLBACK_URL,
      sign_type: 'MD5'
    };

    params.sign = signParams(params, PAYOUT_KEY);

    const response = await axios.post(`${BASE_URL}/pay/transfer`, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    if (data?.respCode !== 'SUCCESS') {
      return res.status(400).json({ success: false, error: data?.errorMsg || data?.tradeMsg || 'Payout failed' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Payout create error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data?.errorMsg || err.message });
  }
});

// Query payout
router.post('/query', async (req, res) => {
  try {
    const { transferId } = req.body;

    const params = {
      mch_id: MCH_ID,
      mch_transferId: transferId,
      sign_type: 'MD5'
    };

    params.sign = signParams(params, PAYOUT_KEY);

    const response = await axios.post(`${BASE_URL}/query/transfer`, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    if (data?.respCode !== 'SUCCESS') {
      return res.status(400).json({ success: false, error: data?.errorMsg || data?.tradeMsg || 'Query failed' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Payout query error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data?.errorMsg || err.message });
  }
});

// Query balance
router.post('/balance', async (req, res) => {
  try {
    const params = {
      mch_id: MCH_ID,
      sign_type: 'MD5'
    };

    params.sign = signParams(params, PAYOUT_KEY);

    const response = await axios.post(`${BASE_URL}/query/balance`, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data;
    if (data?.respCode !== 'SUCCESS') {
      return res.status(400).json({ success: false, error: data?.errorMsg || data?.tradeMsg || 'Balance query failed' });
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Balance query error:', err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data?.errorMsg || err.message });
  }
});

export default router;


