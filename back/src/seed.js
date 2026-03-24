const { sequelize, Role, Privilegio, User, Tool, OutputCategory, OutputFormat, JsonSchema, AiProvider, Engine, Visor, Machine, MachineNode, MachineConnection, Input } = require('./models');

require('dotenv').config();

const seed = async () => {
    try {
        await sequelize.sync();
        console.log('Database synced successfully');

        // 1. Create Roles
        const [superAdminRole] = await Role.findOrCreate({ where: { nombre: 'SuperAdmin' } });
        const [adminRole] = await Role.findOrCreate({ where: { nombre: 'Admin' } });
        const [userRole] = await Role.findOrCreate({ where: { nombre: 'User' } });

        // 2. Create Privileges (SuperAdmin wildcard)
        await Privilegio.findOrCreate({
            where: { role_id: superAdminRole.id, ref_modulo: '*' },
            defaults: { read: true, write: true, exec: true }
        });

        // Admin Privileges
        const modules = ['Auth', 'AI_Tool_Maker', 'AI_Tool_Catalog', 'AI_Tool_Execution', 'Config', 'Outputs_Maker', 'Json_Schemas', 'AI_Providers', 'Machines'];
        for (const mod of modules) {
            await Privilegio.findOrCreate({
                where: { role_id: adminRole.id, ref_modulo: mod },
                defaults: { read: true, write: true, exec: true }
            });
        }

        // User Privileges
        await Privilegio.findOrCreate({
            where: { role_id: userRole.id, ref_modulo: 'AI_Tool_Catalog' },
            defaults: { read: true }
        });
        await Privilegio.findOrCreate({
            where: { role_id: userRole.id, ref_modulo: 'AI_Tool_Execution' },
            defaults: { read: true, exec: true }
        });

        // 3. Create SuperAdmin User
        const [user] = await User.findOrCreate({
            where: { email: 'inntek' },
            defaults: {
                nombre: 'Inntek System',
                password: 'admin',
                role_id: superAdminRole.id
            }
        });

        // 4. Create Output Categories
        const [catIdentidad] = await OutputCategory.findOrCreate({
            where: { id: '943c7bb0-0b87-455e-843f-c04437b123c8' },
            defaults: { nombre: 'Identidad y Documentación' }
        });
        const [catReportes] = await OutputCategory.findOrCreate({
            where: { nombre: 'Reportes Ejecutivos' }
        });
        const [catRYCE] = await OutputCategory.findOrCreate({
            where: { nombre: 'RYCE' }
        });

        // ═══════════════════════════════════════════════════════════════
        // 5. Output Formats
        // ═══════════════════════════════════════════════════════════════

        // 5a. Reporte Validacion Cedula Chilena
        const [formatIDCard] = await OutputFormat.findOrCreate({
            where: { id: '911a1355-d121-49ef-9b6c-c4b2ae3b252c' },
            defaults: {
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
            }
        });

        // 5b. Reporte Check Liquidacion Chile
        const [formatCheckLiqui] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e53' },
            defaults: {
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
            }
        });

        // 5c. Reporte TGR Certificado de Deuda
        const [formatTGRDeuda] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e60' },
            defaults: {
                nombre: 'Reporte TGR Certificado de Deuda',
                tipo: 'reporte',
                category_id: catIdentidad.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Certificado de Deuda TGR", "param": "" } },
                    { "id": 2, "type": "label", "data": { "text": "Nombre Contribuyente", "param": "identificacion_deudor.nombre_razon_social" } },
                    { "id": 3, "type": "label", "data": { "text": "RUT", "param": "identificacion_deudor.rut" } },
                    { "id": 4, "type": "subheading", "data": { "text": "Resumen Financiero", "param": "" } },
                    { "id": 5, "type": "label", "data": { "text": "Total Moroso", "param": "resumen_deuda.total_moroso" } },
                    { "id": 6, "type": "label", "data": { "text": "Total No Vencido", "param": "resumen_deuda.total_no_vencido" } },
                    { "id": 7, "type": "label", "data": { "text": "TOTAL DEUDA", "param": "resumen_deuda.total_deuda" } },
                    { "id": 8, "type": "subheading", "data": { "text": "Autenticidad", "param": "" } },
                    { "id": 9, "type": "label", "data": { "text": "Fecha Emisión", "param": "verificacion_autenticidad.fecha_emision" } },
                    { "id": 10, "type": "label", "data": { "text": "Cód. Verificación", "param": "verificacion_autenticidad.codigo_verificacion" } }
                ])
            }
        });

        // 5d. Reporte TGR Resolución de Convenio
        const [formatTGRConvenio] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e61' },
            defaults: {
                nombre: 'Reporte TGR Resolución de Convenio',
                tipo: 'reporte',
                category_id: catIdentidad.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Resolución de Convenio TGR", "param": "" } },
                    { "id": 2, "type": "label", "data": { "text": "Nro Resolución", "param": "metadata_resolucion.nro_resolucion" } },
                    { "id": 3, "type": "label", "data": { "text": "Fecha Resolución", "param": "metadata_resolucion.fecha_resolucion" } },
                    { "id": 4, "type": "label", "data": { "text": "RUT Contribuyente", "param": "identificacion_contribuyente.rut" } },
                    { "id": 5, "type": "subheading", "data": { "text": "Detalles del Plan", "param": "" } },
                    { "id": 6, "type": "label", "data": { "text": "Monto Total", "param": "plan_pagos.monto_total" } },
                    { "id": 7, "type": "label", "data": { "text": "Cantidad Cuotas", "param": "plan_pagos.cantidad_cuotas" } },
                    { "id": 8, "type": "label", "data": { "text": "Valor Cuota aprox", "param": "plan_pagos.valor_cuota_tipo" } },
                    { "id": 9, "type": "label", "data": { "text": "Primer Vencimiento", "param": "plan_pagos.fecha_primer_vencimiento" } }
                ])
            }
        });

        // 5f. Comprobante Resolución Vista RYCE
        const [formatRYCEResolucion] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e70' },
            defaults: {
                nombre: 'Comprobante Resolución Vista RYCE',
                tipo: 'reporte',
                category_id: catRYCE.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Comprobante Resolución RYCE", "param": "" } },
                    { "id": 2, "type": "subheading", "data": { "text": "Identificación Empresa", "param": "" } },
                    { "id": 3, "type": "label", "data": { "text": "RUT Empresa", "param": "identificacion_empresa.rut_empresa" } },
                    { "id": 4, "type": "label", "data": { "text": "Razón Social", "param": "identificacion_empresa.razon_social" } },
                    { "id": 5, "type": "subheading", "data": { "text": "Detalles Resolución", "param": "" } },
                    { "id": 6, "type": "label", "data": { "text": "Tipo Documento", "param": "detalles_resolucion.documento_tipo" } },
                    { "id": 7, "type": "label", "data": { "text": "Nro Resolución", "param": "detalles_resolucion.numero_resolucion" } },
                    { "id": 8, "type": "label", "data": { "text": "Fecha Emisión", "param": "detalles_resolucion.fecha_emision" } },
                    { "id": 9, "type": "subheading", "data": { "text": "Checklist Validación", "param": "" } },
                    { "id": 10, "type": "label", "data": { "text": "Legible", "param": "checklist_validacion.es_legible" } },
                    { "id": 11, "type": "label", "data": { "text": "Íntegro", "param": "checklist_validacion.es_integro" } },
                    { "id": 12, "type": "label", "data": { "text": "Corresponde Contratista", "param": "checklist_validacion.corresponde_al_contratista" } },
                    { "id": 13, "type": "label", "data": { "text": "Corresponde Documento", "param": "checklist_validacion.corresponde_al_documento" } },
                    { "id": 14, "type": "subheading", "data": { "text": "Condiciones de Pago", "param": "" } },
                    { "id": 15, "type": "label", "data": { "text": "Número Cuotas", "param": "condiciones_pago.numero_cuotas" } },
                    { "id": 16, "type": "label", "data": { "text": "Fecha Inicio", "param": "condiciones_pago.fecha_inicio" } },
                    { "id": 17, "type": "label", "data": { "text": "Fecha Vencimiento", "param": "condiciones_pago.fecha_vencimiento" } },
                    { "id": 18, "type": "label", "data": { "text": "Monto Total", "param": "condiciones_pago.monto_total" } },
                    { "id": 19, "type": "label", "data": { "text": "Moneda", "param": "condiciones_pago.moneda" } }
                ])
            }
        });

        // 5g. Certificado Deuda Vista RYCE
        const [formatRYCEDeuda] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e71' },
            defaults: {
                nombre: 'Certificado Deuda Vista RYCE',
                tipo: 'reporte',
                category_id: catRYCE.id,
                estructura: `<div class="bg-[#f0f2f5] p-6 font-sans text-slate-800">
    <!-- Header: Datos Empresa (System Input) -->
    <div class="mb-6 overflow-hidden rounded-lg border border-[#00A3C4] bg-white shadow-sm">
        <div class="bg-[#00A3C4] px-4 py-1">
            <h2 class="text-center text-xs font-bold uppercase tracking-wider text-white">Datos Empresa</h2>
        </div>
        <div class="grid grid-cols-1 divide-y divide-[#00A3C4]/20">
            <div class="flex items-center px-4 py-2 border-b border-[#00A3C4]/20">
                <span class="w-40 text-[11px] font-bold text-[#00A3C4]">Rut Empresa</span>
                <span class="text-sm font-semibold text-slate-700">{{datos_sistema.rut}}</span>
            </div>
            <div class="flex items-center px-4 py-2 border-b border-[#00A3C4]/20">
                <span class="w-40 text-[11px] font-bold text-[#00A3C4]">Nombre o Razón Social</span>
                <span class="text-sm font-semibold text-slate-700 uppercase">{{datos_sistema.nombre}}</span>
            </div>
            <div class="flex items-center px-4 py-2">
                <span class="w-40 text-[11px] font-bold text-[#00A3C4]">Documento</span>
                <span class="text-sm font-semibold text-slate-700">Certificado Deuda Tributaria</span>
            </div>
        </div>
    </div>

    <!-- Evaluation Criteria -->
    <div class="mb-8 border-t border-slate-200 pt-4">
        <h2 class="mb-4 text-3xl font-light text-slate-600">Criterios de evaluación</h2>
        
        <div class="mb-2 text-[10px] font-bold italic text-slate-400">Seleccione si corresponde</div>
        
        <div class="space-y-3">
            <!-- Fecha Emisión row -->
            <div class="flex items-center space-x-3">
                <span class="text-[13px] font-medium text-slate-700">Fecha Emisión:</span>
                <div class="flex items-center bg-yellow-100 border border-yellow-300 rounded px-2 py-1 space-x-2">
                    <span class="text-[13px] font-bold text-slate-800">{{documento.fecha_emision}}</span>
                    <span class="text-slate-500">📅</span>
                </div>
                <div class="w-4 h-4 rounded border-2 border-guardian-blue bg-guardian-blue flex items-center justify-center text-[10px] text-white font-bold">✓</div>
            </div>

            <!-- Checkboxes -->
            <div class="space-y-2 ml-1">
                <div class="flex items-center space-x-2 text-[13px] font-medium text-slate-700">
                    <span class="text-green-600 font-bold text-lg leading-none">✅</span>
                    <span>Es legible</span>
                </div>
                <div class="flex items-center space-x-2 text-[13px] font-medium text-slate-700">
                    <span class="text-green-600 font-bold text-lg leading-none">✅</span>
                    <span>Es íntegro</span>
                </div>
                <div class="flex items-center space-x-2 text-[13px] font-medium text-slate-700">
                    <span class="text-green-600 font-bold text-lg leading-none">✅</span>
                    <span>Corresponde al contratista</span>
                </div>
                <div class="flex items-center space-x-2 text-[13px] font-medium text-slate-700">
                    <span class="text-green-600 font-bold text-lg leading-none">✅</span>
                    <span>Corresponde al documento</span>
                </div>
                <div class="flex items-center space-x-2 text-[13px] font-medium text-slate-700">
                    <span class="text-green-600 font-bold text-lg leading-none">✅</span>
                    <span>Corresponde fecha emisión</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Convenios Vigentes Table -->
    <div class="mb-8 overflow-hidden rounded border border-[#00A3C4] bg-white">
        <div class="bg-[#00A3C4] px-4 py-1">
            <h2 class="text-center text-[11px] font-bold uppercase tracking-wider text-white">Convenios Vigentes</h2>
        </div>
        <table class="w-full text-[10px] uppercase font-bold text-white text-center">
            <thead class="bg-[#00A3C4] border-t border-white/30">
                <tr>
                    <th class="border-r border-white/30 py-1 px-2">Nº</th>
                    <th class="border-r border-white/30 py-1 px-2">Nº DE CUOTAS</th>
                    <th class="border-r border-white/30 py-1 px-2">FECHA VENCIMIENTO</th>
                    <th class="py-1 px-2">DOC</th>
                </tr>
            </thead>
            <tbody class="text-slate-500 bg-[#E8F4F8] italic lowercase">
                <tr>
                    <td colspan="4" class="py-2">Sin convenios registrados</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Debt Summary -->
    <div class="grid grid-cols-2 gap-4 mb-8">
        <div>
            <div class="text-[12px] font-bold text-slate-700 mb-1">Deuda morosa</div>
            <div class="bg-yellow-400 rounded-lg border border-slate-300 px-4 py-2 text-right">
                <span class="text-lg font-bold text-slate-800">{{analisis_deuda.monto_deuda_morosa}}</span>
            </div>
        </div>
        <div>
            <div class="text-[12px] font-bold text-slate-700 mb-1">Deuda no vencida:</div>
            <div class="bg-yellow-400 rounded-lg border border-slate-300 px-4 py-2 text-right">
                <span class="text-lg font-bold text-slate-800">{{analisis_deuda.monto_deuda_no_vencida}}</span>
            </div>
        </div>
    </div>

    <!-- Actions placeholder -->
    <div class="mt-10 pt-6 border-t border-slate-200">
        <div class="flex items-center space-x-2 text-[12px] font-medium text-slate-600 mb-4">
            <div class="w-4 h-4 border border-slate-400 rounded bg-white"></div>
            <span>Enviar correo de notificación para documento rechazado.</span>
        </div>
        
        <div class="mb-4">
            <div class="text-[12px] font-medium text-slate-600 mb-2">Ingrese un comentario del documento (Opcional)</div>
            <textarea class="w-full border border-slate-300 rounded p-4 h-32 bg-white"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <button class="bg-[#f0f2f5] border border-slate-400 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors">Habilitar</button>
            <button class="bg-[#f0f2f5] border border-slate-400 py-2 font-medium text-slate-700 hover:bg-slate-100 transition-colors">Rechazar</button>
        </div>
    </div>
</div>`
            }
        });
        const [formatLiquidacionesDemo] = await OutputFormat.findOrCreate({
            where: { id: 'ab000001-0000-4000-a000-000000000005' },
            defaults: {
                nombre: 'Matriz de Liquidaciones (Demo)',
                tipo: 'reporte',
                category_id: catReportes.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Análisis de Liquidaciones y Movimientos en Lote", "param": "" } },
                    {
                        "id": 2,
                        "type": "table",
                        "data": {
                            "param": "lista",
                            "columns": [
                                { "header": "Periodo", "mapping": "id_periodo" },
                                { "header": "RUT", "mapping": "datos_personales.rut" },
                                { "header": "Nombre", "mapping": "datos_personales.nombre" },
                                { "header": "F. Ingreso", "mapping": "datos_personales.fecha_ingreso" },
                                { "header": "Contrato", "mapping": "datos_personales.tipo_contrato" },
                                { "header": "Estado Trab.", "mapping": "datos_personales.estado_trabajador" },
                                { "header": "Días Trab.", "mapping": "liquidacion.dias_trabajados" },
                                { "header": "Sueldo Base", "mapping": "liquidacion.sueldo_base" },
                                { "header": "Gratificación", "mapping": "liquidacion.gratificacion" },
                                { "header": "Imponible", "mapping": "liquidacion.imponible" },
                                { "header": "No Imp.", "mapping": "liquidacion.total_no_imponible" },
                                { "header": "Total Haberes", "mapping": "liquidacion.total_haberes" },
                                { "header": "Líquido", "mapping": "liquidacion.liquido_a_pagar" },
                                { "header": "Pago", "mapping": "liquidacion.metodo_pago" },
                                { "header": "AFP", "mapping": "cotizaciones.afp.nombre" },
                                { "header": "% AFP", "mapping": "cotizaciones.afp.tasa_porcentaje" },
                                { "header": "AFP Liq.", "mapping": "cotizaciones.afp.monto_liquidacion" },
                                { "header": "AFP Prev.", "mapping": "cotizaciones.afp.monto_previred" },
                                { "header": "Fonasa 1.6", "mapping": "cotizaciones.salud.fonasa_1_6" },
                                { "header": "Caja 5.4", "mapping": "cotizaciones.salud.caja_5_4" },
                                { "header": "Total Salud", "mapping": "cotizaciones.salud.total_salud_liq" },
                                { "header": "Isapre 7%", "mapping": "cotizaciones.salud.isapre_7_pct" },
                                { "header": "Seg. Soc.", "mapping": "cotizaciones.seguros.seguro_social" },
                                { "header": "Mutual", "mapping": "cotizaciones.seguros.mutual" },
                                { "header": "SIS", "mapping": "cotizaciones.seguros.sis" },
                                { "header": "Sc. Cesantía", "mapping": "cotizaciones.seguros.cesantia_empleador" },
                                { "header": "Licencia Días", "mapping": "novedades.licencia_medica.dias" },
                                { "header": "Licencia Monto", "mapping": "novedades.licencia_medica.monto_contingencia" },
                                { "header": "F. Desvincul.", "mapping": "finiquito.fecha_desvinculacion" },
                                { "header": "Causal", "mapping": "finiquito.causal_termino" },
                                { "header": "Monto Ratif.", "mapping": "finiquito.monto_ratificado" },
                                { "header": "F. Prop.", "mapping": "finiquito.feriado_proporcional" },
                                { "header": "IAS", "mapping": "finiquito.ias" },
                                { "header": "Concepto Prev.", "mapping": "movimiento_personal.concepto_previred" }
                            ]
                        }
                    }
                ])
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 6. JSON Schemas
        // ═══════════════════════════════════════════════════════════════

        // 6a. Esquema de Identidad Avanzado V2 (para Validador CI Chile)
        const [schemaID] = await JsonSchema.findOrCreate({
            where: { id: 'cfa9753a-cc98-46cb-806e-cbed4208be4a' },
            defaults: {
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
            }
        });

        // 6b. Reporte Check Liqui Chile (para Check de Liquidaciones)
        const [schemaCheckLiqui] = await JsonSchema.findOrCreate({
            where: { id: '91b20865-b18c-4927-b711-abb751fd2212' },
            defaults: {
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
            }
        });

        // 6c. TGR Certificado de Deuda
        const [schemaTGRDeuda] = await JsonSchema.findOrCreate({
            where: { id: '91b20865-b18c-4927-b711-abb751fd2220' },
            defaults: {
                nombre: 'Esquema TGR Certificado de Deuda',
                descripcion: 'Estructura para validación de deudas fiscales y territoriales de la TGR',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "required": ["identificacion_deudor", "resumen_deuda", "detalle_obligaciones", "verificacion_autenticidad"],
                    "properties": {
                        "identificacion_deudor": {
                            "type": "object",
                            "required": ["rut", "nombre_razon_social"],
                            "properties": {
                                "rut": { "type": "string" },
                                "nombre_razon_social": { "type": "string" },
                                "direccion": { "type": "string" },
                                "rol_propiedad": { "type": "string", "description": "Si aplica (Contribuciones)" }
                            }
                        },
                        "resumen_deuda": {
                            "type": "object",
                            "required": ["total_moroso", "total_no_vencido"],
                            "properties": {
                                "total_moroso": { "type": "number" },
                                "total_no_vencido": { "type": "number" },
                                "total_deuda": { "type": "number" },
                                "moneda": { "type": "string", "default": "CLP" }
                            }
                        },
                        "detalle_obligaciones": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "required": ["folio", "vencimiento", "neto", "total"],
                                "properties": {
                                    "tipo_impuesto": { "type": "string" },
                                    "folio": { "type": "string" },
                                    "periodo": { "type": "string" },
                                    "vencimiento": { "type": "string" },
                                    "neto": { "type": "number" },
                                    "reajustes": { "type": "number" },
                                    "intereses_multas": { "type": "number" },
                                    "total": { "type": "number" }
                                }
                            }
                        },
                        "verificacion_autenticidad": {
                            "type": "object",
                            "required": ["codigo_verificacion", "fecha_emision"],
                            "properties": {
                                "codigo_verificacion": { "type": "string" },
                                "fecha_emision": { "type": "string" },
                                "url_verificacion": { "type": "string", "default": "https://www.tgr.cl/oficina-virtual/verificar-documento/" }
                            }
                        }
                    }
                })
            }
        });

        // 6d. TGR Resolución de Convenio
        const [schemaTGRConvenio] = await JsonSchema.findOrCreate({
            where: { id: '91b20865-b18c-4927-b711-abb751fd2221' },
            defaults: {
                nombre: 'Esquema TGR Resolución de Convenio',
                descripcion: 'Estructura para validación de convenios de pago y resoluciones TGR',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "required": ["metadata_resolucion", "identificacion_contribuyente", "plan_pagos"],
                    "properties": {
                        "metadata_resolucion": {
                            "type": "object",
                            "required": ["nro_resolucion", "fecha_resolucion"],
                            "properties": {
                                "nro_resolucion": { "type": "string" },
                                "fecha_resolucion": { "type": "string" },
                                "tipo_convenio": { "type": "string" }
                            }
                        },
                        "identificacion_contribuyente": {
                            "type": "object",
                            "required": ["rut", "nombre"],
                            "properties": {
                                "rut": { "type": "string" },
                                "nombre": { "type": "string" }
                            }
                        },
                        "plan_pagos": {
                            "type": "object",
                            "required": ["monto_total", "cantidad_cuotas"],
                            "properties": {
                                "monto_total": { "type": "number" },
                                "cantidad_cuotas": { "type": "number" },
                                "valor_cuota_tipo": { "type": "number" },
                                "fecha_primer_vencimiento": { "type": "string" },
                                "estado": { "type": "string" }
                            }
                        },
                        "detalle_cuotas": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "nro_cuota": { "type": "number" },
                                    "vencimiento": { "type": "string" },
                                    "monto": { "type": "number" }
                                }
                            }
                        }
                    }
                })
            }
        });

        // 6f. Esquema Comprobante Resolución Vista RYCE
        const [schemaRYCEResolucion] = await JsonSchema.findOrCreate({
            where: { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a01' },
            defaults: {
                nombre: 'Esquema Comprobante Resolución Vista RYCE',
                descripcion: 'Esquema para la validación de resoluciones RYCE',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "Esquema Comprobante Resolución Vista RYCE",
                    "type": "object",
                    "required": ["identificacion_empresa", "detalles_resolucion", "checklist_validacion", "condiciones_pago"],
                    "properties": {
                        "identificacion_empresa": {
                            "type": "object",
                            "required": ["rut_empresa", "razon_social"],
                            "properties": {
                                "rut_empresa": { "type": "string", "pattern": "^\\d{1,2}(\\.\\d{3}){2}-[\\dkK]$" },
                                "razon_social": { "type": "string" }
                            }
                        },
                        "detalles_resolucion": {
                            "type": "object",
                            "required": ["documento_tipo", "numero_resolucion", "fecha_emision"],
                            "properties": {
                                "documento_tipo": { "type": "string", "const": "CONVENIO DEUDA TRIBUTARIA" },
                                "numero_resolucion": { "type": "string" },
                                "fecha_emision": { "type": "string", "format": "date" }
                            }
                        },
                        "checklist_validacion": {
                            "type": "object",
                            "required": ["es_legible", "es_integro", "corresponde_al_contratista", "corresponde_al_documento"],
                            "properties": {
                                "es_legible": { "type": "boolean" },
                                "es_integro": { "type": "boolean" },
                                "corresponde_al_contratista": { "type": "boolean" },
                                "corresponde_al_documento": { "type": "boolean" }
                            }
                        },
                        "condiciones_pago": {
                            "type": "object",
                            "required": ["numero_cuotas", "fecha_inicio", "fecha_vencimiento", "monto_total"],
                            "properties": {
                                "numero_cuotas": { "type": "integer", "minimum": 1 },
                                "fecha_inicio": { "type": "string", "format": "date" },
                                "fecha_vencimiento": { "type": "string", "format": "date" },
                                "monto_total": { "type": "number", "minimum": 0 },
                                "moneda": { "type": "string", "default": "CLP" }
                            }
                        }
                    }
                })
            }
        });

        // 6g. Certificado Deuda Vista RYCE
        const [schemaRYCEDeuda] = await JsonSchema.findOrCreate({
            where: { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a02' },
            defaults: {
                nombre: 'Esquema Certificado Deuda Vista RYCE',
                descripcion: 'Esquema para la validación de certificados de deuda RYCE',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "Certificado Deuda Vista RYCE",
                    "type": "object",
                    "required": ["empresa", "documento", "validacion_calidad", "analisis_deuda"],
                    "properties": {
                        "empresa": {
                            "type": "object",
                            "required": ["rut_empresa", "razon_social"],
                            "properties": {
                                "rut_empresa": { "type": "string", "pattern": "^\\d{1,2}(\\.\\d{3}){2}-[\\dkK]$" },
                                "razon_social": { "type": "string" }
                            }
                        },
                        "documento": {
                            "type": "object",
                            "required": ["tipo", "fecha_emision"],
                            "properties": {
                                "tipo": { "type": "string", "const": "CONVENIO DEUDA TRIBUTARIA" },
                                "fecha_emision": { "type": "string", "format": "date" }
                            }
                        },
                        "validacion_calidad": {
                            "type": "object",
                            "required": ["es_legible", "es_integro", "corresponde_al_contratista", "corresponde_al_documento", "corresponde_fecha_emision"],
                            "properties": {
                                "es_legible": { "type": "boolean" },
                                "es_integro": { "type": "boolean" },
                                "corresponde_al_contratista": { "type": "boolean" },
                                "corresponde_al_documento": { "type": "boolean" },
                                "corresponde_fecha_emision": { "type": "boolean" }
                            }
                        },
                        "analisis_deuda": {
                            "type": "object",
                            "required": ["monto_deuda_morosa", "monto_deuda_no_vencida"],
                            "properties": {
                                "monto_deuda_morosa": { "type": "number", "minimum": 0 },
                                "monto_deuda_no_vencida": { "type": "number", "minimum": 0 },
                                "moneda": { "type": "string", "default": "CLP" }
                            }
                        }
                    }
                })
            }
        });

        const [schemaLiquidacionesLote] = await JsonSchema.findOrCreate({
            where: { id: 'ab000001-0000-4000-a000-000000000002' },
            defaults: {
                nombre: 'Esquema Listado de Liquidaciones y Movimientos de Personal',
                descripcion: 'Estructura para el análisis masivo de liquidaciones coordinado con movimientos de personal y Previred.',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "Listado de Liquidaciones y Movimientos de Personal",
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["id_periodo", "datos_personales", "liquidacion"],
                        "properties": {
                            "id_periodo": {
                                "type": "string",
                                "description": "Identificador único del periodo de liquidación (ej: 1090701-2026)"
                            },
                            "datos_personales": {
                                "type": "object",
                                "properties": {
                                    "rut": { "type": "string", "pattern": "^\\d{1,2}\\.\\d{3}\\.\\d{3}-[0-9kK]$" },
                                    "nombre": { "type": "string" },
                                    "fecha_ingreso": { "type": "string", "format": "date" },
                                    "tipo_contrato": { "type": "string", "enum": ["Indefinido", "Plazo Fijo", "NUEVO", "Jubilado"] },
                                    "estado_trabajador": { "type": "string" }
                                }
                            },
                            "liquidacion": {
                                "type": "object",
                                "properties": {
                                    "dias_trabajados": { "type": "integer", "minimum": 0, "maximum": 30 },
                                    "sueldo_base": { "type": "number" },
                                    "gratificacion": { "type": "number" },
                                    "imponible": { "type": "number" },
                                    "total_no_imponible": { "type": "number" },
                                    "total_haberes": { "type": "number" },
                                    "liquido_a_pagar": { "type": "number" },
                                    "metodo_pago": { "type": "string" },
                                    "estado": { "type": "string" }
                                }
                            },
                            "cotizaciones": {
                                "type": "object",
                                "properties": {
                                    "afp": {
                                        "type": "object",
                                        "properties": {
                                            "nombre": { "type": "string" },
                                            "tasa_porcentaje": { "type": "number" },
                                            "monto_liquidacion": { "type": "number" },
                                            "monto_previred": { "type": "number" }
                                        }
                                    },
                                    "salud": {
                                        "type": "object",
                                        "properties": {
                                            "fonasa_1_6": { "type": "number" },
                                            "caja_5_4": { "type": "number" },
                                            "total_salud_liq": { "type": "number" },
                                            "isapre_7_pct": { "type": "number" }
                                        }
                                    },
                                    "seguros": {
                                        "type": "object",
                                        "properties": {
                                            "seguro_social": { "type": "number" },
                                            "mutual": { "type": "number" },
                                            "sis": { "type": "number" },
                                            "cesantia_empleador": { "type": "number" }
                                        }
                                    }
                                }
                            },
                            "novedades": {
                                "type": "object",
                                "properties": {
                                    "licencia_medica": {
                                        "type": "object",
                                        "properties": {
                                            "dias": { "type": "integer" },
                                            "comentario": { "type": "string" },
                                            "monto_contingencia": { "type": "number" }
                                        }
                                    }
                                }
                            },
                            "finiquito": {
                                "type": "object",
                                "properties": {
                                    "fecha_desvinculacion": { "type": "string" },
                                    "causal_termino": { "type": "string" },
                                    "monto_ratificado": { "type": "number" },
                                    "feriado_proporcional": { "type": "number" },
                                    "ias": { "type": "number" },
                                    "aviso_previo": { "type": "number" },
                                    "estado": { "type": "string" }
                                }
                            },
                            "movimiento_personal": {
                                "type": "object",
                                "properties": {
                                    "concepto_previred": { "type": "string" },
                                    "comentario": { "type": "string" }
                                }
                            }
                        }
                    }
                })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 7. AI Providers
        // ═══════════════════════════════════════════════════════════════

        // 7. AI Providers
        const [providerGoogle] = await AiProvider.findOrCreate({
            where: { slug: 'google' },
            defaults: {
                nombre: 'Google Gemini',
                tipo: 'google_native',
                base_url: null,
                modelo: 'gemini-2.5-flash',
                is_default: true,
                activo: true,
                extra_headers: null
            }
        });

        const [providerOpenRouter] = await AiProvider.findOrCreate({
            where: { slug: 'openrouter' },
            defaults: {
                nombre: 'OpenRouter',
                tipo: 'openai_compatible',
                base_url: 'https://openrouter.ai/api/v1',
                modelo: 'google/gemini-2.0-flash-lite',
                is_default: false,
                activo: true,
                extra_headers: JSON.stringify({
                    'HTTP-Referer': 'https://inntek-ai-api-agent-client.onrender.com',
                    'X-Title': 'Inntek AI Agent'
                })
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 8. Engines (System-level list processors for Machines)
        // ═══════════════════════════════════════════════════════════════

        const [engineIterator] = await Engine.findOrCreate({
            where: { slug: 'list-iterator' },
            defaults: {
                nombre: 'List Iterator',
                descripcion: 'Receives an array from a connected Tool output and executes the next connected Tool once per item in the list.',
                tipo: 'iterator',
                icono: '🔄',
                config_schema: JSON.stringify({ input_field: 'string', description: 'Field name from source output that contains the array' }),
                activo: true
            }
        });

        const [engineCollector] = await Engine.findOrCreate({
            where: { slug: 'list-collector' },
            defaults: {
                nombre: 'List Collector',
                descripcion: 'Aggregates individual outputs from a connected Tool into a single consolidated array.',
                tipo: 'collector',
                icono: '📦',
                config_schema: JSON.stringify({ output_field: 'string', description: 'Field name for the collected array in the output' }),
                activo: true
            }
        });

        const [engineMapper] = await Engine.findOrCreate({
            where: { slug: 'data-mapper' },
            defaults: {
                nombre: 'Data Mapper',
                descripcion: 'Transforms and maps fields between Tool inputs and outputs. Define field mappings to reshape data between nodes.',
                tipo: 'mapper',
                icono: '🔀',
                config_schema: JSON.stringify({ mappings: 'array', description: 'Array of {from, to} field mapping objects' }),
                activo: true
            }
        });

        const [engineApiConsumer] = await Engine.findOrCreate({
            where: { slug: 'api-consumer' },
            defaults: {
                nombre: 'API Consumer',
                descripcion: 'Ejecuta peticiones HTTP a APIs externas. Si es POST/PUT, el input del nodo anterior se enviará como body JSON.',
                tipo: 'api-consumer',
                icono: '🌐',
                config_schema: JSON.stringify({
                    url: { type: 'string', description: 'URL del endpoint (ej. https://api.ejemplo.com/v1/data)' },
                    method: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'Método HTTP' },
                    headers: { type: 'text', description: 'Headers adicionales en formato JSON (ej. {"Authorization": "Bearer token"})' }
                }),
                activo: true
            }
        });

        const [enginePrinter] = await Engine.findOrCreate({
            where: { slug: 'printer' },
            defaults: {
                nombre: 'PRINTER',
                descripcion: 'Engine de salida que pasa los datos como JSON. Úsalo con un VISOR para ver los resultados.',
                tipo: 'output',
                icono: '🖨️',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [engineConverter] = await Engine.findOrCreate({
            where: { slug: 'json-converter' },
            defaults: {
                nombre: 'JSON Converter',
                descripcion: 'Convierte bidireccionalmente entre string JSON y objeto. Si recibe string lo convierte a objeto, y viceversa.',
                tipo: 'converter',
                icono: '🔄',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [engineEntityExtractor] = await Engine.findOrCreate({
            where: { slug: 'json-entity-extractor' },
            defaults: {
                nombre: 'Entity Extractor',
                descripcion: 'Analiza una estructura JSON para identificar y extraer la colección principal de entidades como un array plano.',
                tipo: 'extractor',
                icono: '📂',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [engineCsvConverter] = await Engine.findOrCreate({
            where: { slug: 'csv-converter' },
            defaults: {
                nombre: 'CSV Tabulator',
                descripcion: 'Convierte un listado de objetos en un archivo CSV tabulado (separado por ;) listo para Excel.',
                tipo: 'output',
                icono: '📊',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [engineComparator] = await Engine.findOrCreate({
            where: { slug: 'data-comparator' },
            defaults: {
                nombre: 'Data Comparator',
                descripcion: 'Compara dos objetos JSON y genera un reporte detallado columna por columna (data vs doc) con porcentaje de match.',
                tipo: 'mapper',
                icono: '⚖️',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [engineCherryPick] = await Engine.findOrCreate({
            where: { slug: 'cherry-pick' },
            defaults: {
                nombre: 'Cherry pick',
                descripcion: 'Selecciona un elemento o ruta específica de un JSON (ej: analisis_deuda.moneda) para entregarlo como salida.',
                tipo: 'extractor',
                icono: '🍒',
                config_schema: JSON.stringify({
                    field: { type: 'string', description: 'Campo o ruta JSON a extraer (ej: empresa.rut)' }
                }),
                activo: true
            }
        });

        const [engineCore] = await Engine.findOrCreate({
            where: { slug: 'core' },
            defaults: {
                nombre: 'CORE Engine',
                descripcion: 'Engine central para mapeo de datos en input y output, soportando entrada manual JSON o datos de herramientas/engines previos.',
                tipo: 'mapper',
                icono: '🧠',
                config_schema: JSON.stringify({
                    manual_input: { type: 'textarea', description: 'Entrada manual en formato JSON (opcional base)' },
                    input_mapping: { type: 'smart-mapper', description: 'Abrir Mapeador de Entrada' },
                    output_mapping: { type: 'smart-mapper', description: 'Abrir Mapeador de Salida' }
                }),
                activo: true
            }
        });
        // Force update to ensure existing databases (localhost/render) pick up schema changes
        await engineCore.update({
            tipo: 'mapper',
            config_schema: JSON.stringify({
                manual_input: { type: 'textarea', description: 'Entrada manual en formato JSON (opcional base)' },
                input_mapping: { type: 'smart-mapper', description: 'Abrir Mapeador de Entrada' },
                output_mapping: { type: 'smart-mapper', description: 'Abrir Mapeador de Salida' }
            })
        });

        const [engineLinkFile] = await Engine.findOrCreate({
            where: { slug: 'link-file' },
            defaults: {
                nombre: 'Descargador Link-File',
                descripcion: 'Descarga un archivo desde una URL pública y lo provee como archivo de entrada a las Herramientas (Tools) conectadas.',
                tipo: 'utility',
                icono: '🔗',
                config_schema: JSON.stringify({
                    file_url: { type: 'string', description: 'URL del archivo a descargar' }
                }),
                activo: true
            }
        });
        await engineLinkFile.update({
            tipo: 'utility',
            config_schema: JSON.stringify({
                file_url: { type: 'string', description: 'URL del archivo a descargar' }
            })
        });

        // ═══════════════════════════════════════════════════════════════
        // 9. Visores
        // ═══════════════════════════════════════════════════════════════

        const [visorMessage] = await Visor.findOrCreate({
            where: { slug: 'message-visor' },
            defaults: {
                nombre: 'MENSAJE',
                descripcion: 'Muestra el resultado como un mensaje flotante minimalista.',
                icono: '💬',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [visorTable] = await Visor.findOrCreate({
            where: { slug: 'table-visor' },
            defaults: {
                nombre: 'TABLA',
                descripcion: 'Muestra los datos en un formato de tabla estructurada.',
                icono: '📊',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        const [visorDocument] = await Visor.findOrCreate({
            where: { slug: 'document-visor' },
            defaults: {
                nombre: 'DOCUMENTO',
                descripcion: 'Visualizador de documentos con formato HTML canónico.',
                icono: '📄',
                config_schema: JSON.stringify({}),
                activo: true
            }
        });

        // 10. AI Tools

        // 7a. Validador de CI Chile
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000001' },
            defaults: {
                nombre: 'Validador de CI Chile',
                descripcion: 'Experto Validador de CI Chilenas con Estructura de Alta Definición',
                logo_herramienta: '🆔',
                training_prompt: 'Actúa como experto validador de cédulas chilenas. Analiza la imagen y extrae datos. Mapea la respuesta estrictamente a los campos: analisis_documento.tipo_documento, validacion_punto_por_punto.nombre.match, validacion_punto_por_punto.rut.match, verificacion_consistencia.validacion_dv_rut, verificacion_consistencia.validacion_mrz, verificacion_consistencia.integridad_datos y nota_final.',
                behavior_prompt: 'Responde siempre con un JSON estructurado siguiendo el esquema proporcionado. Sé preciso con los matches de texto y verifica la integridad MRZ e ICAO.',
                response_format: 'JSON',
                categoria: 'Extractora',
                output_format_id: formatIDCard.id,
                json_schema_id: schemaID.id
            }
        });

        // 7b. CSS EXTRACTOR
        await Tool.findOrCreate({
            where: { id: 'edb84cda-584d-4a2c-8187-15f51fdf0884' },
            defaults: {
                nombre: 'CSS EXTRACTOR',
                descripcion: 'Extrae los estilos css de una captura en imagen de una interfaz de usuario',
                logo_herramienta: '🎨',
                categoria: 'Extractora',
                training_prompt: 'ACTUA COMO INGENIERO DE SOFTWARE EXPERTO EN CSS y TAMBIEN COMO EXPERTO ANALISTA DE IMAGENES Y EXPERTO EN EXPERIENCIA DE USUARIO E INTERFACES WEB',
                behavior_prompt: 'analiza la imagen adjunta y extrae todo estilo css para generar un bloque de codigo css que contenga las reglas anidadas que se requiere para generar una interfaz con el estilo descubierto en el analisis de la imagen, con el mismo aspecto de fuentes, tamaños, colores, bordes. sombras etc.',
                response_format: 'JSON',
                output_format_id: null,
                json_schema_id: null
            }
        });

        // 7c. Check de Liquidaciones Chile
        await Tool.findOrCreate({
            where: { id: 'f339b2d6-b8da-4697-ab86-d9fc2136f90a' },
            defaults: {
                nombre: 'Check de Liquidaciones Chile',
                descripcion: 'Elementos Clave a Validar:\nIdentificación: Datos del empleador y trabajador (RUT, fecha contrato).\nHaberes Imponibles: Sueldo base, gratificaciones, bonos, comisiones, horas extras. Sobre esto se calculan descuentos.\nHaberes No Imponibles: Asignaciones de movilización, colación, viáticos (no tributan).\nDescuentos Legales:\nPrevisión: AFP (sistema de pensiones).\nSalud: Fonasa (7%) o Isapre (monto pactado).\nSeguro de Cesantía: AFC.\nImpuesto Único: (Cuando corresponda).\nDescuentos Voluntarios: Ahorros previsionales, Caja de Compensación, créditos.\nTotal Haberes, Descuentos y Sueldo Líquido.\nFirma: O constancia de recepción, lo cual valida el pago ante discrepancias.',
                logo_herramienta: '💵',
                training_prompt: 'actua como un experto verificador y validador de liquidaciones de sueldo en chile, tu objetivo unico será analizar un archivo de liquidacion de sueldo adjunto para extraer toda su informacion y validarla contra la indormacion recibida en #DATA#',
                behavior_prompt: 'Analiza este recibo de salario,Elementos Clave a Validar:\nIdentificación: Datos del empleador y trabajador (RUT, fecha contrato).\nHaberes Imponibles: Sueldo base, gratificaciones, bonos, comisiones, horas extras. Sobre esto se calculan descuentos.\nHaberes No Imponibles: Asignaciones de movilización, colación, viáticos (no tributan).\nDescuentos Legales:\nPrevisión: AFP (sistema de pensiones).\nSalud: Fonasa (7%) o Isapre (monto pactado).\nSeguro de Cesantía: AFC.\nImpuesto Único: (Cuando corresponda).\nDescuentos Voluntarios: Ahorros previsionales, Caja de Compensación, créditos.\nTotal Haberes, Descuentos y Sueldo Líquido.\nFirma: O constancia de recepción, lo cual valida el pago ante discrepancias.\n\ncompara la data obtenida del analisis del archivo adjunto con la data proporcionada en #DATA# y genera una respuesta con el resultado de tu analisis comparativo de ambas datas',
                response_format: 'JSON',
                output_format_id: formatCheckLiqui.id,
                json_schema_id: schemaCheckLiqui.id
            }
        });

        // 11. Generic List Schema (for Machine list-output tools)
        // ═══════════════════════════════════════════════════════════════

        const [schemaGenericList] = await JsonSchema.findOrCreate({
            where: { id: 'ab000001-0000-4000-a000-000000000001' },
            defaults: {
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
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 11. List-Generating Tools (for Machine flows)
        // ═══════════════════════════════════════════════════════════════

        // 11a. CSV Data Extractor — extracts structured lists from CSV data
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000010' },
            defaults: {
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
            }
        });

        // 11b. Fleet Inventory Analyzer — analyzes vehicle/machinery fleets
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000011' },
            defaults: {
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
            }
        });

        // 11c. Document Compliance Checker — checks docs per entity from a list
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000012' },
            defaults: {
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
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 12. Labor Verification Tool Kit
        // ═══════════════════════════════════════════════════════════════

        // 12a. Extractor de Nómina — ingests payroll CSV/data and outputs worker list
        const [toolNomina] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000020' },
            defaults: {
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
            }
        });

        // 12b. Validador de Liquidación Individual — validates one payslip
        const [toolValLiqui] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000021' },
            defaults: {
                nombre: 'Validador de Liquidación Individual',
                descripcion: 'Recibe los datos de UN trabajador y valida su liquidación de sueldo: verifica cálculos de haberes imponibles, descuentos legales (AFP, Salud 7%, AFC), gratificación legal, y sueldo líquido. Diseñada para uso iterativo en Machines.',
                logo_herramienta: '🧮',
                training_prompt: `Eres un experto en legislación laboral chilena and validación de liquidaciones de sueldo.
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
            }
        });

        // 12c. Verificador de Contrato — validates employment contract
        const [toolContrato] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000022' },
            defaults: {
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
            }
        });

        // 12d. Verificador de Certificaciones — checks licenses and certs
        const [toolCerts] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000023' },
            defaults: {
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
            }
        });

        // 12e. Generador de Reporte de Lote — aggregates batch results
        const [toolReporteLote] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000024' },
            defaults: {
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
                behavior_prompt: 'Procesa the array de resultados recibido. Genera un reporte ejecutivo completo en JSON con estadísticas globales, hallazgos ordenados por severidad, y recomendaciones accionables. El resumen debe permitir a un gerente de RRHH tomar decisiones inmediatas.',
                response_format: 'JSON',
                output_format_id: null,
                json_schema_id: schemaGenericList.id
            }
        });

        // 12f. Demo Liquidaciones — Specialized extractor for payroll and COTI
        const [toolDemoLiqui] = await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000030' },
            defaults: {
                nombre: 'Demo Liquidaciones',
                descripcion: 'Extracción experta de datos de liquidaciones y cotizaciones (COTI) con formato pipe-separated.',
                logo_herramienta: '📑',
                training_prompt: `Eres un experto en extracción de datos de documentos laborales chilenos.
Tu objetivo es analizar Liquidaciones de Sueldo y Documentos de Cotización (COTI) y extraer la información estrictamente como se solicita.

REGLAS PARA LIQUIDACIONES:
Para cada liquidación, genera una línea con valores separados por pipes (|):
NUMERO|RUT|PERIODO(MM-YYYY)|DIAS|SUELDO BASE|DSCTO DIAS NO TRAB|GRATIFICACION|TOTAL IMPONIBLE|TOTAL NO IMPONIBLES|TOTAL HABERES|INDEMNIZACIONES|LIQUIDO A PAGO

REGLAS PARA COTI:
CODIGO|RUT|FECHA DE CARGO|IMPONIBLE|### COTIZACION OBLIGATORIA|!!! ISAPRE|... SEGURO SOCIAL|% FONASA|&&& MUTUAL|/// CAJA COMPENSACION

IMPORTANTE:
- NO realices cálculos. Solo copia y pega.
- Si no ves el RUT, escribe "SIN RUT".
- Si no ves un valor, escribe "NO VEO VALOR".
- RUTs con puntos, guion y sin cero a la izquierda.`,
                behavior_prompt: `PROCESAMIENTO DE LIQUIDACIONES:
Para cada una de las liquidaciones del PDF, genera el resumen pipe-separated siguiendo este orden y formato:
NUMERO DE LIQUIDACION|RUT DEL TRABAJADOR|PERIODO DE LA LIQUIDACION|DIAS TRABAJADOS|SUELDO BASE|total por DESCUENTO POR DIAS NO TRABAJADOS|GRATIFICACION|TOTAL IMPONIBLE|TOTAL NO IMPONIBLES|TOTAL HABERES|INDEMNIZACION POR VACACIONES...|LIQUIDO A PAGO

PROCESAMIENTO DE COTI:
RESUME Y ESTRUCTURA SEPARANDO POR "|" DE LA SIGUIENTE FORMA:
CODIGO|RUT|FECHA DE CARGO|IMPONIBLE|### COTIZACION OBLIGATORIA|!!! ISAPRE|... SEGURO SOCIAL|% FONASA|&&& MUTUAL|/// CAJA COMPENSACION

Suma los dos valores de "COTIZACION OBLIGATORIA" si aparecen dos. Reemplaza comas por puntos en los miles.`,
                response_format: 'JSON',
                output_format_id: formatLiquidacionesDemo.id,
                json_schema_id: schemaGenericList.id
            }
        });

        // 12g. Validador de Certificado de Deuda TGR
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000040' },
            defaults: {
                nombre: 'Validador de Certificado de Deuda TGR',
                descripcion: 'Analista experto en Certificados de Deuda de la Tesorería General de la República. Verifica deudas fiscales, territoriales y autenticidad del documento.',
                logo_herramienta: '🏛️',
                training_prompt: `ACTUA COMO UN EXPERTO ANALISTA TRIBUTARIO DE LA TESORERÍA GENERAL DE LA REPÚBLICA DE CHILE.
Tu objetivo es analizar certificados de deuda emitidos por TGR para extraer información precisa y validar la autenticidad del documento.

CAMPOS CRÍTICOS A EXTRAER:
            1. Identificación: RUT(con puntos y guion), Nombre / Razón Social, Rol de Propiedad(si aplica).
2. Resumen Financiero: Total Moroso, Total No Vencido, Reajustes, Intereses y Multas.
3. Detalle de Obligaciones: Listado de cada impuesto adeudado(Folio, Periodo, Vencimiento, Monto).
4. Seguridad: Código de Verificación de autenticidad y Fecha de Emisión.

REGLAS DE NEGOCIO:
            - Los montos deben ser tratados como números sin decimales(CLP).
- Si el documento indica "SIN DEUDA", el total moroso debe ser 0.
        - El Código de Verificación es esencial para la validez legal.`,
                behavior_prompt: 'Procesa el documento adjunto. Genera un JSON que siga estrictamente el esquema de TGR Deuda. Asegúrate de capturar cada ítem de la tabla de deudas en el array detalle_obligaciones. Si se proporcionan datos de la empresa en las instrucciones del prompt (instrucciones del sistema), inclúyelos en el JSON de respuesta bajo la clave "datos_sistema" (ej: { "rut": "...", "nombre": "..." }). Si algún campo no es visible, usa null o 0 según corresponda.',
                response_format: 'JSON',
                output_format_id: formatTGRDeuda.id,
                json_schema_id: schemaTGRDeuda.id
            }
        });

        // 12h. Validador de COMPROBANTE DE RESOLUCIÓN de convenio TGR
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000041' },
            defaults: {
                nombre: 'Validador de COMPROBANTE DE RESOLUCIÓN de convenio TGR',
                descripcion: 'Analista experto en convenios de pago TGR. Verifica términos de resolución, cantidad de cuotas y montos pactados.',
                logo_herramienta: '📝',
                training_prompt: `ACTUA COMO UN EXPERTO EN CONVENIOS DE PAGO Y RESOLUCIONES ADMINISTRATIVAS DE LA TGR CHILE.
Tu tarea es decodificar el Comprobante de Resolución de Convenio y estructurar sus términos.

ANÁLISIS DE RESOLUCIÓN:
            1. Metadata: Número de Resolución, Fecha, Tipo de Convenio(ej.Administrativo, Judicial).
2. Contribuyente: RUT and Nombre.
3. Plan de Pagos: Monto total consolidado, número de cuotas pactadas, valor de la cuota tipo, fecha de pago inicial.

REGLAS DE EXPERTO:
            - Valida que el RUT sea consistente con la resolución.
- Extrae el desglose de cuotas si está disponible en una tabla.
- Indica claramente el estado del convenio si el documento lo menciona(ej.Aprobado, Pendiente).`,
                behavior_prompt: 'Analiza el comprobante de resolución. Genera el JSON correspondiente al esquema TGR Convenio. Presta especial atención al número de resolución y al plan de pagos.',
                response_format: 'JSON',
                output_format_id: formatTGRConvenio.id,
                json_schema_id: schemaTGRConvenio.id
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 14. RYCE Certificado de TASAS — Tools
        // ═══════════════════════════════════════════════════════════════

        // 14a. JSON Schema — RYCE TASAS Lipigas
        const [schemaRYCETasasLipigas] = await JsonSchema.findOrCreate({
            where: { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a10' },
            defaults: {
                nombre: 'Esquema RYCE Certificado TASAS Lipigas',
                descripcion: 'Estructura para extracción de datos de Certificado de Tasas de Seguridad para el formulario Lipigas (ACHS, Mutual, IST, ISL)',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "RYCE Certificado TASAS Lipigas",
                    "type": "object",
                    "required": ["identificacion_empresa", "identificacion_certificado", "tasas", "datos_operacionales", "datos_incidentes"],
                    "properties": {
                        "identificacion_empresa": {
                            "type": "object",
                            "required": ["razon_social", "rut"],
                            "properties": {
                                "razon_social": { "type": "string" },
                                "rut": { "type": "string" },
                                "numero_adherente": { "type": "string", "description": "N° de asociada/adherente si aplica" },
                                "direccion": { "type": "string" },
                                "actividad_economica": { "type": "string" }
                            }
                        },
                        "identificacion_certificado": {
                            "type": "object",
                            "required": ["mutualidad", "periodo", "fecha_emision"],
                            "properties": {
                                "mutualidad": { "type": "string", "enum": ["ACHS", "MUTUAL_DE_SEGURIDAD", "IST", "ISL"] },
                                "periodo": { "type": "string", "description": "Periodo del certificado (ej: 01/2026, Enero 2026)" },
                                "fecha_emision": { "type": "string", "description": "Fecha de emisión del documento" },
                                "folio": { "type": "string" },
                                "codigo_verificacion": { "type": "string" },
                                "vigencia": { "type": "string" },
                                "cotizacion_basica": { "type": "number", "description": "Cotización básica %" },
                                "cotizacion_adicional": { "type": "number", "description": "Cotización adicional (DS110) %" },
                                "cotizacion_total": { "type": "number", "description": "Cotización total %" },
                                "cad_ciusii": { "type": "number", "description": "CAD CIUSII % si aplica" },
                                "cad_actual": { "type": "number", "description": "CAD Actual % si aplica" }
                            }
                        },
                        "tasas": {
                            "type": "object",
                            "description": "Las 5 tasas principales del certificado (campos 1-5 del formulario)",
                            "required": ["tasa_siniestralidad_inc_temporal", "tasa_siniestralidad_inv_muertes", "indice_accidentabilidad", "tasa_frecuencia", "tasa_gravedad"],
                            "properties": {
                                "tasa_siniestralidad_inc_temporal": { "type": "number", "description": "Campo 1: Tasa de Siniestralidad por Incapacidades Temporales" },
                                "tasa_siniestralidad_inv_muertes": { "type": "number", "description": "Campo 2: Tasa de Siniestralidad por Invalideces y Muertes" },
                                "indice_accidentabilidad": { "type": "number", "description": "Campo 3: Índice de Accidentabilidad" },
                                "tasa_frecuencia": { "type": "number", "description": "Campo 4: Tasa de Frecuencia" },
                                "tasa_gravedad": { "type": "number", "description": "Campo 5: Tasa de Gravedad" },
                                "tasa_siniestralidad_total": { "type": "number", "description": "Tasa de siniestralidad total (si el certificado la incluye)" }
                            }
                        },
                        "datos_operacionales": {
                            "type": "object",
                            "description": "Datos operacionales de la empresa (campos A-B del formulario)",
                            "required": ["dotacion", "horas_hombre"],
                            "properties": {
                                "dotacion": { "type": "number", "description": "Campo A: Número de trabajadores promedio / Promedio de Trabajadores Declarados" },
                                "horas_hombre": { "type": "number", "description": "Campo B: Horas Hombre (HH) estimadas o declaradas" }
                            }
                        },
                        "datos_incidentes": {
                            "type": "object",
                            "description": "Datos de incidentes y enfermedades (campos 6-9 del formulario)",
                            "required": ["dias_perdidos_accidente", "numero_incidentes_reposo_medico", "numero_enfermedades_profesionales", "dias_perdidos_enfermedad_profesional"],
                            "properties": {
                                "dias_perdidos_accidente": { "type": "number", "description": "Campo 6: Días perdidos por accidentes de trabajo" },
                                "numero_incidentes_reposo_medico": { "type": "number", "description": "Campo 7: Número de incidentes con reposo médico" },
                                "numero_enfermedades_profesionales": { "type": "number", "description": "Campo 8: Número de enfermedades profesionales" },
                                "dias_perdidos_enfermedad_profesional": { "type": "number", "description": "Campo 9: Días perdidos por enfermedad profesional" },
                                "numero_accidentes": { "type": "number" },
                                "numero_accidentes_fatales": { "type": "number" },
                                "numero_pensionados": { "type": "number" },
                                "numero_indemnizados": { "type": "number" },
                                "enfermos_profesionales_en_estudio": { "type": "number" }
                            }
                        }
                    }
                })
            }
        });

        // 14b. JSON Schema — RYCE TASAS Blumar
        const [schemaRYCETasasBlumar] = await JsonSchema.findOrCreate({
            where: { id: 'f8a5c3e2-1b9a-4d7e-8c6f-5e4d3c2b1a11' },
            defaults: {
                nombre: 'Esquema RYCE Certificado TASAS Blumar',
                descripcion: 'Estructura para extracción de datos de Certificado de Tasas para Blumar (Magallanes/Cultivo) — incluye columna Datos Blumar',
                schema: JSON.stringify({
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "RYCE Certificado TASAS Blumar",
                    "type": "object",
                    "required": ["identificacion_empresa", "identificacion_certificado", "tasas", "datos_operacionales", "datos_incidentes", "datos_blumar"],
                    "properties": {
                        "identificacion_empresa": {
                            "type": "object",
                            "required": ["razon_social", "rut"],
                            "properties": {
                                "razon_social": { "type": "string" },
                                "rut": { "type": "string" },
                                "numero_adherente": { "type": "string" },
                                "direccion": { "type": "string" },
                                "actividad_economica": { "type": "string" }
                            }
                        },
                        "identificacion_certificado": {
                            "type": "object",
                            "required": ["mutualidad", "periodo", "fecha_emision"],
                            "properties": {
                                "mutualidad": { "type": "string", "enum": ["ACHS", "MUTUAL_DE_SEGURIDAD", "IST", "ISL"] },
                                "periodo": { "type": "string" },
                                "fecha_emision": { "type": "string" },
                                "folio": { "type": "string" },
                                "codigo_verificacion": { "type": "string" },
                                "vigencia": { "type": "string" },
                                "cotizacion_basica": { "type": "number" },
                                "cotizacion_adicional": { "type": "number" },
                                "cotizacion_total": { "type": "number" },
                                "cad_ciusii": { "type": "number" },
                                "cad_actual": { "type": "number" }
                            }
                        },
                        "tasas": {
                            "type": "object",
                            "required": ["tasa_siniestralidad_inc_temporal", "tasa_siniestralidad_inv_muertes", "indice_accidentabilidad", "tasa_frecuencia", "tasa_gravedad"],
                            "properties": {
                                "tasa_siniestralidad_inc_temporal": { "type": "number" },
                                "tasa_siniestralidad_inv_muertes": { "type": "number" },
                                "indice_accidentabilidad": { "type": "number" },
                                "tasa_frecuencia": { "type": "number" },
                                "tasa_gravedad": { "type": "number" },
                                "tasa_siniestralidad_total": { "type": "number" }
                            }
                        },
                        "datos_operacionales": {
                            "type": "object",
                            "required": ["dotacion", "horas_hombre"],
                            "properties": {
                                "dotacion": { "type": "number", "description": "Del certificado (no de Blumar)" },
                                "horas_hombre": { "type": "number", "description": "Del certificado (no de Blumar)" }
                            }
                        },
                        "datos_incidentes": {
                            "type": "object",
                            "required": ["dias_perdidos_accidente", "numero_incidentes_reposo_medico"],
                            "properties": {
                                "dias_perdidos_accidente": { "type": "number" },
                                "numero_incidentes_reposo_medico": { "type": "number" },
                                "numero_enfermedades_profesionales": { "type": "number" },
                                "dias_perdidos_enfermedad_profesional": { "type": "number" },
                                "numero_accidentes": { "type": "number" },
                                "numero_accidentes_fatales": { "type": "number" }
                            }
                        },
                        "datos_blumar": {
                            "type": "object",
                            "description": "Datos específicos de los trabajadores de Blumar (Magallanes/Cultivo). Estos NO salen en el certificado sino que los completa la empresa.",
                            "required": ["dotacion_blumar", "horas_hombre_blumar"],
                            "properties": {
                                "dotacion_blumar": { "type": "number", "description": "Campo A: Dotación de trabajadores Blumar" },
                                "horas_hombre_blumar": { "type": "number", "description": "Campo B: HH Blumar" },
                                "sitio": { "type": "string", "description": "Magallanes o Cultivo" }
                            }
                        }
                    }
                })
            }
        });

        // 14c. Output Format — RYCE TASAS Lipigas
        const [formatRYCETasasLipigas] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e80' },
            defaults: {
                nombre: 'Vista RYCE Certificado TASAS Lipigas',
                tipo: 'reporte',
                category_id: catRYCE.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Certificado de Tasas de Seguridad", "param": "" } },
                    { "id": 2, "type": "subheading", "data": { "text": "Identificación", "param": "" } },
                    { "id": 3, "type": "label", "data": { "text": "Empresa", "param": "identificacion_empresa.razon_social" } },
                    { "id": 4, "type": "label", "data": { "text": "RUT", "param": "identificacion_empresa.rut" } },
                    { "id": 5, "type": "label", "data": { "text": "Mutualidad", "param": "identificacion_certificado.mutualidad" } },
                    { "id": 6, "type": "label", "data": { "text": "Período", "param": "identificacion_certificado.periodo" } },
                    { "id": 7, "type": "label", "data": { "text": "Cotización Adicional %", "param": "identificacion_certificado.cotizacion_adicional" } },
                    { "id": 8, "type": "subheading", "data": { "text": "Tasas (Campos 1-5)", "param": "" } },
                    { "id": 9, "type": "label", "data": { "text": "1. Siniestralidad Inc. Temporal", "param": "tasas.tasa_siniestralidad_inc_temporal" } },
                    { "id": 10, "type": "label", "data": { "text": "2. Siniestralidad Inv. y Muertes", "param": "tasas.tasa_siniestralidad_inv_muertes" } },
                    { "id": 11, "type": "label", "data": { "text": "3. Índice Accidentabilidad", "param": "tasas.indice_accidentabilidad" } },
                    { "id": 12, "type": "label", "data": { "text": "4. Tasa Frecuencia", "param": "tasas.tasa_frecuencia" } },
                    { "id": 13, "type": "label", "data": { "text": "5. Tasa Gravedad", "param": "tasas.tasa_gravedad" } },
                    { "id": 14, "type": "subheading", "data": { "text": "Datos Operacionales (Campos A-B)", "param": "" } },
                    { "id": 15, "type": "label", "data": { "text": "A. Dotación (Trabajadores)", "param": "datos_operacionales.dotacion" } },
                    { "id": 16, "type": "label", "data": { "text": "B. Horas Hombre (HH)", "param": "datos_operacionales.horas_hombre" } },
                    { "id": 17, "type": "subheading", "data": { "text": "Incidentes (Campos 6-9)", "param": "" } },
                    { "id": 18, "type": "label", "data": { "text": "6. Días Perdidos por Accidente", "param": "datos_incidentes.dias_perdidos_accidente" } },
                    { "id": 19, "type": "label", "data": { "text": "7. Incidentes con Reposo Médico", "param": "datos_incidentes.numero_incidentes_reposo_medico" } },
                    { "id": 20, "type": "label", "data": { "text": "8. Enfermedades Profesionales", "param": "datos_incidentes.numero_enfermedades_profesionales" } },
                    { "id": 21, "type": "label", "data": { "text": "9. Días Perdidos Enf. Profesional", "param": "datos_incidentes.dias_perdidos_enfermedad_profesional" } }
                ])
            }
        });

        // 14d. Output Format — RYCE TASAS Blumar
        const [formatRYCETasasBlumar] = await OutputFormat.findOrCreate({
            where: { id: '556a56ca-93b4-4e4d-9ac5-54a77aa15e81' },
            defaults: {
                nombre: 'Vista RYCE Certificado TASAS Blumar',
                tipo: 'reporte',
                category_id: catRYCE.id,
                estructura: JSON.stringify([
                    { "id": 1, "type": "heading", "data": { "text": "Certificado de Tasas — Blumar", "param": "" } },
                    { "id": 2, "type": "subheading", "data": { "text": "Identificación", "param": "" } },
                    { "id": 3, "type": "label", "data": { "text": "Empresa", "param": "identificacion_empresa.razon_social" } },
                    { "id": 4, "type": "label", "data": { "text": "RUT", "param": "identificacion_empresa.rut" } },
                    { "id": 5, "type": "label", "data": { "text": "Mutualidad", "param": "identificacion_certificado.mutualidad" } },
                    { "id": 6, "type": "label", "data": { "text": "Período", "param": "identificacion_certificado.periodo" } },
                    { "id": 7, "type": "subheading", "data": { "text": "Tasas (Campos 1-5)", "param": "" } },
                    { "id": 8, "type": "label", "data": { "text": "1. Siniestralidad Inc. Temporal", "param": "tasas.tasa_siniestralidad_inc_temporal" } },
                    { "id": 9, "type": "label", "data": { "text": "2. Siniestralidad Inv. y Muertes", "param": "tasas.tasa_siniestralidad_inv_muertes" } },
                    { "id": 10, "type": "label", "data": { "text": "3. Índice Accidentabilidad", "param": "tasas.indice_accidentabilidad" } },
                    { "id": 11, "type": "label", "data": { "text": "4. Tasa Frecuencia", "param": "tasas.tasa_frecuencia" } },
                    { "id": 12, "type": "label", "data": { "text": "5. Tasa Gravedad", "param": "tasas.tasa_gravedad" } },
                    { "id": 13, "type": "subheading", "data": { "text": "Datos del Certificado", "param": "" } },
                    { "id": 14, "type": "label", "data": { "text": "Dotación (Certificado)", "param": "datos_operacionales.dotacion" } },
                    { "id": 15, "type": "label", "data": { "text": "HH (Certificado)", "param": "datos_operacionales.horas_hombre" } },
                    { "id": 16, "type": "label", "data": { "text": "6. Días Perdidos Accidente", "param": "datos_incidentes.dias_perdidos_accidente" } },
                    { "id": 17, "type": "label", "data": { "text": "7. Incidentes Reposo Médico", "param": "datos_incidentes.numero_incidentes_reposo_medico" } },
                    { "id": 18, "type": "subheading", "data": { "text": "Datos Blumar (Empresa)", "param": "" } },
                    { "id": 19, "type": "label", "data": { "text": "A. Dotación Blumar", "param": "datos_blumar.dotacion_blumar" } },
                    { "id": 20, "type": "label", "data": { "text": "B. HH Blumar", "param": "datos_blumar.horas_hombre_blumar" } },
                    { "id": 21, "type": "label", "data": { "text": "Sitio", "param": "datos_blumar.sitio" } }
                ])
            }
        });

        // 14e. Tool — RYCE Certificado TASAS Lipigas
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000050' },
            defaults: {
                nombre: 'RYCE Certificado TASAS Lipigas',
                descripcion: 'Extracción inteligente de datos de Certificados de Tasas de Seguridad para el formulario RYCE Lipigas. Soporta ACHS, Mutual de Seguridad, IST e ISL. Genera JSON estructurado con todos los campos que el auditor debe ingresar manualmente.',
                logo_herramienta: '🛡️',
                training_prompt: `ACTÚA COMO UN AUDITOR EXPERTO EN SEGURIDAD LABORAL Y CERTIFICADOS DE TASAS DE MUTUALIDADES CHILENAS.

Tu objetivo es analizar un Certificado de Tasas emitido por una mutualidad chilena (ACHS, Mutual de Seguridad, IST o ISL) y extraer TODOS los datos numéricos necesarios para completar el formulario de validación RYCE.

═══ CAMPOS A EXTRAER OBLIGATORIAMENTE ═══

TASAS (5 campos principales):
1. Tasa de Siniestralidad por Incapacidades Temporales
2. Tasa de Siniestralidad por Invalideces y Muertes (en Mutual se calcula con tabla DS67)
3. Índice de Accidentabilidad (Tasa de Accidentabilidad)
4. Tasa de Frecuencia
5. Tasa de Gravedad

DATOS OPERACIONALES (2 campos):
A. Dotación / Número de Trabajadores Promedio / Promedio de Trabajadores Declarados
B. Horas Hombre (HH) / Horas Hombre Estimadas

DATOS DE INCIDENTES (4 campos):
6. Días Perdidos por Accidentes de Trabajo (Total de Días Perdidos por Accidente)
7. Número de Incidentes con Reposo Médico (N° Accidentados del Trabajo CTP en IST)
8. Número de Enfermedades Profesionales (N° Enfermos Profesionales CTP)
9. Días Perdidos por Enfermedad Profesional (Total de Días Perdidos por Enfermedad)

═══ REGLAS POR TIPO DE MUTUALIDAD ═══

▶ ACHS (Asociación Chilena de Seguridad):
- El certificado se titula "Certificado de Tasas"
- Busca la tabla "Estadística de la empresa" con columnas Periodo
- Incluye: Cotización Básica, Cotización Adicional, Cotización Total
- Campo A = "Número de trabajadores promedio"
- Campo B = "Horas Hombre" (al final del documento, resaltado)
- IMPORTANTE: Los campos de tasas pueden no aparecer explícitamente como "Tasa de..." sino como filas de la tabla estadística

▶ MUTUAL DE SEGURIDAD (C.Ch.C.):
- Se titula "Certificado de Indicadores de Riesgo" o "Certificado de Siniestralidad"
- Campo A = "Promedio de Trabajadores"
- Campo B = "Horas Hombre" (al final)
- IMPORTANTE para campo 2: La Tasa de Siniestralidad por Inv. y Muertes se calcula con FORMULA. Si el documento muestra "Factor de Siniestralidad por Inv. y Muertes" debes buscar en la tabla DS67 (Decreto Supremo 67, Título I, Artículo 04):
  PFIM 0.00-0.10 → TSIM 0 | 0.11-0.30 → 35 | 0.31-0.50 → 70 | 0.51-0.70 → 105 | 0.71-0.90 → 140 | 0.91-1.20 → 175 | 1.21-1.50 → 210 | 1.51-1.80 → 245 | 1.81-2.10 → 280 | 2.11-2.40 → 315 | 2.41-2.70 → 350 | 2.71+ → 385
- Si el doc muestra directamente "Tasa de Siniestralidad por Inv. y Muertes", usa ese valor.

▶ IST (Instituto de Seguridad del Trabajo):
- Se titula "Información Estadística de Accidentes y Enfermedades Profesionales"
- Hay 2 versiones del IST, ambas contienen los mismos campos pero con layout diferente
- Campo A = "Promedio de Trabajadores Declarados" / "Promedio Trabajadores Declarados"
- Campo B = "Horas Hombre Estimadas"
- Incluye campo extra: "CAD CIUSII (%)" y "CAD Actual (%)" = Cotización Adicional
- Campo 2 = "Tasa de Siniestralidad por invalidez y muerte" o "Tasa de Siniestralidad por Inv. y Muertes"
- Campo 8 = "N° Enfermos Profesionales en Estudio"
- Se valida con QR

▶ ISL (Instituto de Seguridad Laboral):
- Se titula "Certificado de Accidentabilidad"
- Este certificado es el que MENOS información entrega
- Solo muestra tabla de Accidentes y Trabajadores por mes (12 meses)
- Campo A = extraer del ÚLTIMO mes de la tabla la columna "Trabajadores" (es la dotación del periodo solicitado)
- Campos de tasas: NO aparecen en el certificado ISL normalmente, reportar como 0 o null
- El RUT aparece SIN formato (sin puntos ni guión), debes formatearlo
- Se valida en: https://validacertificado.isl.gob.cl/

═══ REGLAS GENERALES ═══
- Si un campo no aparece en el certificado, reportar como 0 (cero)
- Los valores numéricos deben ser numéricos (no strings), usar punto decimal
- Identificar correctamente la mutualidad analizando el logo, encabezado o texto del documento
- Los RUT deben presentarse con puntos y guión (ej: 76.159.126-6)
- Extraer folio y código de verificación si están presentes`,
                behavior_prompt: `Analiza el certificado de tasas adjunto. Auto-detecta la mutualidad (ACHS/Mutual/IST/ISL) y extrae los datos según las reglas específicas de cada tipo.

IMPORTANTE:
- Si se proporcionan datos de la empresa en el prompt (RUT, Razón Social), incorpóralos en identificacion_empresa
- Usa las reglas específicas de cada mutualidad para mapear correctamente los campos
- Para Mutual de Seguridad: si aparece "Factor de Siniestralidad por Inv. y Muertes", aplica la tabla PFIM→TSIM del DS67
- Para ISL: extrae la dotación del último mes de la tabla
- Todos los valores de tasas deben ser numéricos con decimales (usar punto decimal)
- Responde SOLO con JSON estructurado siguiendo el esquema proporcionado`,
                response_format: 'JSON',
                output_format_id: formatRYCETasasLipigas.id,
                json_schema_id: schemaRYCETasasLipigas.id
            }
        });

        // 14f. Tool — RYCE Certificado TASAS Blumar
        await Tool.findOrCreate({
            where: { id: 'edb84cda-0000-4a2c-8187-000000000051' },
            defaults: {
                nombre: 'RYCE Certificado TASAS Blumar',
                descripcion: 'Extracción de datos de Certificados de Tasas para el formulario RYCE Blumar (Magallanes/Cultivo). Los campos A (Dotación) y B (HH) de Blumar NO salen en el certificado; son datos de la empresa que se proporcionan en el prompt.',
                logo_herramienta: '🐟',
                training_prompt: `ACTÚA COMO UN AUDITOR EXPERTO EN SEGURIDAD LABORAL Y CERTIFICADOS DE TASAS DE MUTUALIDADES CHILENAS.

Tu objetivo es analizar un Certificado de Tasas emitido por una mutualidad (ACHS, Mutual de Seguridad, IST o ISL) y extraer los datos para el formulario RYCE de BLUMAR.

═══ PARTICULARIDAD BLUMAR ═══
En Blumar (Magallanes y Cultivo), al cargar el Certificado de Tasas se solicita la MISMA información que Lipigas PERO con una diferencia clave:
- Los campos A (Dotación) y B (HH) se refieren a la información de los TRABAJADORES DE BLUMAR, NO del certificado
- Esta información NO sale en el certificado. Las empresas la completan manualmente
- Si estos datos se proporcionan en el prompt, inclúyelos en "datos_blumar"
- Si no se proporcionan, déjalos en 0

═══ CAMPOS A EXTRAER DEL CERTIFICADO ═══

TASAS (5 campos):
1. Tasa de Siniestralidad por Inc. Temporales
2. Tasa de Siniestralidad por Inv. y Muertes
3. Índice Accidentabilidad
4. Tasa Frecuencia
5. Tasa Gravedad

DATOS OPERACIONALES DEL CERTIFICADO:
- Dotación y HH que aparecen en el documento (datos_operacionales)

DATOS DE INCIDENTES:
6. Días Perdidos por Accidente
7. N° de Incidentes con Reposo Médico

DATOS BLUMAR (del prompt, no del certificado):
A. Dotación Blumar
B. HH Blumar

═══ REGLAS POR MUTUALIDAD ═══

▶ ACHS: Certificado de Tasas con tabla estadística completa
▶ MUTUAL: Certificado de Indicadores de Riesgo. TSIM por tabla DS67:
  PFIM 0.00-0.10→0 | 0.11-0.30→35 | 0.31-0.50→70 | 0.51-0.70→105 | 0.71-0.90→140 | 0.91-1.20→175 | 1.21-1.50→210 | 1.51-1.80→245 | 1.81-2.10→280 | 2.11-2.40→315 | 2.41-2.70→350 | 2.71+→385
▶ IST: Información Estadística de Accidentes. CAD Actual = Cotización Adicional
▶ ISL: Certificado de Accidentabilidad. Dotación = último mes tabla Trabajadores

═══ REGLAS GENERALES ═══
- Si un campo no aparece, reportar como 0
- Valores numéricos con punto decimal
- RUT con puntos y guión
- Auto-detectar la mutualidad del documento`,
                behavior_prompt: `Analiza el certificado de tasas adjunto. Auto-detecta la mutualidad.

PROCESO:
1. Identifica la mutualidad por el logo/encabezado
2. Extrae las 5 tasas del certificado
3. Extrae dotación y HH del CERTIFICADO en datos_operacionales
4. Extrae días perdidos e incidentes
5. Si en el prompt se proporcionan datos de trabajadores Blumar (dotación, HH), inclúyelos en datos_blumar
6. Si no se proporcionan datos Blumar, dejar datos_blumar.dotacion_blumar y datos_blumar.horas_hombre_blumar en 0

Responde SOLO con JSON estructurado siguiendo el esquema.`,
                response_format: 'JSON',
                output_format_id: formatRYCETasasBlumar.id,
                json_schema_id: schemaRYCETasasBlumar.id
            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 15. Inputs — Machine Entry Points
        // ═══════════════════════════════════════════════════════════════

        const [inputJSON] = await Input.findOrCreate({
            where: { slug: 'json-input' },
            defaults: {
                nombre: 'JSON',
                descripcion: 'Input manual de texto o JSON estructurado para alimentar el flujo.',
                icono: '📝',
                config_schema: JSON.stringify({
                    value: { type: 'textarea', label: 'Contenido JSON/Texto', placeholder: 'Pega aquí el JSON o texto de entrada...' }
                }),
                activo: true

            }
        });

        // ═══════════════════════════════════════════════════════════════
        // 13. Pre-built Machines (seeded with full graph)
        // ═══════════════════════════════════════════════════════════════


        // ── Machine 1: Verificación Laboral en Lotes ──
        const [machineLotes] = await Machine.findOrCreate({
            where: { id: 'machine-0000-0000-0000-000000000001' },
            defaults: {
                nombre: 'Verificación Laboral en Lotes',
                descripcion: 'Proceso estándar mensual: ingesta de nómina CSV → iteración por trabajador → validación de liquidación individual → recolección de resultados → reporte ejecutivo consolidado.',
                icono: '🏭',
                activo: true
            }
        });

        // Nodes for Machine 1
        const [m1n1] = await MachineNode.findOrCreate({ where: { id: 'mn-lotes-0001' }, defaults: { machine_id: machineLotes.id, node_type: 'tool', tool_id: toolNomina.id, position_x: 50, position_y: 200, config: null } });
        const [m1n2] = await MachineNode.findOrCreate({ where: { id: 'mn-lotes-0002' }, defaults: { machine_id: machineLotes.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 320, position_y: 200, config: JSON.stringify({ input_field: 'lista' }) } });
        const [m1n3] = await MachineNode.findOrCreate({ where: { id: 'mn-lotes-0003' }, defaults: { machine_id: machineLotes.id, node_type: 'tool', tool_id: toolValLiqui.id, position_x: 590, position_y: 200, config: null } });
        const [m1n4] = await MachineNode.findOrCreate({ where: { id: 'mn-lotes-0004' }, defaults: { machine_id: machineLotes.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 200, config: JSON.stringify({ output_field: 'resultados_validacion' }) } });
        const [m1n5] = await MachineNode.findOrCreate({ where: { id: 'mn-lotes-0005' }, defaults: { machine_id: machineLotes.id, node_type: 'tool', tool_id: toolReporteLote.id, position_x: 1130, position_y: 200, config: null } });

        // Connections for Machine 1: linear flow
        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n1.id, target_node_id: m1n2.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n2.id, target_node_id: m1n3.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n3.id, target_node_id: m1n4.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineLotes.id, source_node_id: m1n4.id, target_node_id: m1n5.id }, defaults: { source_handle: null, target_handle: null } });

        // ── Machine 2: Verificación Documental Completa ──
        const [machineDocCompleta] = await Machine.findOrCreate({
            where: { id: 'machine-0000-0000-0000-000000000002' },
            defaults: {
                nombre: 'Verificación Documental Completa',
                descripcion: 'Proceso completo de auditoría: ingesta de nómina → iteración por trabajador → verificación paralela de contrato + certificaciones → recolección → reporte ejecutivo.',
                icono: '🔍',
                activo: true
            }
        });

        // Nodes for Machine 2 (parallel branches for contrato + certificaciones)
        const [m2n1] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0001' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolNomina.id, position_x: 50, position_y: 250, config: null } });
        const [m2n2] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0002' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 320, position_y: 250, config: JSON.stringify({ input_field: 'lista' }) } });
        const [m2n3] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0003' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolContrato.id, position_x: 590, position_y: 120, config: null } });
        const [m2n4] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0004' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolCerts.id, position_x: 590, position_y: 380, config: null } });
        const [m2n5] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0005' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 120, config: JSON.stringify({ output_field: 'contratos_verificados' }) } });
        const [m2n6] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0006' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 860, position_y: 380, config: JSON.stringify({ output_field: 'certificaciones_verificadas' }) } });
        const [m2n7] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0007' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'engine', engine_id: engineMapper.id, position_x: 1130, position_y: 250, config: JSON.stringify({ mappings: [{ from: 'contratos_verificados', to: 'contratos' }, { from: 'certificaciones_verificadas', to: 'certificaciones' }] }) } });
        const [m2n8] = await MachineNode.findOrCreate({ where: { id: 'mn-docs-0008' }, defaults: { machine_id: machineDocCompleta.id, node_type: 'tool', tool_id: toolReporteLote.id, position_x: 1400, position_y: 250, config: null } });

        // Connections for Machine 2: split flow with parallel branches
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n1.id, target_node_id: m2n2.id }, defaults: { source_handle: null, target_handle: null } });
        // Iterator feeds both branches
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n2.id, target_node_id: m2n3.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n2.id, target_node_id: m2n4.id }, defaults: { source_handle: null, target_handle: null } });
        // Each branch collects
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n3.id, target_node_id: m2n5.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n4.id, target_node_id: m2n6.id }, defaults: { source_handle: null, target_handle: null } });
        // Both collectors merge via mapper
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n5.id, target_node_id: m2n7.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n6.id, target_node_id: m2n7.id }, defaults: { source_handle: null, target_handle: null } });
        // Mapper outputs to final report
        await MachineConnection.findOrCreate({ where: { machine_id: machineDocCompleta.id, source_node_id: m2n7.id, target_node_id: m2n8.id }, defaults: { source_handle: null, target_handle: null } });

        // ── Machine 3: Auditoría de Liquidaciones (Demo) ──
        const [machineDemoLiqui] = await Machine.findOrCreate({
            where: { id: 'machine-0000-0000-0000-000000000003' },
            defaults: {
                nombre: 'Auditoría de Liquidaciones (Demo)',
                descripcion: 'Demostración de flujo completo: Extracción de PDF con Tool especializada → Iterador Inteligente → Visor de Mensajes individuales.',
                icono: '📑',
                activo: true
            }
        });

        const [m3n1] = await MachineNode.findOrCreate({ where: { id: 'mn-demo-0001' }, defaults: { machine_id: machineDemoLiqui.id, node_type: 'tool', tool_id: toolDemoLiqui.id, position_x: 50, position_y: 200, config: null } });
        const [m3n2] = await MachineNode.findOrCreate({ where: { id: 'mn-demo-0002' }, defaults: { machine_id: machineDemoLiqui.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 350, position_y: 200, config: JSON.stringify({ input_field: 'lista' }) } });
        const [m3n3] = await MachineNode.findOrCreate({ where: { id: 'mn-demo-0003' }, defaults: { machine_id: machineDemoLiqui.id, node_type: 'engine', engine_id: enginePrinter.id, position_x: 650, position_y: 200, config: null } });
        const [m3n4] = await MachineNode.findOrCreate({ where: { id: 'mn-demo-0004' }, defaults: { machine_id: machineDemoLiqui.id, node_type: 'visor', visor_id: visorMessage.id, position_x: 950, position_y: 200, config: null } });

        await MachineConnection.findOrCreate({ where: { machine_id: machineDemoLiqui.id, source_node_id: m3n1.id, target_node_id: m3n2.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineDemoLiqui.id, source_node_id: m3n2.id, target_node_id: m3n3.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineDemoLiqui.id, source_node_id: m3n3.id, target_node_id: m3n4.id }, defaults: { source_handle: null, target_handle: null } });

        // ── Machine 4: Proceso Liquidaciones en lote Demo v1 ──
        const [machineBatchLiqui] = await Machine.findOrCreate({
            where: { id: 'machine-0000-0000-0000-000000000004' },
            defaults: {
                nombre: 'Proceso Liquidaciones en lote Demo v1',
                descripcion: 'Extracción masiva de liquidaciones → Extracción automática de tabla → Visualización en VISOR Tabla.',
                icono: '📊',
                activo: true
            }
        });

        const [m4n1] = await MachineNode.findOrCreate({ where: { id: 'mn-batch-0001' }, defaults: { machine_id: machineBatchLiqui.id, node_type: 'tool', tool_id: toolDemoLiqui.id, position_x: 50, position_y: 200, config: null } });
        const [m4n2] = await MachineNode.findOrCreate({ where: { id: 'mn-batch-0002' }, defaults: { machine_id: machineBatchLiqui.id, node_type: 'engine', engine_id: engineEntityExtractor.id, position_x: 350, position_y: 200, config: null } });
        const [m4n3] = await MachineNode.findOrCreate({ where: { id: 'mn-batch-0003' }, defaults: { machine_id: machineBatchLiqui.id, node_type: 'visor', visor_id: visorTable.id, position_x: 650, position_y: 200, config: null } });

        await MachineConnection.findOrCreate({ where: { machine_id: machineBatchLiqui.id, source_node_id: m4n1.id, target_node_id: m4n2.id }, defaults: { source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { machine_id: machineBatchLiqui.id, source_node_id: m4n2.id, target_node_id: m4n3.id }, defaults: { source_handle: null, target_handle: null } });

        // ── Machine 5: Auditoría de Deuda TGR ──
        const [machineTGR] = await Machine.findOrCreate({
            where: { id: 'machine-0000-0000-0000-000000000005' },
            defaults: {
                nombre: 'Auditoría de Deuda TGR',
                descripcion: 'Carga masiva de datos + Validación individual contra Certificado de Deuda TGR.',
                icono: '🏦',
                activo: true
            }
        });

        const [m5n1] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000501' }, defaults: { machine_id: machineTGR.id, node_type: 'tool', tool_id: 'edb84cda-0000-4a2c-8187-000000000040', position_x: 50, position_y: 50, config: null } }); // TGR Tool
        const [m5n2] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000502' }, defaults: { machine_id: machineTGR.id, node_type: 'tool', tool_id: 'edb84cda-0000-4a2c-8187-000000000010', position_x: 50, position_y: 350, config: null } }); // Massive Loader
        const [m5n3] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000503' }, defaults: { machine_id: machineTGR.id, node_type: 'engine', engine_id: engineIterator.id, position_x: 350, position_y: 350, config: JSON.stringify({ input_field: 'lista' }) } });
        const [m5n4] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000504' }, defaults: { machine_id: machineTGR.id, node_type: 'engine', engine_id: engineComparator.id, position_x: 650, position_y: 200, config: null } });
        const [m5n5] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000505' }, defaults: { machine_id: machineTGR.id, node_type: 'engine', engine_id: engineCollector.id, position_x: 950, position_y: 200, config: JSON.stringify({ output_field: 'comparaciones' }) } });
        const [m5n6] = await MachineNode.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000506' }, defaults: { machine_id: machineTGR.id, node_type: 'visor', visor_id: visorTable.id, position_x: 1250, position_y: 200, config: null } });

        await MachineConnection.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000551' }, defaults: { machine_id: machineTGR.id, source_node_id: m5n1.id, target_node_id: m5n4.id, source_handle: null, target_handle: null } }); // TGR -> Comparator (Master)
        await MachineConnection.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000552' }, defaults: { machine_id: machineTGR.id, source_node_id: m5n2.id, target_node_id: m5n3.id, source_handle: null, target_handle: null } }); // Loader -> Iterator
        await MachineConnection.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000553' }, defaults: { machine_id: machineTGR.id, source_node_id: m5n3.id, target_node_id: m5n4.id, source_handle: null, target_handle: null } }); // Iterator -> Comparator (Slave)
        await MachineConnection.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000554' }, defaults: { machine_id: machineTGR.id, source_node_id: m5n4.id, target_node_id: m5n5.id, source_handle: null, target_handle: null } });
        await MachineConnection.findOrCreate({ where: { id: '00000000-0000-0000-0000-000000000555' }, defaults: { machine_id: machineTGR.id, source_node_id: m5n5.id, target_node_id: m5n6.id, source_handle: null, target_handle: null } });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error!');
        console.error(JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

seed();
