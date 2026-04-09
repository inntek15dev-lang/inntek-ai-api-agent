const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', 'utf8');
const ivSize = 16;

/**
 * Encrypts a string (RUT) using AES-256-CBC.
 * @param {string} text - The raw RUT.
 * @returns {string} - Encrypted string (iv:encrypted).
 */
const encryptRUT = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(ivSize);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts a string (RUT).
 * @param {string} hash - Encrypted string (iv:encrypted).
 * @returns {string} - Raw RUT.
 */
const decryptRUT = (hash) => {
  if (!hash) return null;
  const [ivHex, encryptedText] = hash.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  encryptRUT,
  decryptRUT
};
