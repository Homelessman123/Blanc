import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_LOOKUP = (() => {
  const map = new Map();
  for (let i = 0; i < BASE32_ALPHABET.length; i += 1) {
    map.set(BASE32_ALPHABET[i], i);
  }
  return map;
})();

export function base32Encode(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input) {
  const normalized = String(input || '')
    .toUpperCase()
    .replace(/=+$/g, '')
    .replace(/[\s-]+/g, '');

  if (!normalized) return Buffer.alloc(0);

  let bits = 0;
  let value = 0;
  const out = [];

  for (const char of normalized) {
    const idx = BASE32_LOOKUP.get(char);
    if (idx === undefined) {
      throw new Error('Invalid base32 string');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(out);
}

export function generateTotpSecretBase32(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

export function buildOtpAuthUrl({ issuer, accountName, secret, digits = 6, period = 30 }) {
  const safeIssuer = String(issuer || '').trim() || 'ContestHub';
  const safeAccount = String(accountName || '').trim();
  const safeSecret = String(secret || '').trim().toUpperCase();

  const labelRaw = safeAccount ? `${safeIssuer}:${safeAccount}` : safeIssuer;
  const label = encodeURIComponent(labelRaw);
  const issuerParam = encodeURIComponent(safeIssuer);

  return `otpauth://totp/${label}?secret=${safeSecret}&issuer=${issuerParam}&algorithm=SHA1&digits=${digits}&period=${period}`;
}

function hotp({ keyBytes, counter, digits = 6 }) {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', keyBytes).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits);
  return String(code).padStart(digits, '0');
}

export function generateTotpToken(secretBase32, options = {}) {
  const digits = Number.isFinite(options.digits) ? options.digits : 6;
  const period = Number.isFinite(options.period) ? options.period : 30;
  const timestampMs = Number.isFinite(options.timestampMs) ? options.timestampMs : Date.now();

  const keyBytes = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / period);
  return hotp({ keyBytes, counter, digits });
}

export function verifyTotpToken(secretBase32, token, options = {}) {
  const digits = Number.isFinite(options.digits) ? options.digits : 6;
  const period = Number.isFinite(options.period) ? options.period : 30;
  const window = Number.isFinite(options.window) ? options.window : 1;
  const timestampMs = Number.isFinite(options.timestampMs) ? options.timestampMs : Date.now();

  const code = String(token || '').replace(/\s+/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(code)) return false;

  const keyBytes = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / period);

  const expectedBuf = Buffer.from(code, 'utf8');
  for (let i = -window; i <= window; i += 1) {
    const candidate = hotp({ keyBytes, counter: counter + i, digits });
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
      return true;
    }
  }

  return false;
}

function getTotpEncryptionKeyBytes() {
  const raw = String(process.env.TOTP_ENCRYPTION_KEY || '').trim();
  if (!raw) return null;

  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function encryptTotpSecret(secretBase32) {
  const key = getTotpEncryptionKeyBytes();
  if (!key) {
    throw new Error('TOTP_ENCRYPTION_KEY is not configured');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(secretBase32), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: 'A256GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ciphertext.toString('base64'),
  };
}

export function decryptTotpSecret(encrypted) {
  const key = getTotpEncryptionKeyBytes();
  if (!key) {
    throw new Error('TOTP_ENCRYPTION_KEY is not configured');
  }

  if (!encrypted || typeof encrypted !== 'object') {
    throw new Error('Invalid encrypted secret');
  }

  const { v, alg, iv, tag, ct } = encrypted;
  if (v !== 1 || alg !== 'A256GCM' || !iv || !tag || !ct) {
    throw new Error('Invalid encrypted secret');
  }

  const ivBuf = Buffer.from(String(iv), 'base64');
  const tagBuf = Buffer.from(String(tag), 'base64');
  const ctBuf = Buffer.from(String(ct), 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuf);
  decipher.setAuthTag(tagBuf);
  const plaintext = Buffer.concat([decipher.update(ctBuf), decipher.final()]);

  return plaintext.toString('utf8');
}

