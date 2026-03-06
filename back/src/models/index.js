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

const AiProvider = sequelize.define('AiProvider', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true, allowNull: false },
    tipo: { type: DataTypes.ENUM('google_native', 'openai_compatible'), allowNull: false },
    api_key: { type: DataTypes.STRING },
    base_url: { type: DataTypes.STRING }, // null for google_native
    modelo: { type: DataTypes.STRING, allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    extra_headers: { type: DataTypes.TEXT } // JSON string for additional headers
});

const Engine = sequelize.define('Engine', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    tipo: { type: DataTypes.ENUM('iterator', 'collector', 'mapper', 'api-consumer', 'output', 'converter', 'extractor'), allowNull: false },
    icono: { type: DataTypes.STRING },
    config_schema: { type: DataTypes.TEXT }, // JSON string defining config fields
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Visor = sequelize.define('Visor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    icono: { type: DataTypes.STRING },
    config_schema: { type: DataTypes.TEXT }, // JSON string defining config fields
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Machine = sequelize.define('Machine', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    icono: { type: DataTypes.STRING },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const MachineNode = sequelize.define('MachineNode', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    node_type: { type: DataTypes.ENUM('tool', 'engine', 'visor'), allowNull: false },
    position_x: { type: DataTypes.FLOAT, defaultValue: 0 },
    position_y: { type: DataTypes.FLOAT, defaultValue: 0 },
    config: { type: DataTypes.TEXT } // JSON string for node-specific config
});

const MachineConnection = sequelize.define('MachineConnection', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    source_handle: { type: DataTypes.STRING },
    target_handle: { type: DataTypes.STRING }
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

Tool.belongsTo(AiProvider, { foreignKey: 'ai_provider_id' });
AiProvider.hasMany(Tool, { foreignKey: 'ai_provider_id' });

// Machine associations
Machine.hasMany(MachineNode, { foreignKey: 'machine_id', onDelete: 'CASCADE' });
MachineNode.belongsTo(Machine, { foreignKey: 'machine_id' });

Machine.hasMany(MachineConnection, { foreignKey: 'machine_id', onDelete: 'CASCADE' });
MachineConnection.belongsTo(Machine, { foreignKey: 'machine_id' });

MachineNode.belongsTo(Tool, { foreignKey: 'tool_id' });
MachineNode.belongsTo(Engine, { foreignKey: 'engine_id' });
MachineNode.belongsTo(Visor, { foreignKey: 'visor_id' });

MachineConnection.belongsTo(MachineNode, { as: 'SourceNode', foreignKey: 'source_node_id' });
MachineConnection.belongsTo(MachineNode, { as: 'TargetNode', foreignKey: 'target_node_id' });

module.exports = { sequelize, Role, Privilegio, User, Tool, Config, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine, Visor, Machine, MachineNode, MachineConnection };
