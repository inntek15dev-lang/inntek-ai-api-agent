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
        await connection.end();
        const dbs = rows.map(r => r.Database);
        console.log('--- DATABASE SCAN ---');
        console.log('Target:', process.env.DB_NAME);
        console.log('Found:', dbs.includes(process.env.DB_NAME) ? 'YES' : 'NO');
        console.log('List:', dbs.join(', '));
        process.exit(0);
    } catch (err) {
        console.error('Scan Failed:', err);
        process.exit(1);
    }
};
checkDB();
