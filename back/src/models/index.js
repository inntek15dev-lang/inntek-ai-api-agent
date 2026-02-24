const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
});

const Privilegio = sequelize.define('Privilegio', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ref_modulo: { type: DataTypes.STRING, allowNull: false }, // '*' or module name
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    write: { type: DataTypes.BOOLEAN, defaultValue: false },
    excec: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }
});

const Tool = sequelize.define('Tool', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    logo_herramienta: { type: DataTypes.STRING }, // logo_herramienta as requested
    training_prompt: { type: DataTypes.TEXT },
    behavior_prompt: { type: DataTypes.TEXT },
    response_format: { type: DataTypes.STRING } // JSON/Text/Markdown
});

const Config = sequelize.define('Config', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING, unique: true, allowNull: false },
    value: { type: DataTypes.TEXT }
});

// Associations
Role.hasMany(Privilegio, { foreignKey: 'role_id' });
Privilegio.belongsTo(Role, { foreignKey: 'role_id' });

User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

module.exports = { sequelize, Role, Privilegio, User, Tool, Config };
