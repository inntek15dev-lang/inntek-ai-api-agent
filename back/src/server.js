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
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors({
    origin: [
        'https://inntek-ai-api-agent-client.onrender.com',
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

// Database Sync
sequelize.sync({ force: false }).then(() => {
    console.log('Database connected and synced');
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
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
}).catch(err => {
    console.error('Database connection failed:', err);
});
