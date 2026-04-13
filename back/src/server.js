const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Multer storage for temporary processing
const upload = multer({ dest: 'uploads/' });

const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4048;

// Middleware
app.use(cors({
    origin: [
        'https://inntek-ai-api-agent-client.onrender.com',
        'https://preprod-ia-agents-manager.inntek.cl',
        'https://preprod-ia-agents-manager-api.inntek.cl',
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());

// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Agent Integrations API',
            version: '1.0.0',
            description: 'API for managing AI agents and tools'
        },
        servers: [
            { url: 'https://inntek-ai-api-agent-api.onrender.com/api', description: 'Production (Render)' },
            { url: 'https://preprod-ia-agents-manager-api.inntek.cl/api', description: 'Pre-Production (Inntek)' },
            { url: `http://localhost:${PORT}/api`, description: 'Local Development' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js'] // Path to the API docs
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('System Error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Database Sync Logic
const startServer = () => {
    const server = app.listen(PORT, () => {
        console.log('-------------------------------------------------------');
        console.log(`🚀 [PARKO] AI Agent Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
        console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
        console.log('-------------------------------------------------------');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use.`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

if (process.env.DB_SYNC_DISABLED === 'true') {
    console.log('[PARKO] Database sync skipped by DB_SYNC_DISABLED');
    startServer();
} else {
    sequelize.sync({ force: false }).then(() => {
        console.log('Database connected and synced');
        startServer();
    }).catch(err => {
        console.error('Database connection failed:', err);
        // On local dev with SQLite, sometimes we want to proceed even if sync fails
        if (process.env.NODE_ENV === 'development' && sequelize.getDialect() === 'sqlite') {
            console.warn('⚠️ Proceeding anyway in development mode...');
            startServer();
        } else {
            process.exit(1);
        }
    });
}
