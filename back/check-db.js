const mysql = require('mysql2/promise');
require('dotenv').config();

const checkDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });
        const [rows] = await connection.query('SHOW DATABASES;');
        console.log('Available databases:', rows.map(r => r.Database));
        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
};
checkDB();
