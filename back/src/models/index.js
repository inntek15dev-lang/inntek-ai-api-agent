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
    exec: { type: DataTypes.BOOLEAN, defaultValue: false }
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

const JsonSchema = sequelize.define('JsonSchema', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    schema: { type: DataTypes.TEXT, allowNull: false } // JSON Schema as a string
});

const OutputCategory = sequelize.define('OutputCategory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, unique: true, allowNull: false }
});

const OutputFormat = sequelize.define('OutputFormat', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: { type: DataTypes.ENUM('reporte', 'accionable', 'generativo'), defaultValue: 'reporte' },
    estructura: { type: DataTypes.TEXT, allowNull: false } // HTML template with {{placeholder}}
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

OutputFormat.belongsTo(OutputCategory, { foreignKey: 'category_id' });
OutputCategory.hasMany(OutputFormat, { foreignKey: 'category_id' });

Tool.belongsTo(OutputFormat, { foreignKey: 'output_format_id' });
OutputFormat.hasMany(Tool, { foreignKey: 'output_format_id' });

Tool.belongsTo(JsonSchema, { foreignKey: 'json_schema_id' });
JsonSchema.hasMany(Tool, { foreignKey: 'json_schema_id' });

module.exports = { sequelize, Role, Privilegio, User, Tool, Config, OutputCategory, OutputFormat, JsonSchema };
