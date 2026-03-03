const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine, Machine, MachineNode, MachineConnection } = require('./models');
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
            api_key: null,
            base_url: null,
            modelo: 'gemini-2.0-flash',
            is_default: false,
            activo: true,
            extra_headers: null
        });

        const providerOpenRouter = await AiProvider.create({
            nombre: 'OpenRouter',
            slug: 'openrouter',
            tipo: 'openai_compatible',
            api_key: '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',
            base_url: 'https://openrouter.ai/api/v1',
            modelo: 'google/gemini-2.0-flash-lite',
            is_default: true,
            activo: true,
            extra_headers: JSON.stringify({
                'HTTP-Referer': 'https://inntek-ai-api-agent-client.onrender.com',
                'X-Title': 'Inntek AI Agent'
            })
        });

        // ═══════════════════════════════════════════════════════════════
        // 8. Engines (System-level list processors for Machines)
        // ═══════════════════════════════════════════════════════════════

        const engineIterator = await Engine.create({
            nombre: 'List Iterator',
            slug: 'list-iterator',
            descripcion: 'Receives an array from a connected Tool output and executes the next connected Tool once per item in the list.',
            tipo: 'iterator',
            icono: '🔄',
            config_schema: JSON.stringify({ input_field: 'string', description: 'Field name from source output that contains the array' }),
            activo: true
        });

        const engineCollector = await Engine.create({
            nombre: 'List Collector',
            slug: 'list-collector',
            descripcion: 'Aggregates individual outputs from a connected Tool into a single consolidated array.',
            tipo: 'collector',
            icono: '📦',
            config_schema: JSON.stringify({ output_field: 'string', description: 'Field name for the collected array in the output' }),
            activo: true
        });

        const engineMapper = await Engine.create({
            nombre: 'Data Mapper',
            slug: 'data-mapper',
            descripcion: 'Transforms and maps fields between Tool inputs and outputs. Define field mappings to reshape data between nodes.',
            tipo: 'mapper',
            icono: '🔀',
            config_schema: JSON.stringify({ mappings: 'array', description: 'Array of {from, to} field mapping objects' }),
            activo: true
        });

        const engineApiConsumer = await Engine.create({
            nombre: 'API Consumer',
            slug: 'api-consumer',
            descripcion: 'Ejecuta peticiones HTTP a APIs externas. Si es POST/PUT, el input del nodo anterior se enviará como body JSON.',
            tipo: 'api-consumer',
            icono: '🌐',
            config_schema: JSON.stringify({
                url: { type: 'string', description: 'URL del endpoint (ej. https://api.ejemplo.com/v1/data)' },
                method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'Método HTTP' },
                headers: { type: 'text', description: 'Headers adicionales en formato JSON (ej. {"Authorization": "Bearer token"})' }
            }),
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

        // ═══════════════════════════════════════════════════════════════
        // 10. Generic List Schema (for Machine list-output tools)
        // ═══════════════════════════════════════════════════════════════

        const schemaGenericList = await JsonSchema.create({
            id: 'ab000001-0000-4000-a000-000000000001',
            nombre: 'Schema Lista Genérica',
            descripcion: 'Estructura genérica para outputs de tipo lista/array. Cada item tiene id, nombre, tipo, estado, datos clave-valor, y un array de documentos asociados.',
            schema: JSON.stringify({
                "type": "object",
                "required": ["lista", "total", "resumen"],
                "properties": {
                    "lista": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["id", "nombre", "tipo", "estado"],
                            "properties": {
                                "id": { "type": "string" },
                                "nombre": { "type": "string" },
                                "tipo": { "type": "string" },
                                "estado": { "type": "string" },
                                "datos": {
                                    "type": "object",
                                    "properties": {
                                        "rut": { "type": "string" },
                                        "cargo": { "type": "string" },
                                        "patente": { "type": "string" },
                                        "marca": { "type": "string" },
                                        "modelo": { "type": "string" },
                                        "anio": { "type": "string" },
                                        "area": { "type": "string" },
                                        "observaciones": { "type": "string" }
                                    }
                                },
                                "documentos": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": ["nombre_documento", "estado"],
                                        "properties": {
                                            "nombre_documento": { "type": "string" },
                                            "estado": { "type": "string" },
                                            "fecha_vencimiento": { "type": "string" },
                                            "observacion": { "type": "string" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "total": { "type": "number" },
                    "resumen": {
                        "type": "object",
                        "properties": {
                            "completos": { "type": "number" },
                            "incompletos": { "type": "number" },
                            "criticos": { "type": "number" },
                            "observacion_general": { "type": "string" }
                        }
                    }
                }
            })
        });

        // ═══════════════════════════════════════════════════════════════
        // 11. List-Generating Tools (for Machine flows)
        // ═══════════════════════════════════════════════════════════════

        // 11a. CSV Data Extractor — extracts structured lists from CSV data
        await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000010',
            nombre: 'CSV Data Extractor',
            descripcion: 'Recibe datos CSV (adjunto o en el prompt) de trabajadores, vehículos y/o maquinarias. Extrae y estructura cada registro en un array JSON detallado con sus documentos asociados. Diseñada para producir listas que alimenten Machines.',
            logo_herramienta: '📊',
            training_prompt: `Eres un experto en procesamiento de datos tabulares y documentación de operaciones industriales.
Tu tarea es analizar datos CSV de trabajadores, vehículos y maquinarias, y transformarlos en un JSON estructurado.

DATOS CSV DE EJEMPLO INTEGRADOS:
tipo,id,nombre,rut,cargo,patente,marca,modelo,anio,area,doc_contrato,doc_licencia,doc_rev_tecnica,doc_seguro,doc_cert_competencia
TRABAJADOR,T001,Juan Pérez González,12.345.678-9,Operador Grúa,,,,, Operaciones,SI,SI CLASE D,,,SI
TRABAJADOR,T002,María López Soto,11.222.333-4,Conductora,,,,, Transporte,SI,SI CLASE A2,,,NO
TRABAJADOR,T003,Carlos Muñoz Díaz,9.876.543-2,Mecánico,,,,, Mantenimiento,SI,NO,,,SI
TRABAJADOR,T004,Ana Torres Vega,15.444.555-6,Supervisora HSEC,,,,, HSEC,SI,SI CLASE B,,,SI
TRABAJADOR,T005,Pedro Rojas Fuentes,8.765.432-1,Soldador,,,,, Mantenimiento,NO,NO,,,NO
VEHICULO,V001,Camión Tolva 01,,, AB-1234,Volvo,FMX 500,2021,Transporte,,, SI 2026-06,SI 2026-12,
VEHICULO,V002,Camioneta Terreno,,, CD-5678,Toyota,Hilux,2023,Operaciones,,, SI 2026-08,SI 2026-10,
VEHICULO,V003,Bus Personal,,, EF-9012,Mercedes,OF 1722,2019,Transporte,,, NO VENCIDA,SI 2026-03,
MAQUINARIA,M001,Excavadora CAT 320,,,,CAT,320 GC,2022,Operaciones,,,,SI 2026-12,
MAQUINARIA,M002,Grúa Telescópica,,,,Liebherr,LTM 1100,2020,Operaciones,,,,NO VENCIDA,
MAQUINARIA,M003,Retroexcavadora,,,,JCB,3CX,2018,Mantenimiento,,,,SI 2026-04,

Para cada registro debes generar un objeto en el array "lista" con: id, nombre, tipo (TRABAJADOR/VEHICULO/MAQUINARIA), estado (COMPLETO/INCOMPLETO/CRITICO según documentación), datos (campos relevantes), y documentos (array de documentos requeridos con su estado).`,
            behavior_prompt: 'Analiza los datos CSV proporcionados (en el prompt o en archivo adjunto). Genera un JSON con el array "lista" conteniendo cada registro estructurado. Evalúa el estado documental: COMPLETO si tiene toda la documentación, INCOMPLETO si falta algo no crítico, CRITICO si faltan documentos obligatorios (contrato, licencia vigente, revisión técnica vigente). Incluye resumen con conteos.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 11b. Fleet Inventory Analyzer — analyzes vehicle/machinery fleets
        await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000011',
            nombre: 'Fleet Inventory Analyzer',
            descripcion: 'Analiza inventarios de flotas de vehículos y maquinarias. Recibe datos de flota y genera un listado detallado con estado de cada unidad, documentación vigente/vencida, y alertas de mantenimiento.',
            logo_herramienta: '🚛',
            training_prompt: `Eres un experto en gestión de flotas vehiculares y maquinaria pesada para operaciones industriales.
Tu objetivo es recibir información de flota (texto, CSV o archivo adjunto) y generar un inventario estructurado con:
- Identificación de cada unidad (patente, marca, modelo, año)
- Estado operacional (OPERATIVO, EN MANTENIMIENTO, FUERA DE SERVICIO)
- Documentación (revisión técnica, seguro, permiso de circulación, certificaciones)
- Alertas por documentos próximos a vencer (30 días) o ya vencidos
Cada unidad debe tener su array de documentos con estado y fecha de vencimiento.`,
            behavior_prompt: 'Procesa la información de flota recibida. Para cada vehículo/maquinaria, determina su estado según la documentación: COMPLETO si todo vigente, INCOMPLETO si hay documentos por vencer en 30 días, CRITICO si hay documentos vencidos o faltantes obligatorios. Genera la lista como array JSON con resumen de conteos.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 11c. Document Compliance Checker — checks docs per entity from a list
        await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000012',
            nombre: 'Document Compliance Checker',
            descripcion: 'Recibe un elemento individual (trabajador, vehículo o maquinaria) con su lista de documentos y verifica el cumplimiento documental según normativa chilena. Diseñada para ser usada iterativamente dentro de una Machine, recibiendo un item a la vez desde un List Iterator.',
            logo_herramienta: '✅',
            training_prompt: `Eres un auditor experto en cumplimiento documental para operaciones industriales en Chile.
Recibirás los datos de UN solo registro (trabajador, vehículo o maquinaria) y debes verificar:

PARA TRABAJADORES:
- Contrato de trabajo (obligatorio)
- Licencia de conducir vigente (si aplica al cargo)
- Certificación de competencias (si aplica)
- Exámenes preocupacionales
- Inducción de seguridad

PARA VEHÍCULOS:
- Revisión técnica vigente (obligatorio)
- Seguro obligatorio SOAP (obligatorio)
- Permiso de circulación (obligatorio)
- Certificado de emisiones

PARA MAQUINARIAS:
- Seguro de responsabilidad civil (obligatorio)
- Certificación de operatividad
- Registro de mantenimiento preventivo`,
            behavior_prompt: 'Analiza el registro individual recibido. Verifica cada documento requerido según el tipo de entidad. Responde con un JSON que contenga el mismo elemento pero con un array actualizado de documentos donde cada uno tiene estado detallado (VIGENTE/VENCIDO/FALTANTE/NO_APLICA), fecha de vencimiento si corresponde, y observaciones. Calcula un estado general: COMPLETO, INCOMPLETO o CRITICO.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // ═══════════════════════════════════════════════════════════════
        // 12. Labor Verification Tool Kit
        // ═══════════════════════════════════════════════════════════════

        // 12a. Extractor de Nómina — ingests payroll CSV/data and outputs worker list
        const toolNomina = await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000020',
            nombre: 'Extractor de Nómina',
            descripcion: 'Recibe un archivo CSV o datos textuales con la nómina de trabajadores de un período. Extrae y estructura cada trabajador con sus datos laborales, salariales y documentación asociada en un array JSON.',
            logo_herramienta: '📋',
            training_prompt: `Eres un experto en gestión de recursos humanos y procesamiento de nóminas laborales en Chile.
Tu tarea es analizar datos de nómina (CSV, planilla o texto) y transformarlos en un array JSON estructurado.

Cada trabajador debe incluir:
- Datos personales: RUT, nombre completo, cargo, área/departamento
- Datos contractuales: tipo contrato, fecha inicio, fecha fin (si aplica)
- Datos salariales: sueldo base, gratificación, bonos, total haberes imponibles
- Documentación laboral: contrato (SI/NO), liquidación mes actual (SI/NO), certificado AFP (SI/NO), certificado salud (SI/NO)

DATOS CSV DE EJEMPLO INTEGRADOS:
rut,nombre,cargo,area,tipo_contrato,fecha_inicio,sueldo_base,gratificacion,bono_produccion,contrato,liquidacion_actual,cert_afp,cert_salud
12.345.678-9,Juan Pérez González,Operador Grúa,Operaciones,Indefinido,2023-03-15,850000,70833,120000,SI,SI,SI,SI
11.222.333-4,María López Soto,Conductora,Transporte,Indefinido,2022-08-01,720000,60000,0,SI,SI,SI,NO
9.876.543-2,Carlos Muñoz Díaz,Mecánico,Mantenimiento,Plazo Fijo,2025-11-01,680000,56667,80000,SI,NO,NO,NO
15.444.555-6,Ana Torres Vega,Supervisora HSEC,HSEC,Indefinido,2021-05-20,1200000,100000,150000,SI,SI,SI,SI
8.765.432-1,Pedro Rojas Fuentes,Soldador,Mantenimiento,Plazo Fijo,2025-12-01,650000,54167,60000,NO,NO,NO,NO
16.777.888-9,Sofía Hernández Muñoz,Administrativa,RRHH,Indefinido,2024-01-10,580000,48333,0,SI,SI,SI,SI
10.111.222-3,Roberto Sánchez Pino,Electricista,Mantenimiento,Indefinido,2023-06-01,750000,62500,90000,SI,SI,NO,SI
14.333.444-5,Claudia Reyes Orrego,Prevencionista,HSEC,Indefinido,2022-02-15,950000,79167,100000,SI,SI,SI,SI`,
            behavior_prompt: 'Analiza los datos de nómina proporcionados. Genera un JSON con array "lista" donde cada trabajador es un objeto con: id (RUT), nombre, tipo (TRABAJADOR), estado (COMPLETO/INCOMPLETO/CRITICO según documentación), datos (cargo, area, sueldo_base, tipo_contrato), y documentos (array con cada doc requerido y su estado). Un trabajador es CRITICO si no tiene contrato. INCOMPLETO si le falta algún certificado. COMPLETO si tiene todo.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 12b. Validador de Liquidación Individual — validates one payslip
        const toolValLiqui = await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000021',
            nombre: 'Validador de Liquidación Individual',
            descripcion: 'Recibe los datos de UN trabajador y valida su liquidación de sueldo: verifica cálculos de haberes imponibles, descuentos legales (AFP, Salud 7%, AFC), gratificación legal, y sueldo líquido. Diseñada para uso iterativo en Machines.',
            logo_herramienta: '🧮',
            training_prompt: `Eres un experto en legislación laboral chilena y validación de liquidaciones de sueldo.
Recibirás los datos de UN solo trabajador con su información salarial y debes verificar:

CÁLCULOS OBLIGATORIOS:
1. Total Imponible = Sueldo Base + Gratificación + Bonos imponibles
2. Descuento AFP = Total Imponible × tasa AFP (aprox 12.5%)
3. Descuento Salud = Total Imponible × 7% (Fonasa) o monto pactado (Isapre)
4. Descuento AFC = Total Imponible × 0.6% (contrato indefinido) o 3% (plazo fijo)
5. Sueldo Líquido = Total Imponible - Descuentos Legales - Impuesto Único (si aplica)

VALIDACIONES:
- Sueldo base >= Ingreso Mínimo Mensual vigente ($500.000 aprox)
- Gratificación legal: máx 4.75 IMM/12 por mes
- Tope imponible: 81.6 UF mensual para cotizaciones
- Consistencia entre montos declarados y calculados`,
            behavior_prompt: 'Analiza los datos salariales del trabajador individual recibido. Calcula y verifica cada componente de la liquidación. Responde con un JSON que contenga el trabajador con estado actualizado: COMPLETO si todos los cálculos son correctos, INCOMPLETO si hay discrepancias menores (< 5%), CRITICO si hay errores graves o incumplimientos legales. Incluye detalle de cada validación.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 12c. Verificador de Contrato — validates employment contract
        const toolContrato = await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000022',
            nombre: 'Verificador de Contrato',
            descripcion: 'Verifica la existencia y vigencia del contrato de trabajo de un trabajador individual. Evalúa: tipo de contrato, fechas, cláusulas obligatorias según Código del Trabajo chileno.',
            logo_herramienta: '📄',
            training_prompt: `Eres un experto en derecho laboral chileno y contratos de trabajo.
Recibirás los datos de UN trabajador y debes verificar su situación contractual:

VERIFICACIONES:
- Existencia de contrato firmado (obligatorio Art. 9 Código del Trabajo)
- Tipo de contrato: Indefinido, Plazo Fijo (máx 2 años), Por obra/faena
- Fecha de inicio y antigüedad
- Si es Plazo Fijo: verificar que no supere el máximo legal
- Si tiene más de 1 año: debería ser indefinido o renovado formalmente
- Cláusulas obligatorias: lugar de trabajo, función, remuneración, jornada

ESTADOS:
- VIGENTE: contrato existe y está al día
- VENCIDO: contrato plazo fijo expirado
- FALTANTE: no tiene contrato registrado (CRITICO)
- IRREGULAR: contrato con anomalías`,
            behavior_prompt: 'Analiza la situación contractual del trabajador recibido. Verifica existencia, tipo, vigencia y regularidad del contrato según normativa chilena. Responde con JSON incluyendo estado del contrato y observaciones detalladas.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 12d. Verificador de Certificaciones — checks licenses and certs
        const toolCerts = await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000023',
            nombre: 'Verificador de Certificaciones',
            descripcion: 'Verifica certificaciones, licencias y documentación complementaria de un trabajador individual: certificado AFP, certificado de salud (Fonasa/Isapre), licencia de conducir, certificaciones de competencia.',
            logo_herramienta: '🏅',
            training_prompt: `Eres un auditor de cumplimiento documental laboral en Chile.
Recibirás los datos de UN trabajador y debes verificar su documentación complementaria:

DOCUMENTOS A VERIFICAR:
1. Certificado AFP vigente (obligatorio para todo trabajador dependiente)
2. Certificado de Salud (Fonasa o Isapre, obligatorio)
3. Licencia de conducir (obligatorio si el cargo requiere conducción)
4. Certificación de competencias (según cargo: grúa, soldadura, electricidad, etc.)
5. Examen preocupacional (requerido por la mutualidad)
6. Inducción de seguridad (obligatorio en faenas industriales)

CRITERIOS:
- VIGENTE: documento existe y está al día
- VENCIDO: documento existe pero caducó
- FALTANTE: documento no existe y es obligatorio
- NO_APLICA: documento no requerido para este cargo`,
            behavior_prompt: 'Verifica cada certificación y documento complementario del trabajador recibido. Evalúa según su cargo qué documentos son obligatorios vs opcionales. Estado general: COMPLETO si todo vigente, INCOMPLETO si falta algo no crítico, CRITICO si falta AFP, salud o certificación obligatoria para el cargo.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // 12e. Generador de Reporte de Lote — aggregates batch results
        const toolReporteLote = await Tool.create({
            id: 'edb84cda-0000-4a2c-8187-000000000024',
            nombre: 'Generador de Reporte de Lote',
            descripcion: 'Recibe el resultado agregado de un proceso de verificación en lote y genera un reporte ejecutivo consolidado con estadísticas, hallazgos críticos, y recomendaciones.',
            logo_herramienta: '📈',
            training_prompt: `Eres un experto en generación de reportes ejecutivos de cumplimiento laboral.
Recibirás un array consolidado con los resultados de verificación de múltiples trabajadores y debes generar un reporte ejecutivo que incluya:

SECCIONES DEL REPORTE:
1. Resumen Ejecutivo: total procesados, completos, incompletos, críticos
2. Indicadores: % cumplimiento general, % por tipo de documento
3. Hallazgos Críticos: lista de trabajadores con problemas graves
4. Trabajadores sin contrato (máxima prioridad)
5. Trabajadores con certificaciones vencidas
6. Discrepancias salariales encontradas
7. Recomendaciones: acciones inmediatas y plan de regularización
8. Detalle por trabajador: resumen individual de cada uno`,
            behavior_prompt: 'Procesa el array de resultados recibido. Genera un reporte ejecutivo completo en JSON con estadísticas globales, hallazgos ordenados por severidad, y recomendaciones accionables. El resumen debe permitir a un gerente de RRHH tomar decisiones inmediatas.',
            response_format: 'JSON',
            output_format_id: null,
            json_schema_id: schemaGenericList.id
        });

        // ═══════════════════════════════════════════════════════════════
        // 13. Pre-built Machines (seeded with full graph)
        // ═══════════════════════════════════════════════════════════════

        // ── Machine 1: Verificación Laboral en Lotes ──
        const machineLotes = await Machine.create({
            id: 'machine-0000-0000-0000-000000000001',
            nombre: 'Verificación Laboral en Lotes',
            descripcion: 'Proceso estándar mensual: ingesta de nómina CSV → iteración por trabajador → validación de liquidación individual → recolección de resultados → reporte ejecutivo consolidado.',
            icono: '🏭',
            activo: true
        });

        // Nodes for Machine 1
        const m1n1 = await MachineNode.create({ id: 'mn-lotes-0001', machine_id: machineLotes.id, node_type: 'tool', tool_id: toolNomina.id, position_x: 50, position_y: 200, config: null });
        const m1n2 = await MachineNode.create({ id: 'mn-lotes-0002', machine_id: machineLotes.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 320, position_y: 200, config: JSON.stringify({ input_field: 'lista' }) });
        const m1n3 = await MachineNode.create({ id: 'mn-lotes-0003', machine_id: machineLotes.id, node_type: 'tool', tool_id: toolValLiqui.id, position_x: 590, position_y: 200, config: null });
        const m1n4 = await MachineNode.create({ id: 'mn-lotes-0004', machine_id: machineLotes.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 200, config: JSON.stringify({ output_field: 'resultados_validacion' }) });
        const m1n5 = await MachineNode.create({ id: 'mn-lotes-0005', machine_id: machineLotes.id, node_type: 'tool', tool_id: toolReporteLote.id, position_x: 1130, position_y: 200, config: null });

        // Connections for Machine 1: linear flow
        await MachineConnection.create({ machine_id: machineLotes.id, source_node_id: m1n1.id, target_node_id: m1n2.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineLotes.id, source_node_id: m1n2.id, target_node_id: m1n3.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineLotes.id, source_node_id: m1n3.id, target_node_id: m1n4.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineLotes.id, source_node_id: m1n4.id, target_node_id: m1n5.id, source_handle: null, target_handle: null });

        // ── Machine 2: Verificación Documental Completa ──
        const machineDocCompleta = await Machine.create({
            id: 'machine-0000-0000-0000-000000000002',
            nombre: 'Verificación Documental Completa',
            descripcion: 'Proceso completo de auditoría: ingesta de nómina → iteración por trabajador → verificación paralela de contrato + certificaciones → recolección → reporte ejecutivo.',
            icono: '🔍',
            activo: true
        });

        // Nodes for Machine 2 (parallel branches for contrato + certificaciones)
        const m2n1 = await MachineNode.create({ id: 'mn-docs-0001', machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolNomina.id, position_x: 50, position_y: 250, config: null });
        const m2n2 = await MachineNode.create({ id: 'mn-docs-0002', machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 320, position_y: 250, config: JSON.stringify({ input_field: 'lista' }) });
        const m2n3 = await MachineNode.create({ id: 'mn-docs-0003', machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolContrato.id, position_x: 590, position_y: 120, config: null });
        const m2n4 = await MachineNode.create({ id: 'mn-docs-0004', machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolCerts.id, position_x: 590, position_y: 380, config: null });
        const m2n5 = await MachineNode.create({ id: 'mn-docs-0005', machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 120, config: JSON.stringify({ output_field: 'contratos_verificados' }) });
        const m2n6 = await MachineNode.create({ id: 'mn-docs-0006', machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 380, config: JSON.stringify({ output_field: 'certificaciones_verificadas' }) });
        const m2n7 = await MachineNode.create({ id: 'mn-docs-0007', machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineMapper.id, position_x: 1130, position_y: 250, config: JSON.stringify({ mappings: [{ from: 'contratos_verificados', to: 'contratos' }, { from: 'certificaciones_verificadas', to: 'certificaciones' }] }) });
        const m2n8 = await MachineNode.create({ id: 'mn-docs-0008', machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolReporteLote.id, position_x: 1400, position_y: 250, config: null });

        // Connections for Machine 2: split flow with parallel branches
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n1.id, target_node_id: m2n2.id, source_handle: null, target_handle: null });
        // Iterator feeds both branches
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n2.id, target_node_id: m2n3.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n2.id, target_node_id: m2n4.id, source_handle: null, target_handle: null });
        // Each branch collects
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n3.id, target_node_id: m2n5.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n4.id, target_node_id: m2n6.id, source_handle: null, target_handle: null });
        // Both collectors merge via mapper
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n5.id, target_node_id: m2n7.id, source_handle: null, target_handle: null });
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n6.id, target_node_id: m2n7.id, source_handle: null, target_handle: null });
        // Mapper outputs to final report
        await MachineConnection.create({ machine_id: machineDocCompleta.id, source_node_id: m2n7.id, target_node_id: m2n8.id, source_handle: null, target_handle: null });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
