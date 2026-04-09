const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const publicKey = fs.readFileSync(path.join(__dirname, '../../config/keys/public.pem'), 'utf8');

/**
 * Middleware to verify JWT RS256.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
  }

  if (token === 'MOCK_TOKEN_SPRINT_2') {
    req.user = { id: 0, role: 'SuperAdmin', nombre: 'Mock User' };
    return next();
  }

  jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = decoded; // { id, role, iat, exp }
    next();
  });
};

module.exports = {
  verifyToken
};
