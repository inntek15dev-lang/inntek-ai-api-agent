const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const createDatabase = async () => {
    try {
        const connectionConfig = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        };

        if (process.env.DB_SSL === 'true') {
            connectionConfig.ssl = {
                ca: fs.readFileSync(path.join(__dirname, 'src', 'config', 'ca.pem')),
                rejectUnauthorized: true
            };
        }

        const connection = await mysql.createConnection(connectionConfig);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        console.log(`Database "${process.env.DB_NAME}" created or already exists.`);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    }
};

createDatabase();
