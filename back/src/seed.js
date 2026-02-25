const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema } = require('./models');
require('dotenv').config();

const seed = async () => {
    try {
        await sequelize.sync({ force: true });

        // 1. Create Roles
        const superAdminRole = await Role.create({ nombre: 'SuperAdmin' });
        const adminRole = await Role.create({ nombre: 'Admin' });
        const userRole = await Role.create({ nombre: 'User' });

        // 2. Create Privileges (SuperAdmin wildcard)
        await Privilegio.create({
            ref_modulo: '*',
            read: true,
            write: true,
            exec: true,
            role_id: superAdminRole.id
        });

        // Admin Privileges
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config', 'Outputs_Maker', 'Json_Schemas'];
        for (const mod of modules) {
            await Privilegio.create({
                ref_modulo: mod,
                read: true,
                write: true,
                exec: true,
                role_id: adminRole.id
            });
        }

        // User Privileges
        await Privilegio.create({ ref_modulo: 'AI_Tool_Catalog', read: true, role_id: userRole.id });
        await Privilegio.create({ ref_modulo: 'AI_Tool_Execution', read: true, exec: true, role_id: userRole.id });

        // 3. Create SuperAdmin User
        const user = await User.create({
            nombre: 'Inntek System',
            email: 'inntek', // As per privilegios-engine requirement
            password: 'admin', // Simplification
            role_id: superAdminRole.id
        });

        // 4. Create Output Categories
        const catIdentidad = await OutputCategory.create({
            id: '943c7bb0-0b87-455e-843f-c04437b123c8',
            nombre: 'Identidad y Documentación'
        });
        const catReportes = await OutputCategory.create({ nombre: 'Reportes Ejecutivos' });

        // 5. Create Sample Output Formats
        const formatIDCard = await OutputFormat.create({
            id: '911a1355-d121-49ef-9b6c-c4b2ae3b252c',
            nombre: 'Reporte Validacion Cedula Chilena',
            tipo: 'reporte',
            category_id: catIdentidad.id,
            estructura: JSON.stringify([
                { "id": 1772032176765, "type": "heading", "data": { "text": "Reporte Validacion Cedula Chilena", "param": "" } },
                { "id": 1772033276952, "type": "label", "data": { "text": "Tipo Documento", "param": "analisis_documento.tipo_documento" } },
                { "id": 1772033345026, "type": "label", "data": { "text": "Nombre", "param": "validacion_punto_por_punto.nombre.match" } },
                { "id": 1772033342930, "type": "label", "data": { "text": "Rut", "param": "validacion_punto_por_punto.rut.match" } },
                { "id": 1772033422363, "type": "label", "data": { "text": "Digito Verificador", "param": "verificacion_consistencia.validacion_dv_rut" } },
                { "id": 1772033420124, "type": "label", "data": { "text": "estándar ICAO", "param": "verificacion_consistencia.validacion_mrz" } },
                { "id": 1772033521647, "type": "label", "data": { "text": "Integridad", "param": "verificacion_consistencia.integridad_datos" } },
                { "id": 1772033332001, "type": "subheading", "data": { "text": "Nota Final", "param": "" } },
                { "id": 1772032330904, "type": "heading", "data": { "text": "Nota Final", "param": "nota_final" } }
            ])
        });

        // 6. Create Sample JSON Schemas
        const schemaID = await JsonSchema.create({
            nombre: 'Esquema de Identidad Avanzado V2',
            descripcion: 'Estructura jerárquica experta para validación de documentos de identidad',
            schema: JSON.stringify({
                type: "object",
                properties: {
                    analisis_documento: {
                        type: "object",
                        properties: {
                            tipo_documento: { type: "string" }
                        }
                    },
                    validacion_punto_por_punto: {
                        type: "object",
                        properties: {
                            nombre: {
                                type: "object",
                                properties: {
                                    match: { type: "string" }
                                }
                            },
                            rut: {
                                type: "object",
                                properties: {
                                    match: { type: "string" }
                                }
                            }
                        }
                    },
                    verificacion_consistencia: {
                        type: "object",
                        properties: {
                            validacion_dv_rut: { type: "string" },
                            validacion_mrz: { type: "string" },
                            integridad_datos: { type: "string" }
                        }
                    },
                    nota_final: { type: "string" }
                },
                required: ["analisis_documento", "nota_final", "verificacion_consistencia"]
            })
        });

        // 7. Create Sample AI Tool: Validador de CI Chile
        await Tool.create({
            nombre: 'Validador de CI Chile',
            descripcion: 'Experto Validador de CI Chilenas con Estructura de Alta Definición',
            logo_herramienta: '🆔',
            training_prompt: 'Actúa como experto validador de cédulas chilenas. Analiza la imagen y extrae datos. Mapea la respuesta estrictamente a los campos: analisis_documento.tipo_documento, validacion_punto_por_punto.nombre.match, validacion_punto_por_punto.rut.match, verificacion_consistencia.validacion_dv_rut, verificacion_consistencia.validacion_mrz, verificacion_consistencia.integridad_datos y nota_final.',
            behavior_prompt: 'Responde siempre con un JSON estructurado siguiendo el esquema proporcionado. Sé preciso con los matches de texto y verifica la integridad MRZ e ICAO.',
            response_format: 'JSON',
            output_format_id: formatIDCard.id,
            json_schema_id: schemaID.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
