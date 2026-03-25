const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine, Visor, Machine, MachineNode, MachineConnection, Input } = require('./models');

require('dotenv').config();

/**
 * Helper to ensure a core record has a specific static ID.
 * If found by search criteria but has a different ID, it updates the ID.
 * Due to ON UPDATE CASCADE, this is safe and homologates environments.
 */
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
            console.warn('⚠️ Database sync warning (ignoring if not critical):', syncErr.message);
            await sequelize.sync();
        }

        // 1. Roles
        const superAdminRole = await upsertCore(Role, { nombre: 'SuperAdmin' }, '00000000-0000-4000-a000-000000000001');
        const adminRole = await upsertCore(Role, { nombre: 'Admin' }, '00000000-0000-4000-a000-000000000002');
        const userRole = await upsertCore(Role, { nombre: 'User' }, '00000000-0000-4000-a000-000000000003');

        // 2. Privileges
        await Privilegio.findOrCreate({
            where: { role_id: superAdminRole.id, ref_modulo: '*' },
            defaults: { read: true, write: true, exec: true }
        });

        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config', 'Outputs_Maker', 'Json_Schemas', 'AI_Providers', 'Machines'];
        for (const mod of modules) {
            await Privilegio.findOrCreate({
                where: { role_id: adminRole.id, ref_modulo: mod },
                defaults: { read: true, write: true, exec: true }
            });
        }

        await Privilegio.findOrCreate({ where: { role_id: userRole.id, ref_modulo: 'AI_Tool_Catalog' }, defaults: { read: true } });
        await Privilegio.findOrCreate({ where: { role_id: userRole.id, ref_modulo: 'AI_Tool_Execution' }, defaults: { read: true, exec: true } });

        // 3. System User
        const systemUser = await upsertCore(User, { email: 'inntek' }, '11111111-1111-4111-a111-111111111111', {
            nombre: 'Inntek System',
            password: 'admin',
            role_id: superAdminRole.id
        });

        // 4. Categories
        const catIdentidad = await upsertCore(OutputCategory, { nombre: 'Identidad y Documentación' }, '943c7bb0-0b87-455e-843f-c04437b123c8');
        const catReportes = await upsertCore(OutputCategory, { nombre: 'Reportes Ejecutivos' }, 'c0ffee00-0000-4000-a000-000000000001');
        const catRYCE = await upsertCore(OutputCategory, { nombre: 'RYCE' }, 'c0ffee00-0000-4000-a000-000000000002');

        // 5. Output Formats
        const formatIDCard = await upsertCore(OutputFormat, { nombre: 'Reporte Validacion Cedula Chilena' }, '911a1355-d121-49ef-9b6c-c4b2ae3b252c', {
            tipo: 'reporte', category_id: catIdentidad.id, estructura: JSON.stringify([
                { "id": 1, "type": "heading", "data": { "text": "Reporte Validacion Cedula Chilena", "param": "" } },
                { "id": 2, "type": "label", "data": { "text": "Tipo Documento", "param": "analisis_documento.tipo_documento" } },
                { "id": 3, "type": "label", "data": { "text": "Nombre", "param": "validacion_punto_por_punto.nombre.match" } },
                { "id": 4, "type": "label", "data": { "text": "Rut", "param": "validacion_punto_por_punto.rut.match" } }
            ])
        });

        const formatCheckLiqui = await upsertCore(OutputFormat, { nombre: 'Reporte Check Liquidacion Chile' }, '556a56ca-93b4-4e4d-9ac5-54a77aa15e53', {
            tipo: 'reporte', category_id: catIdentidad.id, estructura: JSON.stringify([
                { "id": 1, "type": "heading", "data": { "text": "Reporte Check Liquidacion Chile", "param": "" } },
                { "id": 2, "type": "label", "data": { "text": "Estado", "param": "resumen_match.estado_general" } }
            ])
        });

        const formatTGRDeuda = await upsertCore(OutputFormat, { nombre: 'Reporte TGR Certificado de Deuda' }, '556a56ca-93b4-4e4d-9ac5-54a77aa15e60', {
            tipo: 'reporte', category_id: catIdentidad.id, estructura: JSON.stringify([
                { "id": 1, "type": "heading", "data": { "text": "Certificado de Deuda TGR", "param": "" } },
                { "id": 2, "type": "label", "data": { "text": "Total Deuda", "param": "resumen_deuda.total_deuda" } }
            ])
        });

        const formatRYCEDeuda = await upsertCore(OutputFormat, { nombre: 'Certificado Deuda Vista RYCE' }, '556a56ca-93b4-4e4d-9ac5-54a77aa15e71', {
            tipo: 'reporte', category_id: catRYCE.id, estructura: '<div>Vista RYCE Deuda</div>'
        });

        const formatLiquidacionesDemo = await upsertCore(OutputFormat, { nombre: 'Matriz de Liquidaciones (Demo)' }, 'ab000001-0000-4000-a000-000000000005', {
            tipo: 'reporte', category_id: catReportes.id, estructura: JSON.stringify([{ "id": 1, "type": "heading", "data": { "text": "Análisis de Liquidaciones", "param": "" } }])
        });

        // 6. Json Schemas
        const schemaID = await upsertCore(JsonSchema, { nombre: 'Esquema de Identidad Avanzado V2' }, 'cfa9753a-cc98-46cb-806e-cbed4208be4a', {
            descripcion: 'Estructura para validación de documentos de identidad',
            schema: JSON.stringify({ "type": "object", "required": ["analisis_documento"], "properties": { "analisis_documento": { "type": "object" } } })
        });

        const schemaGenericList = await upsertCore(JsonSchema, { id: 'ab000001-0000-4000-a000-000000000001' }, 'ab000001-0000-4000-a000-000000000001', {
            nombre: 'Schema Lista Genérica',
            descripcion: 'Estructura genérica para outputs de tipo lista/array',
            schema: JSON.stringify({ "type": "object", "required": ["lista"], "properties": { "lista": { "type": "array" } } })
        });

        const schemaTGRDeuda = await upsertCore(JsonSchema, { nombre: 'Esquema TGR Certificado de Deuda' }, '91b20865-b18c-4927-b711-abb751fd2220', {
            descripcion: 'Validación de deudas fiscales TGR',
            schema: JSON.stringify({ "type": "object", "required": ["resumen_deuda"], "properties": { "resumen_deuda": { "type": "object" } } })
        });

        const schemaRYCETasasLipigas = await upsertCore(JsonSchema, { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a10' }, 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a10', {
            nombre: 'Esquema RYCE Certificado TASAS Lipigas',
            descripcion: 'Estructura para RYCE Lipigas',
            schema: JSON.stringify({ "type": "object", "required": ["tasas"], "properties": { "tasas": { "type": "object" } } })
        });

        const schemaRYCETasasBlumar = await upsertCore(JsonSchema, { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a11' }, 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a11', {
            nombre: 'Esquema RYCE Certificado TASAS Blumar',
            descripcion: 'Estructura para RYCE Blumar',
            schema: JSON.stringify({ "type": "object", "required": ["tasas"], "properties": { "tasas": { "type": "object" } } })
        });

        // 7. AI Providers
        const providerGoogle = await upsertCore(AiProvider, { slug: 'google-native' }, 'aaa00000-0000-4000-a000-000000000001', {
            nombre: 'Google Gemini (Native)', tipo: 'google_native', modelo: 'gemini-2.0-flash', is_default: true, activo: true
        });

        // 8. Engines
        const engineIterator = await upsertCore(Engine, { slug: 'list-iterator' }, 'e2222222-2222-4222-a222-222222222222', {
            nombre: 'List Iterator', tipo: 'iterator', icono: '🔄', activo: true, config_schema: JSON.stringify({ input_field: 'string' })
        });
        const engineCollector = await upsertCore(Engine, { slug: 'list-collector' }, 'e3333333-3333-4333-a333-333333333333', {
            nombre: 'List Collector', tipo: 'collector', icono: '📦', activo: true, config_schema: JSON.stringify({ output_field: 'string' })
        });
        const engineMapper = await upsertCore(Engine, { slug: 'data-mapper' }, 'e4444444-4444-4444-a444-444444444444', {
            nombre: 'Data Mapper', tipo: 'mapper', icono: '🔀', activo: true, config_schema: JSON.stringify({ mappings: 'array' })
        });
        const enginePrinter = await upsertCore(Engine, { slug: 'printer' }, 'e6666666-6666-4666-a666-666666666666', {
            nombre: 'PRINTER', tipo: 'output', icono: '🖨️', activo: true, config_schema: JSON.stringify({})
        });
        const engineComparator = await upsertCore(Engine, { slug: 'data-comparator' }, 'ea111111-1111-4111-a111-111111111111', {
            nombre: 'Data Comparator', tipo: 'mapper', icono: '⚖️', activo: true, config_schema: JSON.stringify({})
        });
        const engineEntityExtractor = await upsertCore(Engine, { slug: 'json-entity-extractor' }, 'e8888888-8888-4888-a888-888888888888', {
            nombre: 'Entity Extractor', tipo: 'extractor', icono: '📂', activo: true, config_schema: JSON.stringify({})
        });
        const engineLinkFile = await upsertCore(Engine, { slug: 'link-file' }, '13f6a316-6c0e-454d-9693-3cb853fcb107', {
            nombre: 'Descargador Link-File', tipo: 'utility', icono: '🔗', activo: true,
            config_schema: JSON.stringify({ file_url: { type: 'string' }, param: { type: 'string' } })
        });

        // 9. Inputs
        const inputJson = await upsertCore(Input, { slug: 'json-input' }, '00000000-0000-4000-c000-000000000001', {
            nombre: 'JSON INPUT', icono: '📥', activo: true, config_schema: JSON.stringify({ value: { type: 'textarea' } })
        });

        // 10. Visores
        const visorMessage = await upsertCore(Visor, { slug: 'message-visor' }, '00000000-0000-4000-b000-000000000001', { nombre: 'MENSAJE', icono: '💬', activo: true });
        const visorTable = await upsertCore(Visor, { slug: 'table-visor' }, '00000000-0000-4000-b000-000000000002', { nombre: 'TABLA', icono: '📊', activo: true });
        const visorDocument = await upsertCore(Visor, { slug: 'document-visor' }, '00000000-0000-4000-b000-000000000003', { nombre: 'DOCUMENTO', icono: '📄', activo: true });

        // 11. Tools
        const toolCI = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000001' }, 'edb84cda-0000-4a2c-8187-000000000001', {
            nombre: 'Validador de CI Chile', logo_herramienta: '🆔', training_prompt: 'CI Chile Expert', behavior_prompt: 'JSON strictly', response_format: 'JSON', output_format_id: formatIDCard.id, json_schema_id: schemaID.id
        });

        const toolNomina = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000020' }, 'edb84cda-0000-4a2c-8187-000000000020', {
            nombre: 'Extractor de Nómina', logo_herramienta: '📋', training_prompt: 'Payroll Expert', behavior_prompt: 'JSON list', response_format: 'JSON', json_schema_id: schemaGenericList.id
        });

        const toolValLiqui = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000021' }, 'edb84cda-0000-4a2c-8187-000000000021', {
            nombre: 'Validador de Liquidación Individual', logo_herramienta: '🧮', training_prompt: 'Payslip Auditor', behavior_prompt: 'JSON verify', response_format: 'JSON'
        });

        const toolDemoLiqui = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000030' }, 'edb84cda-0000-4a2c-8187-000000000030', {
            nombre: 'Demo Liquidaciones', logo_herramienta: '📑', training_prompt: 'Pipe-separated extraction', behavior_prompt: 'JSON output', response_format: 'JSON', output_format_id: formatLiquidacionesDemo.id, json_schema_id: schemaGenericList.id
        });

        const toolTGRDeuda = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000040' }, 'edb84cda-0000-4a2c-8187-000000000040', {
            nombre: 'Validador de Certificado de Deuda TGR', logo_herramienta: '🏛️', training_prompt: 'TGR Debt Expert', behavior_prompt: 'JSON TGR', response_format: 'JSON', output_format_id: formatTGRDeuda.id, json_schema_id: schemaTGRDeuda.id
        });

        const toolRYCELipigas = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000050' }, 'edb84cda-0000-4a2c-8187-000000000050', {
            nombre: 'RYCE Certificado TASAS Lipigas', logo_herramienta: '🛡️', training_prompt: 'RYCE Auditor', behavior_prompt: 'JSON Lipigas', response_format: 'JSON', json_schema_id: schemaRYCETasasLipigas.id
        });

        const toolRYCEBlumar = await upsertCore(Tool, { id: 'edb84cda-0000-4a2c-8187-000000000051' }, 'edb84cda-0000-4a2c-8187-000000000051', {
            nombre: 'RYCE Certificado TASAS Blumar', logo_herramienta: '🐟', training_prompt: 'RYCE Auditor', behavior_prompt: 'JSON Blumar', response_format: 'JSON', json_schema_id: schemaRYCETasasBlumar.id
        });

        // 12. Machines
        const machineLotes = await upsertCore(Machine, { id: 'machine-0000-0000-0000-000000000001' }, 'machine-0000-0000-0000-000000000001', { nombre: 'Verificación Laboral en Lotes', icono: '🏭' });
        const m1n1 = await upsertCore(MachineNode, { id: 'mn-lotes-0001' }, 'mn-lotes-0001', { machine_id: machineLotes.id, node_type: 'tool', tool_id: toolNomina.id, position_x: 50, position_y: 200 });
        const m1n2 = await upsertCore(MachineNode, { id: 'mn-lotes-0002' }, 'mn-lotes-0002', { machine_id: machineLotes.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 320, position_y: 200, config: JSON.stringify({ input_field: 'lista' }) });
        const m1n3 = await upsertCore(MachineNode, { id: 'mn-lotes-0003' }, 'mn-lotes-0003', { machine_id: machineLotes.id, node_type: 'tool', tool_id: toolValLiqui.id, position_x: 590, position_y: 200 });

        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n1.id, target_node_id: m1n2.id } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n2.id, target_node_id: m1n3.id } });

        const machineTGR = await upsertCore(Machine, { id: 'machine-0000-0000-0000-000000000005' }, 'machine-0000-0000-0000-000000000005', { nombre: 'Auditoría de Deuda TGR', icono: '🏦' });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error!');
        console.error(error);
        process.exit(1);
    }
};

seed();
