const mysql = require('mysql2/promise');

/**
 * Middleware for Global Event Sourcing / Audit Logging
 */
const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  // Capture response to log after completion
  res.send = function (data) {
    res.send = originalSend;
    res.send(data);
    
    // Only log non-GET requests or specific actions
    if (req.method !== 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
      logAction(req, res, data);
    }
  };
  
  next();
};

const logAction = async (req, res, responseData) => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const userId = req.user ? req.user.email : 'SYSTEM';
    const action = req.method;
    const entity = req.baseUrl.split('/').pop();
    const entityId = req.params.id || null;
    
    const logData = {
      body: req.body,
      query: req.query,
      response: JSON.parse(responseData || '{}')
    };

    await conn.execute(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, data_json, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        action,
        entity,
        entityId,
        JSON.stringify(logData),
        req.ip,
        req.headers['user-agent']
      ]
    );
  } catch (error) {
    console.error('FAILED TO LOG AUDIT:', error.message);
  } finally {
    await conn.end();
  }
};

module.exports = auditLog;
