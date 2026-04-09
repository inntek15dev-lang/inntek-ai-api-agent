const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../../backend/config/keys');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

console.log('Generando llaves RSA (2048 bits)...');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(targetDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(targetDir, 'public.pem'), publicKey);

console.log('Llaves generadas en backend/config/keys/');
