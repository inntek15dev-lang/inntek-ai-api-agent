const { sequelize } = require('../src/models');

async function ensureSchema() {
    console.log('[PARKO] Ensuring database schema is up to date...');
    try {
        // Use alter: true only if explicitly requested or if we are not in MySQL (safe for sqlite)
        // Render/MySQL context often hits the 64 key limit with 'alter: true'
        const isSqlite = sequelize.getDialect() === 'sqlite';
        const shouldAlter = process.env.DB_ALTER_SCHEMA === 'true' || isSqlite;
        
        if (shouldAlter) {
            console.log(`[PARKO] Running sequelize.sync({ alter: true }) on ${sequelize.getDialect()}...`);
            await sequelize.sync({ alter: true });
        } else {
            console.log('[PARKO] Running safe sequelize.sync() (no alter)...');
            await sequelize.sync();
        }

        console.log('[PARKO] Database schema sync successful.');
        process.exit(0);
    } catch (error) {
        console.error('[PARKO] Error syncing database schema:', error);
        
        // Fallback for ER_TOO_MANY_KEYS or similar index issues
        if (error.message.includes('ER_TOO_MANY_KEYS') || error.name === 'SequelizeDatabaseError') {
            console.warn('[PARKO] Sync error detected. Attempting fallback safe sync...');
            try {
                await sequelize.sync();
                console.log('[PARKO] Fallback safe sync successful.');
                process.exit(0);
            } catch (retryError) {
                console.error('[PARKO] Fallback sync also failed:', retryError);
            }
        }
        process.exit(1);
    }
}

ensureSchema();
