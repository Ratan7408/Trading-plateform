import crypto from 'crypto';

export function signParams(params, key) {
  // 1. Remove empty fields and skip sign/sign_type/currency
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && k !== 'sign' && k !== 'sign_type' && k !== 'currency') {
      // decode any accidental encoding (avoid %20)
      filtered[k] = decodeURIComponent(v.toString());
    }
  }

  // 2. Sort keys alphabetically
  const sortedKeys = Object.keys(filtered).sort();

  // 3. Build the sign string (no encoding, keep raw spaces)
  const stringToSign = sortedKeys.map(k => `${k}=${filtered[k]}`).join('&') + `&key=${key}`;

  console.log('🔐 String to sign (RAW):', stringToSign);

  // 4. MD5 lowercase (WatchGLB expects lowercase)
  const sign = crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toLowerCase();

  console.log('🔐 Generated sign:', sign);

  return sign;
}

export default { signParams };


