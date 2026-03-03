const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine } = require('./models');
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
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config', 'Outputs_Maker', 'Json_Schemas', 'AI_Providers', 'Machines'];
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
            email: 'inntek',
            password: 'admin',
            role_id: superAdminRole.id
        });

        // 4. Create Output Categories
        const catIdentidad = await OutputCategory.create({
            id: '943c7bb0-0b87-455e-843f-c04437b123c8',
            nombre: 'Identidad y Documentación'
        });
        const catReportes = await OutputCategory.create({ nombre: 'Reportes Ejecutivos' });

        // ═══════════════════════════════════════════════════════════════
        // 5. Output Formats
        // ═══════════════════════════════════════════════════════════════

        // 5a. Reporte Validacion Cedula Chilena
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
                { "id": 1772032330904, "type": "heading", "data": { "text": "Nota Final", "param": "nota_final" } },
                { "id": 1772046675807, "type": "label", "data": { "text": "MATCH NUMERO SERIE", "param": "verificacion_consistencia.match_numero_documento_anverso_reverso.resultado" } }
            ])
        });

        // 5b. Reporte Check Liquidacion Chile
        const formatCheckLiqui = await OutputFormat.create({
            id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e53',
            nombre: 'Reporte Check Liquidacion Chile',
            tipo: 'reporte',
            category_id: catIdentidad.id,
            estructura: JSON.stringify([
                { "id": 1772039924406, "type": "heading", "data": { "text": "Reporte Check Liquidacion Chile", "param": "" } },
                { "id": 1772039936287, "type": "label", "data": { "text": "estado_general", "param": "resumen_match.estado_general" } },
                { "id": 1772039937423, "type": "label", "data": { "text": "SIMILITUD", "param": "resumen_match.porcentaje_similitud" } },
                { "id": 1772039938743, "type": "subheading", "data": { "text": "verificacion_totales", "param": "" } },
                { "id": 1772039940390, "type": "label", "data": { "text": "sueldo_liquido", "param": "verificacion_totales.sueldo_liquido.resultado" } },
                { "id": 1772039943703, "type": "label", "data": { "text": "Total Haberes", "param": "verificacion_totales.total_haberes.resultado" } },
                { "id": 1772044692949, "type": "label", "data": { "text": "total_imponible", "param": "verificacion_totales.total_imponible.resultado" } },
                { "id": 1772044761015, "type": "label", "data": { "text": "validacion_7_porciento_salud", "param": "verificacion_reglas_legales.validacion_7_porciento_salud" } }
            ])
        });

        // ═══════════════════════════════════════════════════════════════
        // 6. JSON Schemas
        // ═══════════════════════════════════════════════════════════════

        // 6a. Esquema de Identidad Avanzado V2 (para Validador CI Chile)
        const schemaID = await JsonSchema.create({
            id: 'cfa9753a-cc98-46cb-806e-cbed4208be4a',
            nombre: 'Esquema de Identidad Avanzado V2',
            descripcion: 'Estructura jerárquica experta para validación de documentos de identidad',
            schema: JSON.stringify({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Schema de Validación de Documento de Identidad",
                "type": "object",
                "required": ["analisis_documento", "validacion_punto_por_punto", "verificacion_consistencia", "nota_final"],
                "properties": {
                    "analisis_documento": {
                        "type": "object",
                        "required": ["tipo_documento", "estado_imagen", "datos_ocr_extraidos"],
                        "properties": {
                            "tipo_documento": { "type": "string" },
                            "estado_imagen": { "type": "string" },
                            "datos_ocr_extraidos": {
                                "type": "object",
                                "required": ["naci_en", "profesion", "mrz_linea_1", "mrz_linea_2", "mrz_linea_3"],
                                "properties": {
                                    "naci_en": { "type": "string" },
                                    "profesion": { "type": "string" },
                                    "mrz_linea_1": { "type": "string" },
                                    "mrz_linea_2": { "type": "string" },
                                    "mrz_linea_3": { "type": "string" }
                                }
                            }
                        }
                    },
                    "validacion_punto_por_punto": {
                        "type": "object",
                        "required": ["nombre", "rut", "fecha_nacimiento", "ciudad_nacimiento"],
                        "properties": {
                            "nombre": { "$ref": "#/definitions/item_validacion" },
                            "rut": { "$ref": "#/definitions/item_validacion" },
                            "fecha_nacimiento": { "$ref": "#/definitions/item_validacion" },
                            "ciudad_nacimiento": { "$ref": "#/definitions/item_validacion" }
                        }
                    },
                    "verificacion_consistencia": {
                        "type": "object",
                        "required": ["validacion_dv_rut", "match_numero_documento_anverso_reverso", "integridad_datos"],
                        "properties": {
                            "validacion_dv_rut": { "type": "string" },
                            "validacion_mrz": { "type": "string" },
                            "match_numero_documento_anverso_reverso": {
                                "type": "object",
                                "required": ["resultado", "numero_anverso", "numero_reverso"],
                                "properties": {
                                    "resultado": { "enum": ["MATCH", "MISMATCH", "NOT_AVAILABLE"] },
                                    "numero_anverso": { "type": "string" },
                                    "numero_reverso": { "type": "string" },
                                    "observacion": { "type": "string" }
                                }
                            },
                            "integridad_datos": { "type": "string" }
                        }
                    },
                    "nota_final": { "type": "string" }
                },
                "definitions": {
                    "item_validacion": {
                        "type": "object",
                        "required": ["data_proporcionada", "data_imagen", "match", "observacion"],
                        "properties": {
                            "data_proporcionada": { "type": "string" },
                            "data_imagen": { "type": "string" },
                            "match": { "type": "string" },
                            "observacion": { "type": "string" }
                        }
                    }
                }
            })
        });

        // 6b. Reporte Check Liqui Chile (para Check de Liquidaciones)
        const schemaCheckLiqui = await JsonSchema.create({
            id: '91b20865-b18c-4927-b711-abb751fd2212',
            nombre: 'Reporte Check Liqui Chile',
            descripcion: 'Estructura para reporte de consistencia: Liquidación vs Base de Datos',
            schema: JSON.stringify({
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Reporte de Consistencia: Liquidación vs Base de Datos",
                "type": "object",
                "required": ["metadata_auditoria", "resumen_match", "verificacion_totales", "discrepancias_detectadas"],
                "properties": {
                    "metadata_auditoria": {
                        "type": "object",
                        "required": ["id_empleado", "periodo_proceso", "fecha_ejecucion"],
                        "properties": {
                            "id_empleado": { "type": "string" },
                            "nombre_empleado": { "type": "string" },
                            "periodo_proceso": { "type": "string", "description": "Formato YYYY-MM" },
                            "fecha_ejecucion": { "type": "string", "format": "date-time" },
                            "fuente_erp": { "type": "string", "default": "SAP/Oracle/Buk" }
                        }
                    },
                    "resumen_match": {
                        "type": "object",
                        "properties": {
                            "porcentaje_similitud": { "type": "number", "minimum": 0, "maximum": 100 },
                            "estado_general": { "enum": ["COMPLETO", "DISCREPANCIA_MENOR", "CRÍTICO"] }
                        }
                    },
                    "verificacion_totales": {
                        "type": "object",
                        "properties": {
                            "total_imponible": { "$ref": "#/definitions/comparacion_valor" },
                            "total_haberes": { "$ref": "#/definitions/comparacion_valor" },
                            "sueldo_liquido": { "$ref": "#/definitions/comparacion_valor" }
                        }
                    },
                    "discrepancias_detectadas": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["campo", "valor_ocr", "valor_db", "tolerancia_aceptada"],
                            "properties": {
                                "campo": { "type": "string" },
                                "valor_ocr": { "type": "number" },
                                "valor_db": { "type": "number" },
                                "diferencia": { "type": "number" },
                                "severidad": { "enum": ["ALTA", "MEDIA", "BAJA"] },
                                "tolerancia_aceptada": { "type": "boolean" }
                            }
                        }
                    },
                    "verificacion_reglas_legales": {
                        "type": "object",
                        "properties": {
                            "cumple_tope_gratificacion": { "type": "boolean" },
                            "cumple_tope_imponible": { "type": "boolean" },
                            "validacion_7_porciento_salud": { "type": "string", "description": "Resultado del cálculo: (Imponible * 0.07) vs Descuento" }
                        }
                    }
                },
                "definitions": {
                    "comparacion_valor": {
                        "type": "object",
                        "required": ["documento", "base_datos", "resultado"],
                        "properties": {
                            "documento": { "type": "number" },
                            "base_datos": { "type": "number" },
                            "resultado": { "enum": ["MATCH", "MISMATCH"] }
                        }
                    }
                }
            })
        });

        // ═══════════════════════════════════════════════════════════════
        // 7. AI Providers
        // ═══════════════════════════════════════════════════════════════

        const providerGoogle = await AiProvider.create({
            nombre: 'Google Gemini',
            slug: 'google',
            tipo: 'google_native',
            api_key: null, // Set via Config UI
            base_url: null,
            modelo: 'gemini-2.0-flash',
            is_default: true,
            activo: true,
            extra_headers: null
        });

        const providerOpenRouter = await AiProvider.create({
            nombre: 'OpenRouter',
            slug: 'openrouter',
            tipo: 'openai_compatible',
            api_key: null, // Set via Config UI
            base_url: 'https://openrouter.ai/api/v1',
            modelo: 'google/gemini-2.0-flash-exp:free',
            is_default: false,
            activo: true,
            extra_headers: JSON.stringify({
                'HTTP-Referer': 'https://inntek-ai-api-agent-client.onrender.com',
                'X-Title': 'Inntek AI Agent'
            })
        });

        // ═══════════════════════════════════════════════════════════════
        // 8. Engines (System-level list processors for Machines)
        // ═══════════════════════════════════════════════════════════════

        await Engine.create({
            nombre: 'List Iterator',
            slug: 'list-iterator',
            descripcion: 'Receives an array from a connected Tool output and executes the next connected Tool once per item in the list.',
            tipo: 'iterator',
            icono: '🔄',
            config_schema: JSON.stringify({ input_field: 'string', description: 'Field name from source output that contains the array' }),
            activo: true
        });

        await Engine.create({
            nombre: 'List Collector',
            slug: 'list-collector',
            descripcion: 'Aggregates individual outputs from a connected Tool into a single consolidated array.',
            tipo: 'collector',
            icono: '📦',
            config_schema: JSON.stringify({ output_field: 'string', description: 'Field name for the collected array in the output' }),
            activo: true
        });

        await Engine.create({
            nombre: 'Data Mapper',
            slug: 'data-mapper',
            descripcion: 'Transforms and maps fields between Tool inputs and outputs. Define field mappings to reshape data between nodes.',
            tipo: 'mapper',
            icono: '🔀',
            config_schema: JSON.stringify({ mappings: 'array', description: 'Array of {from, to} field mapping objects' }),
            activo: true
        });

        // ═══════════════════════════════════════════════════════════════
        // 9. AI Tools
        // ═══════════════════════════════════════════════════════════════

        // 7a. Validador de CI Chile
        await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000001',
            nombre: 'Validador de CI Chile',
            descripcion: 'Experto Validador de CI Chilenas con Estructura de Alta Definición',
            logo_herramienta: '🆔',
            training_prompt: 'Actúa como experto validador de cédulas chilenas. Analiza la imagen y extrae datos. Mapea la respuesta estrictamente a los campos: analisis_documento.tipo_documento, validacion_punto_por_punto.nombre.match, validacion_punto_por_punto.rut.match, verificacion_consistencia.validacion_dv_rut, verificacion_consistencia.validacion_mrz, verificacion_consistencia.integridad_datos y nota_final.',
            behavior_prompt: 'Responde siempre con un JSON estructurado siguiendo el esquema proporcionado. Sé preciso con los matches de texto y verifica la integridad MRZ e ICAO.',
            response_format: 'JSON',
            output_format_id: formatIDCard.id,
            json_schema_id: schemaID.id
        });

        // 7b. CSS EXTRACTOR
        await Tool.create({
            id: 'edb84cda-584d-4a2c-8187-15f51fdf0884',
            nombre: 'CSS EXTRACTOR',
            descripcion: 'Extrae los estilos css de una captura en imagen de una interfaz de usuario',
            logo_herramienta: '🎨',
            training_prompt: 'ACTUA COMO INGENIERO DE SOFTWARE EXPERTO EN CSS y TAMBIEN COMO EXPERTO ANALISTA DE IMAGENES Y EXPERTO EN EXPERIENCIA DE USUARIO E INTERFACES WEB',
            behavior_prompt: 'analiza la imagen adjunta y extrae todo estilo css para generar un bloque de codigo css que contenga las reglas anidadas que se requiere para generar una interfaz con el estilo descubierto en el analisis de la imagen, con el mismo aspecto de fuentes, tamaños, colores, bordes. sombras etc.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: null
        });

        // 7c. Check de Liquidaciones Chile
        await Tool.create({
            id: 'f339b2d6-b8da-4697-ab86-d9fc2136f90a',
            nombre: 'Check de Liquidaciones Chile',
            descripcion: 'Elementos Clave a Validar:\nIdentificación: Datos del empleador y trabajador (RUT, fecha contrato).\nHaberes Imponibles: Sueldo base, gratificaciones, bonos, comisiones, horas extras. Sobre esto se calculan descuentos.\nHaberes No Imponibles: Asignaciones de movilización, colación, viáticos (no tributan).\nDescuentos Legales:\nPrevisión: AFP (sistema de pensiones).\nSalud: Fonasa (7%) o Isapre (monto pactado).\nSeguro de Cesantía: AFC.\nImpuesto Único: (Cuando corresponda).\nDescuentos Voluntarios: Ahorros previsionales, Caja de Compensación, créditos.\nTotal Haberes, Descuentos y Sueldo Líquido.\nFirma: O constancia de recepción, lo cual valida el pago ante discrepancias.',
            logo_herramienta: '💵',
            training_prompt: 'actua como un experto verificador y validador de liquidaciones de sueldo en chile, tu objetivo unico será analizar un archivo de liquidacion de sueldo adjunto para extraer toda su informacion y validarla contra la indormacion recibida en #DATA#',
            behavior_prompt: 'Analiza este recibo de salario,Elementos Clave a Validar:\nIdentificación: Datos del empleador y trabajador (RUT, fecha contrato).\nHaberes Imponibles: Sueldo base, gratificaciones, bonos, comisiones, horas extras. Sobre esto se calculan descuentos.\nHaberes No Imponibles: Asignaciones de movilización, colación, viáticos (no tributan).\nDescuentos Legales:\nPrevisión: AFP (sistema de pensiones).\nSalud: Fonasa (7%) o Isapre (monto pactado).\nSeguro de Cesantía: AFC.\nImpuesto Único: (Cuando corresponda).\nDescuentos Voluntarios: Ahorros previsionales, Caja de Compensación, créditos.\nTotal Haberes, Descuentos y Sueldo Líquido.\nFirma: O constancia de recepción, lo cual valida el pago ante discrepancias.\n\ncompara la data obtenida del analisis del archivo adjunto con la data proporcionada en #DATA# y genera una respuesta con el resultado de tu analisis comparativo de ambas datas',
            response_format: 'JSON',
            output_format_id: formatCheckLiqui.id,
            json_schema_id: schemaCheckLiqui.id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
