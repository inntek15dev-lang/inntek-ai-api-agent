const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const colaboradoresRoutes = require('./src/routes/colaboradores.routes');
const asignacionesRoutes = require('./src/routes/asignaciones.routes');
const adminRoutes = require('./src/routes/admin.routes');
const auditLog = require('./src/middleware/audit.middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(auditLog); // Global Audit Log

// Routes
app.use('/api/v1/colaboradores', colaboradoresRoutes);
app.use('/api/v1/asignaciones', asignacionesRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend Kamel Capacitaciones running on port ${PORT}`);
});
