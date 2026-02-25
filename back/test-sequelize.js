const sequelize = require('./src/config/database');
const { sequelize: models } = require('./src/models');

const testConn = async () => {
    try {
        await sequelize.authenticate();
        console.log('Sequelize authenticated successfully.');
        await models.sync();
        console.log('Models synced successfully.');
    } catch (err) {
        console.error('Sequelize connection error:', err);
    } finally {
        process.exit();
    }
};
testConn();
