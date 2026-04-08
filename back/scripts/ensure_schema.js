const { sequelize } = require('../src/models');

async function ensureSchema() {
    console.log('[PARKO] Ensuring database schema is up to date...');
    try {
        // alter: true will add missing columns and change types without dropping data if possible
        await sequelize.sync({ alter: true });
        console.log('[PARKO] Database schema sync successful.');
        process.exit(0);
    } catch (error) {
        console.error('[PARKO] Error syncing database schema:', error);
        process.exit(1);
    }
}

ensureSchema();
