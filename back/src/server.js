const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
        servers: [{ url: `http://localhost:${PORT}/api` }]
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
