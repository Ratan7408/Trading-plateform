import crypto from 'crypto';

export function signParams(params, key) {
  const stringToSign =
    `version=${params.version}` +
    `&mch_id=${params.mch_id}` +
    `&mch_order_no=${params.mch_order_no}` +
    `&order_date=${params.order_date}` +
    `&trade_amount=${params.trade_amount}` +
    `&goods_name=${encodeURIComponent(params.goods_name)}` +
    `&notify_url=${params.notify_url}` +
    `&page_url=${params.page_url}` +
    `&pay_type=${params.pay_type}` +
    `&bank_code=${params.bank_code}` +
    `&currency=${params.currency}` +
    `&key=${key}`;

  console.log('🔐 String to sign (fixed order):', stringToSign);

  const sign = crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toUpperCase();

  console.log('🔐 Generated sign:', sign);

  return sign;
}

export default { signParams };


