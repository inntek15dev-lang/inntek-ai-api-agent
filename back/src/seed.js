const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine, Visor, Machine, MachineNode, MachineConnection, Input, Deploy } = require('./models');

require('dotenv').config();

const upsertCore = async (Model, searchCriteria, staticId, defaults = {}) => {
    let instance = await Model.findOne({ where: searchCriteria });
    if (instance) {
        if (instance.id !== staticId) {
            console.log(`[HOMOLOGATION] Mismatched ID for ${Model.name} (${JSON.stringify(searchCriteria)}). Updating ${instance.id} -> ${staticId}`);
            await instance.update({ id: staticId });
        }
        if (Object.keys(defaults).length > 0) {
            await instance.update(defaults);
        }
        return instance;
    } else {
        console.log(`[HOMOLOGATION] Creating new ${Model.name} (${JSON.stringify(searchCriteria)}) with static ID: ${staticId}`);
        return await Model.create({ id: staticId, ...searchCriteria, ...defaults });
    }
};

const seed = async () => {
    try {
        const isSqlite = sequelize.getDialect() === 'sqlite';
        console.log(`[PARKO] Starting seed on ${sequelize.getDialect()}...`);

        try {
            await sequelize.sync({ alter: !isSqlite });
            console.log('Database synced successfully');
        } catch (syncErr) {
            console.warn('⚠️ Database sync warning:', syncErr.message);
            await sequelize.sync();
        }

        // 1. Roles
        const superAdminRole = await upsertCore(Role, { nombre: 'SuperAdmin' }, '00000000-0000-4000-a000-000000000001');
        const adminRole = await upsertCore(Role, { nombre: 'Admin' }, '00000000-0000-4000-a000-000000000002');
        const userRole = await upsertCore(Role, { nombre: 'User' }, '00000000-0000-4000-a000-000000000003');

        // 2. Privileges
        await Privilegio.findOrCreate({ where: { role_id: superAdminRole.id, ref_modulo: '*' }, defaults: { read: true, write: true, exec: true } });
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config', 'Outputs_Maker', 'Json_Schemas', 'AI_Providers', 'Machines', 'DOWNLOADER', 'DEPLOYS'];
        for (const mod of modules) {
            await Privilegio.findOrCreate({ where: { role_id: adminRole.id, ref_modulo: mod }, defaults: { read: true, write: true, exec: true } });
        }

        // 3. System User
        const systemUser = await upsertCore(User, { email: 'inntek' }, '11111111-1111-4111-a111-111111111111', { nombre: 'Inntek System', password: 'admin', role_id: superAdminRole.id });

        // 4. Categories
        const catIdentidad = await upsertCore(OutputCategory, { nombre: 'Identidad y Documentación' }, '943c7bb0-0b87-455e-843f-c04437b123c8');
        const catReportes = await upsertCore(OutputCategory, { nombre: 'Reportes Ejecutivos' }, 'c0ffee00-0000-4000-a000-000000000001');
        const catRYCE = await upsertCore(OutputCategory, { nombre: 'RYCE' }, 'c0ffee00-0000-4000-a000-000000000002');

        // 5. Output Formats
        const formatIDCard = await upsertCore(OutputFormat, { nombre: 'Reporte Validacion Cedula Chilena' }, '911a1355-d121-49ef-9b6c-c4b2ae3b252c', { tipo: 'reporte', category_id: catIdentidad.id, estructura: '[]' });
        const formatLiquidacionesDemo = await upsertCore(OutputFormat, { nombre: 'Matriz de Liquidaciones (Demo)' }, 'ab000001-0000-4000-a000-000000000005', { tipo: 'reporte', category_id: catReportes.id, estructura: '[]' });

        // 6. Json Schemas
        const schemaID = await upsertCore(JsonSchema, { nombre: 'Esquema de Identidad Avanzado V2' }, 'cfa9753a-cc98-46cb-806e-cbed4208be4a', { schema: '{}' });
        const schemaGenericList = await upsertCore(JsonSchema, { id: 'ab000001-0000-4000-a000-000000000001' }, 'ab000001-0000-4000-a000-000000000001', { nombre: 'Schema Lista Genérica', schema: '{}' });
        const schemaRYCETasasLipigas = await upsertCore(JsonSchema, { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a10' }, 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a10', { nombre: 'Esquema RYCE Certificado TASAS Lipigas', schema: '{}' });
        const schemaRYCETasasBlumar = await upsertCore(JsonSchema, { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a11' }, 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a11', { nombre: 'Esquema RYCE Certificado TASAS Blumar', schema: '{}' });

        // 7. AI Provider
        const providerGoogle = await upsertCore(AiProvider, { slug: 'google-native' }, 'aaa00000-0000-4000-a000-000000000001', { nombre: 'Google Gemini (Native)', tipo: 'google_native', modelo: 'gemini-2.0-flash', is_default: true, activo: true });

        // 8. Engines
        await upsertCore(Engine, { slug: 'list-iterator' }, 'e2222222-2222-4222-a222-222222222222', { nombre: 'List Iterator', tipo: 'iterator', icono: '🔄', activo: true });
        await upsertCore(Engine, { slug: 'list-collector' }, 'e3333333-3333-4333-a333-333333333333', { nombre: 'List Collector', tipo: 'collector', icono: '📦', activo: true });
        await upsertCore(Engine, { slug: 'data-mapper' }, 'e4444444-4444-4444-a444-444444444444', { nombre: 'Data Mapper', tipo: 'mapper', icono: '🔀', activo: true });
        await upsertCore(Engine, { slug: 'printer' }, 'e6666666-6666-4666-a666-666666666666', { nombre: 'PRINTER', tipo: 'output', icono: '🖨️', activo: true });
        await upsertCore(Engine, { slug: 'link-file' }, '13f6a316-6c0e-454d-9693-3cb853fcb107', { nombre: 'Descargador Link-File', tipo: 'utility', icono: '🔗', activo: true });

        // 9. Input
        await upsertCore(Input, { slug: 'json-input' }, '00000000-0000-4000-c000-000000000001', { nombre: 'JSON INPUT', icono: '📥', activo: true });

        // 10. Visores
        await upsertCore(Visor, { slug: 'message-visor' }, '00000000-0000-4000-b000-000000000001', { nombre: 'MENSAJE', icono: '💬', activo: true });
        await upsertCore(Visor, { slug: 'table-visor' }, '00000000-0000-4000-b000-000000000002', { nombre: 'TABLA', icono: '📊', activo: true });

        // 11. Tools (Cleaned)
        await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000001' }, 'edb84cda-0000-4a2c-8187-000000000001', { nombre: 'Validador de CI Chile', logo_herramienta: '🆔', response_format: 'JSON', output_format_id: formatIDCard.id, json_schema_id: schemaID.id });
        await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000030' }, 'edb84cda-0000-4a2c-8187-000000000030', { nombre: 'Demo Liquidaciones', logo_herramienta: '📑', response_format: 'JSON', output_format_id: formatLiquidacionesDemo.id, json_schema_id: schemaGenericList.id });
        await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000050' }, 'edb84cda-0000-4a2c-8187-000000000050', { nombre: 'RYCE Certificado TASAS Lipigas', logo_herramienta: '🛡️', response_format: 'JSON', json_schema_id: schemaRYCETasasLipigas.id });
        await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000051' }, 'edb84cda-0000-4a2c-8187-000000000051', { nombre: 'RYCE Certificado TASAS Blumar', logo_herramienta: '🐟', response_format: 'JSON', json_schema_id: schemaRYCETasasBlumar.id });

        // 12. Deploys (Initial Settings)
        await upsertCore(Deploy, { key: 'SERVER_IP' }, 'd0000000-0000-4000-a000-000000000001', { value: '${{ secrets.SERVER_IP }}', categoria: 'infra', descripcion: 'IP del servidor de pre-producción' });
        await upsertCore(Deploy, { key: 'SERVER_USER' }, 'd0000000-0000-4000-a000-000000000002', { value: '${{ secrets.SERVER_USER }}', categoria: 'infra', descripcion: 'Usuario SSH' });
        await upsertCore(Deploy, { key: 'DEPLOY_PATH' }, 'd0000000-0000-4000-a000-000000000003', { value: '/home/DOCKERS-PREPROD/AGENTIX/', categoria: 'infra', descripcion: 'Ruta base de despliegue en Linux' });
        await upsertCore(Deploy, { key: 'IMAGE_API' }, 'd0000000-0000-4000-a000-000000000004', { value: 'ghcr.io/inntek15dev-lang/inntek-ai-api-agent-api', categoria: 'docker', descripcion: 'Imagen Docker del Backend' });
        await upsertCore(Deploy, { key: 'IMAGE_FRONT' }, 'd0000000-0000-4000-a000-000000000005', { value: 'ghcr.io/inntek15dev-lang/inntek-ai-api-agent-front', categoria: 'docker', descripcion: 'Imagen Docker del Frontend' });
        await upsertCore(Deploy, { key: 'VITE_API_URL' }, 'd0000000-0000-4000-a000-000000000006', { value: 'https://preprod-ia-agents-manager-api.inntek.cl/api', categoria: 'env', descripcion: 'URL de la API para el Frontend (Vite)' });
        await upsertCore(Deploy, { key: 'POST_DEPLOY_SCHEMA' }, 'd0000000-0000-4000-a000-000000000007', { value: 'node scripts/ensure_schema.js', categoria: 'script', descripcion: 'Script para asegurar consistencia del esquema post-deploy' });
        await upsertCore(Deploy, { key: 'POST_DEPLOY_SEED' }, 'd0000000-0000-4000-a000-000000000008', { value: 'node src/seed.js', categoria: 'script', descripcion: 'Script para poblar base de datos post-deploy' });

        // 13. Machine (Demo only)
        // Clean all previous machines, nodes and connections to ensure a fresh state
        await MachineConnection.destroy({ where: {} });
        await MachineNode.destroy({ where: {} });
        await Machine.destroy({ where: {} });

        await upsertCore(Machine, { id: 'machine-demo-0001' }, 'machine-demo-0001', {
            nombre: 'Demo',
            descripcion: 'Máquina de demostración del sistema (Vacía)',
            icono: '🧪',
            activo: true
        });

        console.log('Database seeded successfully (Clean State)!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error!');
        console.error(error);
        process.exit(1);
    }
};

seed();
