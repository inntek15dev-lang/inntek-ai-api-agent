const { sequelize } = require('./src/models');

async function testSync() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');
        
        // Drop tables that might be causing ENUM/Constraint issues in SQLite
        const { MachineNode, MachineConnection, Tool } = require('./src/models');
        await MachineConnection.drop();
        await MachineNode.drop();
        await Tool.drop();
        console.log('Machine and Tool tables dropped.');


        await sequelize.sync({ alter: true, logging: console.log });


        console.log('Database synced successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:');
        console.error(error);
        process.exit(1);
    }
}

testSync();
